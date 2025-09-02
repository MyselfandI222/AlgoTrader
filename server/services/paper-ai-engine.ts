/**
 * Paper Trading AI Engine - Uses the same advanced allocation algorithm for paper trading
 */

import { aiInvestmentEngine, AIInvestmentDecision, AISettings } from './ai-investment-engine.ts';
import { marketDataService } from './market-data-service.ts';

interface PaperTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: Date;
  reasoning: string;
  strategy: string;
}

export class PaperAIEngine {
  private paperBalance: number = 100000;
  private paperPositions: Map<string, { quantity: number; averagePrice: number }> = new Map();
  private paperTrades: PaperTrade[] = [];
  private paperSettings: AISettings | null = null;

  updateSettings(settings: AISettings): void {
    this.paperSettings = settings;
    console.log('🧪 Paper AI settings updated:', settings);
  }

  getSettings(): AISettings | null {
    return this.paperSettings;
  }

  async analyzeAndExecutePaperTrades(): Promise<{
    decisions: AIInvestmentDecision[];
    executedTrades: PaperTrade[];
    newBalance: number;
    newPositions: Array<{ symbol: string; quantity: number; averagePrice: number; currentPrice: number; marketValue: number; pnl: number }>;
  }> {
    console.log('🧪 Paper AI Engine: Starting advanced analysis...');
    
    try {
      // Use the same AI engine for decision making
      const decisions = await aiInvestmentEngine.analyzeMarketAndMakeDecisions();
      const executedTrades: PaperTrade[] = [];
      
      // Get current market data for execution
      const marketData = await marketDataService.refreshMarketData();
      
      // Execute decisions in paper trading environment
      for (const decision of decisions) {
        if (decision.action !== 'hold') {
          const marketStock = marketData.find(stock => stock.symbol === decision.symbol);
          if (marketStock) {
            const price = parseFloat(marketStock.price);
            const trade = await this.executePaperTrade(decision, price);
            if (trade) {
              executedTrades.push(trade);
            }
          }
        }
      }
      
      // Calculate current position values
      const currentPositions = await this.calculateCurrentPositions(marketData);
      
      console.log(`🧪 Paper AI: Executed ${executedTrades.length} trades, Balance: $${this.paperBalance.toFixed(2)}`);
      
      return {
        decisions,
        executedTrades,
        newBalance: this.paperBalance,
        newPositions: currentPositions
      };
    } catch (error) {
      console.error('Paper AI Engine error:', error);
      return {
        decisions: [],
        executedTrades: [],
        newBalance: this.paperBalance,
        newPositions: []
      };
    }
  }

  private async executePaperTrade(decision: AIInvestmentDecision, price: number): Promise<PaperTrade | null> {
    const tradeValue = decision.quantity * price;
    
    if (decision.action === 'buy') {
      // Check if we have enough paper balance
      if (this.paperBalance >= tradeValue) {
        this.paperBalance -= tradeValue;
        
        // Update paper position
        const currentPos = this.paperPositions.get(decision.symbol) || { quantity: 0, averagePrice: 0 };
        const newQuantity = currentPos.quantity + decision.quantity;
        const newAveragePrice = newQuantity > 0 
          ? ((currentPos.quantity * currentPos.averagePrice) + (decision.quantity * price)) / newQuantity
          : price;
        
        this.paperPositions.set(decision.symbol, {
          quantity: newQuantity,
          averagePrice: newAveragePrice
        });
        
        const trade: PaperTrade = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          symbol: decision.symbol,
          side: 'buy',
          quantity: decision.quantity,
          price,
          timestamp: new Date(),
          reasoning: decision.reasoning,
          strategy: decision.strategy
        };
        
        this.paperTrades.unshift(trade);
        console.log(`🧪 Paper AI bought ${decision.quantity} ${decision.symbol} @ $${price} - ${decision.reasoning}`);
        
        return trade;
      } else {
        console.log(`❌ Insufficient paper funds for ${decision.symbol} purchase`);
      }
    } else if (decision.action === 'sell') {
      const currentPos = this.paperPositions.get(decision.symbol);
      if (currentPos && currentPos.quantity >= decision.quantity) {
        this.paperBalance += tradeValue;
        
        const newQuantity = currentPos.quantity - decision.quantity;
        if (newQuantity > 0) {
          this.paperPositions.set(decision.symbol, {
            quantity: newQuantity,
            averagePrice: currentPos.averagePrice
          });
        } else {
          this.paperPositions.delete(decision.symbol);
        }
        
        const trade: PaperTrade = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          symbol: decision.symbol,
          side: 'sell',
          quantity: decision.quantity,
          price,
          timestamp: new Date(),
          reasoning: decision.reasoning,
          strategy: decision.strategy
        };
        
        this.paperTrades.unshift(trade);
        console.log(`🧪 Paper AI sold ${decision.quantity} ${decision.symbol} @ $${price} - ${decision.reasoning}`);
        
        return trade;
      } else {
        console.log(`❌ Insufficient ${decision.symbol} position for sale`);
      }
    }
    
    return null;
  }

  private async calculateCurrentPositions(marketData: any[]): Promise<Array<{ symbol: string; quantity: number; averagePrice: number; currentPrice: number; marketValue: number; pnl: number }>> {
    const positions = [];
    
    for (const [symbol, position] of Array.from(this.paperPositions.entries())) {
      const marketStock = marketData.find(stock => stock.symbol === symbol);
      if (marketStock) {
        const currentPrice = parseFloat(marketStock.price);
        const marketValue = position.quantity * currentPrice;
        const pnl = (currentPrice - position.averagePrice) * position.quantity;
        
        positions.push({
          symbol,
          quantity: position.quantity,
          averagePrice: position.averagePrice,
          currentPrice,
          marketValue,
          pnl
        });
      }
    }
    
    return positions;
  }

  getPaperBalance(): number {
    return this.paperBalance;
  }

  getPaperPositions(): Map<string, { quantity: number; averagePrice: number }> {
    return new Map(this.paperPositions);
  }

  getPaperTrades(): PaperTrade[] {
    return [...this.paperTrades];
  }

  resetPaperAccount(): void {
    this.paperBalance = 100000;
    this.paperPositions.clear();
    this.paperTrades = [];
    console.log('🧪 Paper trading account reset');
  }
}

// Global paper AI engine instance
export const paperAIEngine = new PaperAIEngine();