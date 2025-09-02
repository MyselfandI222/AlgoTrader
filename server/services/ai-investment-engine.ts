/**
 * AI Investment Engine - Automated investment decision making
 * Uses real market data to make intelligent investment decisions
 */

import { marketDataService } from './market-data-service.ts';

export interface AIInvestmentDecision {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  confidence: number; // 0-1
  reasoning: string;
  strategy: string;
}

export interface AISettings {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentAmount: number;
  strategies: string[];
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly';
  maxPositions: number;
}

export class AIInvestmentEngine {
  private settings: AISettings;
  private marketSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL'];
  
  constructor(settings: AISettings) {
    this.settings = settings;
  }

  async analyzeMarketAndMakeDecisions(): Promise<AIInvestmentDecision[]> {
    console.log('🤖 AI Engine: Starting market analysis...');
    
    try {
      // Get current market data
      const marketData = await marketDataService.refreshMarketData();
      const decisions: AIInvestmentDecision[] = [];

      // Analyze each stock based on AI strategies
      for (const stock of marketData) {
        const decision = await this.analyzeStock(stock);
        if (decision) {
          decisions.push(decision);
        }
      }

      console.log(`🤖 AI Engine: Generated ${decisions.length} investment decisions`);
      return decisions;
    } catch (error) {
      console.error('AI Engine error:', error);
      return [];
    }
  }

  private async analyzeStock(stock: any): Promise<AIInvestmentDecision | null> {
    const change = parseFloat(stock.change);
    const changePercent = parseFloat(stock.changePercent);
    const price = parseFloat(stock.price);
    
    // AI Decision Logic based on multiple factors
    let confidence = 0;
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let reasoning = '';
    let strategy = '';

    // Momentum Strategy Analysis
    if (this.settings.strategies.includes('momentum')) {
      if (changePercent > 2 && change > 0) {
        confidence += 0.3;
        action = 'buy';
        reasoning += 'Strong upward momentum detected. ';
        strategy = 'Momentum Growth';
      }
    }

    // Value Analysis
    if (this.settings.strategies.includes('value')) {
      // Simple value analysis based on price patterns
      if (changePercent < -1 && price < this.getHistoricalAverage(stock.symbol)) {
        confidence += 0.25;
        action = action === 'buy' ? 'buy' : 'buy';
        reasoning += 'Potential undervalued opportunity. ';
        strategy = strategy || 'AI Value Discovery';
      }
    }

    // Market Sentiment Analysis
    if (this.settings.strategies.includes('sentiment')) {
      const sentimentScore = this.analyzeSentiment(stock.symbol, changePercent);
      if (sentimentScore > 0.6) {
        confidence += 0.2;
        action = 'buy';
        reasoning += 'Positive market sentiment detected. ';
        strategy = strategy || 'Market Sentiment AI';
      } else if (sentimentScore < 0.4) {
        action = 'sell';
        reasoning += 'Negative sentiment trend. ';
        strategy = strategy || 'Market Sentiment AI';
      }
    }

    // Risk Adjustment
    confidence = this.adjustForRiskTolerance(confidence, changePercent);

    // Calculate position size based on confidence and settings
    const baseQuantity = Math.floor(this.settings.investmentAmount * 0.1 / price); // 10% per position max
    const quantity = Math.max(1, Math.floor(baseQuantity * confidence));

    // Only return decisions above minimum confidence threshold
    if (confidence > 0.4 && action !== 'hold') {
      return {
        symbol: stock.symbol,
        action,
        quantity,
        confidence,
        reasoning: reasoning.trim(),
        strategy: strategy || 'AI Analysis'
      };
    }

    return null;
  }

  private getHistoricalAverage(symbol: string): number {
    // Simplified historical average calculation
    // In a real system, this would use actual historical data
    const basePrices: Record<string, number> = {
      'AAPL': 180,
      'TSLA': 240,
      'NVDA': 800,
      'MSFT': 400,
      'AMZN': 170,
      'GOOGL': 165
    };
    return basePrices[symbol] || 100;
  }

  private analyzeSentiment(symbol: string, changePercent: number): number {
    // Simplified sentiment analysis
    // Positive change = positive sentiment, with some randomness for realism
    const baseSentiment = changePercent > 0 ? 0.7 : 0.3;
    const randomFactor = Math.random() * 0.2 - 0.1; // ±0.1 random adjustment
    return Math.max(0, Math.min(1, baseSentiment + randomFactor));
  }

  private adjustForRiskTolerance(baseConfidence: number, changePercent: number): number {
    switch (this.settings.riskTolerance) {
      case 'conservative':
        // Conservative investors prefer stable, less volatile investments
        if (Math.abs(changePercent) > 5) return baseConfidence * 0.6;
        return baseConfidence * 0.9;
        
      case 'moderate':
        // Moderate risk tolerance
        if (Math.abs(changePercent) > 8) return baseConfidence * 0.8;
        return baseConfidence;
        
      case 'aggressive':
        // Aggressive investors like volatility and high returns
        if (Math.abs(changePercent) > 3) return baseConfidence * 1.2;
        return baseConfidence * 0.9;
        
      default:
        return baseConfidence;
    }
  }

  updateSettings(newSettings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('🤖 AI Engine: Settings updated:', this.settings);
  }

  getSettings(): AISettings {
    return { ...this.settings };
  }
}

// Default AI settings
export const DEFAULT_AI_SETTINGS: AISettings = {
  riskTolerance: 'moderate',
  investmentAmount: 100000, // $100k
  strategies: ['momentum', 'value', 'sentiment'],
  rebalanceFrequency: 'daily',
  maxPositions: 6
};

// Global AI engine instance
export const aiInvestmentEngine = new AIInvestmentEngine(DEFAULT_AI_SETTINGS);