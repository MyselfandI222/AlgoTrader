/**
 * Advanced Risk Exit Engine
 * Multi-factor risk assessment system for sophisticated exit decisions
 */

import { marketDataService } from './market-data-service.ts';

export type Side = 'long' | 'short';

export interface Position {
  symbol: string;
  side: Side;
  qty: number;
  entryPrice: number;
  entryTime: Date;
  riskPerShare: number; // initial ATR * k; used for R-multiples
  stopPrice: number; // active stop (will trail)
  takeProfitLevels: number[]; // in R multiples, e.g., [1.0, 2.0]
  scaleOutPercents: number[]; // e.g., [0.5, 0.25]
  barsHeld: number;
  peakUnrealized: number; // max in-R since entry
  realizedScaleouts: number; // how many TP levels hit
  extraState: Record<string, any>;
}

export interface RiskConfig {
  // Stops
  initialAtrMult: number; // 2.0
  chandelierMult: number; // 3.0
  chandelierLookback: number; // 22

  // Factors (0..1 weights sum can be >1; we clamp final score)
  wMomentum: number; // 0.22
  wVolExpansion: number; // 0.18
  wRsiStress: number; // 0.18
  wStructureBreak: number; // 0.22
  wDrawdown: number; // 0.12
  wTime: number; // 0.08

  // Threshold for composite exit
  exitThreshold: number; // 0.70 - >= triggers exit

  // Momentum settings
  emaFast: number; // 8
  emaSlow: number; // 21

  // Vol expansion: ATR percentile vs lookback window
  volWindow: number; // 50
  volPctForExit: number; // 0.70 - top 30% ATR expansion

  // RSI stress thresholds
  rsiLen: number; // 14
  rsiExitLong: number; // 30.0 - oversold w/ other signs -> risk up
  rsiExitShort: number; // 70.0 - overbought for shorts

  // Structure break lookback since entry
  structureLookback: number; // 10

  // Drawdown & time
  maxIntradeDrawdownR: number; // 0.75 - if you give back >=75% of peak R, push exit score higher
  maxBarsInTrade: number; // 200 - hard time cap (bars)

  // Partial take-profits
  enableScaleOuts: boolean; // true

  // Safety clamps
  minBarsForIndicators: number; // 30
}

interface MarketBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Calculated indicators
  atr?: number;
  rsi?: number;
  emaFast?: number;
  emaSlow?: number;
  chandelierLong?: number;
  chandelierShort?: number;
  atrPctRank?: number;
}

export class RiskExitEngine {
  private config: RiskConfig;
  private marketData: Map<string, MarketBar[]> = new Map();

  constructor(config?: Partial<RiskConfig>) {
    this.config = {
      initialAtrMult: 2.0,
      chandelierMult: 3.0,
      chandelierLookback: 22,
      wMomentum: 0.22,
      wVolExpansion: 0.18,
      wRsiStress: 0.18,
      wStructureBreak: 0.22,
      wDrawdown: 0.12,
      wTime: 0.08,
      exitThreshold: 0.70,
      emaFast: 8,
      emaSlow: 21,
      volWindow: 50,
      volPctForExit: 0.70,
      rsiLen: 14,
      rsiExitLong: 30.0,
      rsiExitShort: 70.0,
      structureLookback: 10,
      maxIntradeDrawdownR: 0.75,
      maxBarsInTrade: 200,
      enableScaleOuts: true,
      minBarsForIndicators: 30,
      ...config
    };
  }

  // Technical Analysis Helpers
  private calculateRSI(closes: number[], length: number = 14): number[] {
    if (closes.length < length + 1) return closes.map(() => 50);
    
    const rsiValues: number[] = [];
    let avgGain = 0;
    let avgLoss = 0;
    
    // Calculate initial averages
    for (let i = 1; i <= length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) avgGain += change;
      else avgLoss += Math.abs(change);
    }
    avgGain /= length;
    avgLoss /= length;
    
    // Fill initial values
    for (let i = 0; i < length; i++) {
      rsiValues.push(50);
    }
    
    // Calculate RSI for remaining values
    for (let i = length; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = (avgGain * (length - 1) + gain) / length;
      avgLoss = (avgLoss * (length - 1) + loss) / length;
      
      const rs = avgGain / (avgLoss || 0.001);
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
    
    return rsiValues;
  }

  private calculateEMA(values: number[], length: number): number[] {
    if (values.length === 0) return [];
    
    const ema: number[] = [];
    const multiplier = 2 / (length + 1);
    
    ema[0] = values[0];
    for (let i = 1; i < values.length; i++) {
      ema[i] = (values[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateATR(bars: MarketBar[], length: number = 14): number[] {
    if (bars.length < 2) return bars.map(() => 0);
    
    const trueRanges: number[] = [];
    for (let i = 1; i < bars.length; i++) {
      const high = bars[i].high;
      const low = bars[i].low;
      const prevClose = bars[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }
    
    const atrValues = [trueRanges[0] || 0];
    const multiplier = 1 / length;
    
    for (let i = 1; i < trueRanges.length; i++) {
      atrValues.push(atrValues[i - 1] * (1 - multiplier) + trueRanges[i] * multiplier);
    }
    
    return [0, ...atrValues]; // Pad first value
  }

  private calculateChandelierExit(bars: MarketBar[], atrMult: number, lookback: number, isLong: boolean): number[] {
    const atrValues = this.calculateATR(bars, lookback);
    const results: number[] = [];
    
    for (let i = 0; i < bars.length; i++) {
      if (i < lookback - 1) {
        results.push(NaN);
        continue;
      }
      
      const lookbackBars = bars.slice(Math.max(0, i - lookback + 1), i + 1);
      const atr = atrValues[i] || 0;
      
      if (isLong) {
        const highestHigh = Math.max(...lookbackBars.map(b => b.high));
        results.push(highestHigh - atrMult * atr);
      } else {
        const lowestLow = Math.min(...lookbackBars.map(b => b.low));
        results.push(lowestLow + atrMult * atr);
      }
    }
    
    return results;
  }

  // Risk Factor Calculations
  private calculateMomentumFlag(position: Position, bars: MarketBar[], currentIndex: number): number {
    const current = bars[currentIndex];
    const prev = currentIndex > 0 ? bars[currentIndex - 1] : current;
    
    if (!current.emaFast || !current.emaSlow || !prev.emaFast || !prev.emaSlow) return 0;
    
    const fastBelowSlow = current.emaFast < current.emaSlow;
    const fastSlope = current.emaFast - prev.emaFast;
    const slowSlope = current.emaSlow - prev.emaSlow;
    
    if (position.side === 'long') {
      const crossBad = fastBelowSlow ? 1.0 : 0.0;
      const slopeBad = (fastSlope < 0 && slowSlope < 0) ? 1.0 : 0.0;
      return Math.max(crossBad, slopeBad);
    } else {
      const crossBad = !fastBelowSlow ? 1.0 : 0.0;
      const slopeBad = (fastSlope > 0 && slowSlope > 0) ? 1.0 : 0.0;
      return Math.max(crossBad, slopeBad);
    }
  }

  private calculateVolExpansionFlag(currentBar: MarketBar): number {
    return (currentBar.atrPctRank || 0) >= this.config.volPctForExit ? 1.0 : 0.0;
  }

  private calculateRSIStress(position: Position, rsiValue: number): number {
    if (position.side === 'long') {
      return Math.max(0, Math.min(1, (this.config.rsiExitLong - rsiValue) / 20));
    } else {
      return Math.max(0, Math.min(1, (rsiValue - this.config.rsiExitShort) / 20));
    }
  }

  private calculateStructureBreak(position: Position, bars: MarketBar[], currentIndex: number): number {
    const lookback = Math.min(this.config.structureLookback, currentIndex);
    if (lookback < 2) return 0;
    
    const window = bars.slice(currentIndex - lookback + 1, currentIndex + 1);
    const currentClose = bars[currentIndex].close;
    
    if (position.side === 'long') {
      const minClose = Math.min(...window.map(b => b.close));
      return currentClose < minClose ? 1.0 : 0.0;
    } else {
      const maxClose = Math.max(...window.map(b => b.close));
      return currentClose > maxClose ? 1.0 : 0.0;
    }
  }

  private calculateDrawdownComponent(position: Position, currentPrice: number): number {
    const rNow = this.getRMultiple(position, currentPrice);
    position.peakUnrealized = Math.max(position.peakUnrealized, rNow);
    const giveback = position.peakUnrealized - rNow;
    return Math.max(0, Math.min(1, giveback / this.config.maxIntradeDrawdownR));
  }

  private calculateTimeComponent(position: Position): number {
    return Math.max(0, Math.min(1, position.barsHeld / this.config.maxBarsInTrade));
  }

  // Utility Methods
  private getRMultiple(position: Position, currentPrice: number): number {
    if (position.riskPerShare <= 0) return 0;
    const direction = position.side === 'long' ? 1 : -1;
    const move = (currentPrice - position.entryPrice) * direction;
    return move / position.riskPerShare;
  }

  private updateTrailingStop(position: Position, currentBar: MarketBar): number {
    const chandelier = position.side === 'long' ? currentBar.chandelierLong : currentBar.chandelierShort;
    if (chandelier === undefined || isNaN(chandelier)) return position.stopPrice;
    
    if (position.side === 'long') {
      return Math.max(position.stopPrice, chandelier);
    } else {
      return Math.min(position.stopPrice, chandelier);
    }
  }

  private checkHardStopHit(position: Position, currentPrice: number): boolean {
    if (position.side === 'long') {
      return currentPrice <= position.stopPrice;
    } else {
      return currentPrice >= position.stopPrice;
    }
  }

  // Main Analysis Method
  public async analyzePosition(position: Position): Promise<{
    action: 'hold' | 'exit' | 'scale_out';
    reason: string;
    confidence: number;
    factors: Record<string, number>;
    newStopPrice?: number;
    scaleOutInfo?: { qty: number; targetR: number; targetPrice: number };
  }> {
    try {
      // Get market data for the symbol
      const marketData = await marketDataService.refreshMarketData();
      const stockData = marketData.find(stock => stock.symbol === position.symbol);
      
      if (!stockData) {
        return {
          action: 'hold',
          reason: 'No market data available',
          confidence: 0,
          factors: {}
        };
      }

      const currentPrice = parseFloat(stockData.price);
      const currentBar: MarketBar = {
        timestamp: new Date(),
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: 0
      };

      // Simulate historical data for calculations (in production, you'd have real historical data)
      const bars = this.generateMockBars(currentBar, 100);
      this.prepareIndicators(bars);
      
      const currentIndex = bars.length - 1;
      
      // Update position state
      position.barsHeld += 1;
      
      // Set initial stop if not set
      if (isNaN(position.stopPrice)) {
        const atr = bars[currentIndex].atr || (currentPrice * 0.02); // 2% fallback
        position.stopPrice = position.side === 'long' 
          ? position.entryPrice - this.config.initialAtrMult * atr
          : position.entryPrice + this.config.initialAtrMult * atr;
      }

      // Update trailing stop
      const newStopPrice = this.updateTrailingStop(position, bars[currentIndex]);
      position.stopPrice = newStopPrice;

      // Check hard stop hit
      if (this.checkHardStopHit(position, currentPrice)) {
        return {
          action: 'exit',
          reason: 'Hard stop-loss hit',
          confidence: 1.0,
          factors: { hard_stop: 1.0 },
          newStopPrice
        };
      }

      // Check scale-out opportunities
      if (this.config.enableScaleOuts) {
        const scaleOut = this.checkScaleOut(position, currentPrice);
        if (scaleOut) {
          return {
            action: 'scale_out',
            reason: `Take profit at ${scaleOut.targetR}R level`,
            confidence: 0.9,
            factors: { take_profit: 1.0 },
            newStopPrice,
            scaleOutInfo: scaleOut
          };
        }
      }

      // Calculate composite risk factors
      const factors = {
        momentum: this.calculateMomentumFlag(position, bars, currentIndex),
        volExpansion: this.calculateVolExpansionFlag(bars[currentIndex]),
        rsiStress: this.calculateRSIStress(position, bars[currentIndex].rsi || 50),
        structureBreak: this.calculateStructureBreak(position, bars, currentIndex),
        drawdown: this.calculateDrawdownComponent(position, currentPrice),
        time: this.calculateTimeComponent(position)
      };

      // Calculate composite exit score
      const exitScore = 
        this.config.wMomentum * factors.momentum +
        this.config.wVolExpansion * factors.volExpansion +
        this.config.wRsiStress * factors.rsiStress +
        this.config.wStructureBreak * factors.structureBreak +
        this.config.wDrawdown * factors.drawdown +
        this.config.wTime * factors.time;

      const clampedScore = Math.max(0, Math.min(1, exitScore));

      if (clampedScore >= this.config.exitThreshold) {
        const dominantFactor = Object.entries(factors)
          .reduce((a, b) => factors[a[0] as keyof typeof factors] > factors[b[0] as keyof typeof factors] ? a : b)[0];
        
        return {
          action: 'exit',
          reason: `Composite risk score ${(clampedScore * 100).toFixed(1)}% (dominated by ${dominantFactor})`,
          confidence: clampedScore,
          factors,
          newStopPrice
        };
      }

      return {
        action: 'hold',
        reason: `Risk manageable: ${(clampedScore * 100).toFixed(1)}% risk score`,
        confidence: 1 - clampedScore,
        factors,
        newStopPrice
      };

    } catch (error) {
      console.error('Risk analysis error:', error);
      return {
        action: 'hold',
        reason: 'Error in risk analysis',
        confidence: 0,
        factors: {}
      };
    }
  }

  private checkScaleOut(position: Position, currentPrice: number): { qty: number; targetR: number; targetPrice: number } | null {
    if (position.realizedScaleouts >= position.takeProfitLevels.length) return null;
    
    const targetR = position.takeProfitLevels[position.realizedScaleouts];
    const direction = position.side === 'long' ? 1 : -1;
    const targetPrice = position.entryPrice + targetR * position.riskPerShare * direction;
    
    const hit = position.side === 'long' ? currentPrice >= targetPrice : currentPrice <= targetPrice;
    
    if (hit) {
      const scalePercent = position.scaleOutPercents[Math.min(position.realizedScaleouts, position.scaleOutPercents.length - 1)];
      const qtyToSell = position.qty * scalePercent;
      
      position.qty = Math.max(0, position.qty - qtyToSell);
      position.realizedScaleouts += 1;
      
      // Lock in profits after first scale-out
      if (position.side === 'long') {
        position.stopPrice = Math.max(position.stopPrice, position.entryPrice);
      } else {
        position.stopPrice = Math.min(position.stopPrice, position.entryPrice);
      }
      
      return { qty: qtyToSell, targetR, targetPrice };
    }
    
    return null;
  }

  private generateMockBars(currentBar: MarketBar, count: number): MarketBar[] {
    const bars: MarketBar[] = [];
    const basePrice = currentBar.close;
    
    for (let i = 0; i < count; i++) {
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      const price = basePrice * (1 + variation * (count - i) / count);
      
      bars.push({
        timestamp: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000),
        open: price * (1 + (Math.random() - 0.5) * 0.01),
        high: price * (1 + Math.random() * 0.015),
        low: price * (1 - Math.random() * 0.015),
        close: price,
        volume: Math.floor(Math.random() * 1000000)
      });
    }
    
    return bars;
  }

  private prepareIndicators(bars: MarketBar[]): void {
    const closes = bars.map(b => b.close);
    const atrValues = this.calculateATR(bars, this.config.rsiLen);
    const rsiValues = this.calculateRSI(closes, this.config.rsiLen);
    const emaFastValues = this.calculateEMA(closes, this.config.emaFast);
    const emaSlowValues = this.calculateEMA(closes, this.config.emaSlow);
    const chandelierLong = this.calculateChandelierExit(bars, this.config.chandelierMult, this.config.chandelierLookback, true);
    const chandelierShort = this.calculateChandelierExit(bars, this.config.chandelierMult, this.config.chandelierLookback, false);

    // Calculate ATR percentile rank
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      bar.atr = atrValues[i];
      bar.rsi = rsiValues[i];
      bar.emaFast = emaFastValues[i];
      bar.emaSlow = emaSlowValues[i];
      bar.chandelierLong = chandelierLong[i];
      bar.chandelierShort = chandelierShort[i];
      
      // ATR percentile rank
      if (i >= this.config.volWindow - 1) {
        const window = atrValues.slice(i - this.config.volWindow + 1, i + 1);
        const sorted = [...window].sort((a, b) => a - b);
        const rank = sorted.indexOf(atrValues[i]) + 1;
        bar.atrPctRank = rank / window.length;
      } else {
        bar.atrPctRank = 0.5;
      }
    }
  }

  public updateConfig(newConfig: Partial<RiskConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): RiskConfig {
    return { ...this.config };
  }
}

// Default configuration
export const defaultRiskConfig: RiskConfig = {
  initialAtrMult: 2.0,
  chandelierMult: 3.0,
  chandelierLookback: 22,
  wMomentum: 0.22,
  wVolExpansion: 0.18,
  wRsiStress: 0.18,
  wStructureBreak: 0.22,
  wDrawdown: 0.12,
  wTime: 0.08,
  exitThreshold: 0.70,
  emaFast: 8,
  emaSlow: 21,
  volWindow: 50,
  volPctForExit: 0.70,
  rsiLen: 14,
  rsiExitLong: 30.0,
  rsiExitShort: 70.0,
  structureLookback: 10,
  maxIntradeDrawdownR: 0.75,
  maxBarsInTrade: 200,
  enableScaleOuts: true,
  minBarsForIndicators: 30
};

// Global instance
export const riskExitEngine = new RiskExitEngine(defaultRiskConfig);