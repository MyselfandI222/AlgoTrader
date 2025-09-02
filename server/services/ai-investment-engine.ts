/**
 * Advanced AI Investment Engine - Intelligent portfolio allocation and optimization
 * Uses sophisticated algorithms for optimal investment decisions
 */

import { marketDataService } from './market-data-service.ts';

export interface AIInvestmentDecision {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  confidence: number; // 0-1
  reasoning: string;
  strategy: string;
  allocationWeight: number; // 0-1, percentage of portfolio
  riskScore: number; // 0-10, higher = riskier
  expectedReturn: number; // Expected return percentage
  priority: 'high' | 'medium' | 'low';
}

export interface AISettings {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentAmount: number;
  strategies: string[];
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly';
  maxPositions: number;
  // Advanced allocation settings
  diversificationTarget: number; // 0.1-0.9, higher = more diversified
  volatilityThreshold: number; // 0.1-0.5, maximum allowed volatility
  correlationLimit: number; // 0.3-0.8, max correlation between positions
  sectorAllocationLimits: Record<string, number>; // sector -> max percentage
  rebalanceThreshold: number; // 0.05-0.2, trigger rebalance when drift exceeds
}

interface MarketAnalysis {
  symbol: string;
  price: number;
  volatility: number;
  momentum: number;
  valueScore: number;
  sentimentScore: number;
  technicalScore: number;
  sector: string;
  marketCap: 'large' | 'mid' | 'small';
}

interface PortfolioAllocation {
  symbol: string;
  targetWeight: number;
  currentWeight: number;
  action: 'buy' | 'sell' | 'hold';
  shares: number;
  priority: number;
}

export class AIInvestmentEngine {
  private settings: AISettings;
  private marketSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL'];
  private sectorMapping = {
    'AAPL': 'Technology',
    'TSLA': 'Automotive',
    'NVDA': 'Technology',
    'MSFT': 'Technology',
    'AMZN': 'Consumer',
    'GOOGL': 'Technology'
  };
  
  constructor(settings: AISettings) {
    this.settings = settings;
  }

  async analyzeMarketAndMakeDecisions(): Promise<AIInvestmentDecision[]> {
    console.log('🧠 Advanced AI Engine: Starting comprehensive market analysis...');
    
    try {
      // Step 1: Get current market data
      const marketData = await marketDataService.refreshMarketData();
      
      // Step 2: Perform advanced market analysis
      const marketAnalysis = await this.performAdvancedMarketAnalysis(marketData);
      
      // Step 3: Calculate optimal portfolio allocation
      const optimalAllocation = await this.calculateOptimalAllocation(marketAnalysis);
      
      // Step 4: Generate investment decisions based on allocation
      const decisions = await this.generateInvestmentDecisions(optimalAllocation, marketAnalysis);
      
      console.log(`🧠 Advanced AI: Generated ${decisions.length} optimized investment decisions`);
      return decisions;
    } catch (error) {
      console.error('Advanced AI Engine error:', error);
      return [];
    }
  }

  private async performAdvancedMarketAnalysis(marketData: any[]): Promise<MarketAnalysis[]> {
    const analyses: MarketAnalysis[] = [];
    
    for (const stock of marketData) {
      const analysis: MarketAnalysis = {
        symbol: stock.symbol,
        price: parseFloat(stock.price),
        volatility: this.calculateVolatility(stock),
        momentum: this.calculateMomentum(stock),
        valueScore: this.calculateValueScore(stock),
        sentimentScore: this.analyzeSentiment(stock.symbol, parseFloat(stock.changePercent)),
        technicalScore: this.calculateTechnicalScore(stock),
        sector: this.sectorMapping[stock.symbol as keyof typeof this.sectorMapping] || 'Unknown',
        marketCap: this.getMarketCapCategory(stock.symbol)
      };
      
      analyses.push(analysis);
    }
    
    return analyses;
  }

  private async calculateOptimalAllocation(analyses: MarketAnalysis[]): Promise<PortfolioAllocation[]> {
    console.log('🧮 Calculating optimal portfolio allocation...');
    
    // Step 1: Score each asset
    const scoredAssets = analyses.map(analysis => ({
      ...analysis,
      compositeScore: this.calculateCompositeScore(analysis)
    })).sort((a, b) => b.compositeScore - a.compositeScore);
    
    // Step 2: Apply diversification constraints
    const allocations: PortfolioAllocation[] = [];
    let remainingWeight = 1.0;
    const sectorWeights: Record<string, number> = {};
    
    for (const asset of scoredAssets) {
      if (allocations.length >= this.settings.maxPositions) break;
      
      // Calculate sector weight
      const currentSectorWeight = sectorWeights[asset.sector] || 0;
      const maxSectorWeight = this.settings.sectorAllocationLimits[asset.sector] || 0.4;
      
      // Calculate base allocation weight
      let targetWeight = Math.min(
        remainingWeight * 0.3, // Max 30% per position initially
        this.calculateAllocationWeight(asset, remainingWeight)
      );
      
      // Apply sector diversification constraint
      const maxAllowedForSector = Math.max(0, maxSectorWeight - currentSectorWeight);
      targetWeight = Math.min(targetWeight, maxAllowedForSector);
      
      if (targetWeight > 0.05) { // Minimum 5% allocation
        allocations.push({
          symbol: asset.symbol,
          targetWeight,
          currentWeight: 0, // Will be updated with actual portfolio data
          action: 'buy',
          shares: 0, // Will be calculated later
          priority: this.calculatePriority(asset.compositeScore)
        });
        
        sectorWeights[asset.sector] = currentSectorWeight + targetWeight;
        remainingWeight -= targetWeight;
      }
    }
    
    return this.normalizeAllocations(allocations);
  }

  private async generateInvestmentDecisions(allocations: PortfolioAllocation[], analyses: MarketAnalysis[]): Promise<AIInvestmentDecision[]> {
    const decisions: AIInvestmentDecision[] = [];
    
    for (const allocation of allocations) {
      const analysis = analyses.find(a => a.symbol === allocation.symbol);
      if (!analysis) continue;
      
      const targetValue = this.settings.investmentAmount * allocation.targetWeight;
      const shares = Math.floor(targetValue / analysis.price);
      
      if (shares > 0) {
        const decision: AIInvestmentDecision = {
          symbol: allocation.symbol,
          action: allocation.action,
          quantity: shares,
          confidence: Math.min(0.95, analysis.sentimentScore + (allocation.targetWeight * 2)),
          reasoning: this.generateReasoning(analysis, allocation),
          strategy: this.determineStrategy(analysis),
          allocationWeight: allocation.targetWeight,
          riskScore: this.calculateRiskScore(analysis),
          expectedReturn: this.calculateExpectedReturn(analysis),
          priority: allocation.priority > 0.7 ? 'high' : allocation.priority > 0.4 ? 'medium' : 'low'
        };
        
        decisions.push(decision);
      }
    }
    
    return decisions;
  }

  // Advanced calculation methods
  private calculateVolatility(stock: any): number {
    const changePercent = Math.abs(parseFloat(stock.changePercent));
    return Math.min(1.0, changePercent / 10); // Normalize to 0-1
  }

  private calculateMomentum(stock: any): number {
    const changePercent = parseFloat(stock.changePercent);
    return Math.max(0, Math.min(1.0, (changePercent + 10) / 20)); // Normalize -10% to +10% -> 0 to 1
  }

  private calculateValueScore(stock: any): number {
    const price = parseFloat(stock.price);
    const historicalAverage = this.getHistoricalAverage(stock.symbol);
    return Math.max(0, Math.min(1.0, 1 - (price - historicalAverage) / historicalAverage));
  }

  private calculateTechnicalScore(stock: any): number {
    const change = parseFloat(stock.change);
    const changePercent = parseFloat(stock.changePercent);
    
    // Simple technical analysis based on price action
    let score = 0.5; // Neutral
    if (change > 0 && changePercent > 1) score += 0.3;
    if (changePercent > 3) score += 0.2;
    if (changePercent < -3) score -= 0.3;
    
    return Math.max(0, Math.min(1.0, score));
  }

  private calculateCompositeScore(analysis: MarketAnalysis): number {
    const weights = {
      momentum: 0.25,
      value: 0.20,
      sentiment: 0.20,
      technical: 0.25,
      volatility: -0.10 // Lower volatility is better
    };
    
    return (
      analysis.momentum * weights.momentum +
      analysis.valueScore * weights.value +
      analysis.sentimentScore * weights.sentiment +
      analysis.technicalScore * weights.technical +
      (1 - analysis.volatility) * Math.abs(weights.volatility)
    );
  }

  private calculateAllocationWeight(asset: MarketAnalysis & { compositeScore: number }, remainingWeight: number): number {
    const baseWeight = asset.compositeScore * 0.4; // Max 40% based on score
    const volatilityAdjustment = 1 - (asset.volatility * 0.5); // Reduce allocation for high volatility
    
    return Math.min(remainingWeight, baseWeight * volatilityAdjustment);
  }

  private calculatePriority(compositeScore: number): number {
    return Math.min(1.0, Math.max(0, compositeScore));
  }

  private normalizeAllocations(allocations: PortfolioAllocation[]): PortfolioAllocation[] {
    const totalWeight = allocations.reduce((sum, alloc) => sum + alloc.targetWeight, 0);
    
    if (totalWeight > 0) {
      return allocations.map(alloc => ({
        ...alloc,
        targetWeight: alloc.targetWeight / totalWeight
      }));
    }
    
    return allocations;
  }

  private generateReasoning(analysis: MarketAnalysis, allocation: PortfolioAllocation): string {
    const reasons = [];
    
    if (analysis.momentum > 0.7) reasons.push('Strong momentum signal');
    if (analysis.valueScore > 0.6) reasons.push('Attractive valuation');
    if (analysis.sentimentScore > 0.7) reasons.push('Positive sentiment');
    if (analysis.technicalScore > 0.6) reasons.push('Favorable technicals');
    if (allocation.targetWeight > 0.15) reasons.push('High conviction position');
    
    return reasons.length > 0 ? reasons.join(', ') + '.' : 'Balanced risk-return profile.';
  }

  private determineStrategy(analysis: MarketAnalysis): string {
    if (analysis.momentum > 0.7) return 'Momentum Growth';
    if (analysis.valueScore > 0.7) return 'AI Value Discovery';
    if (analysis.sentimentScore > 0.8) return 'Market Sentiment AI';
    if (analysis.volatility > 0.6) return 'Volatility Harvesting';
    return 'Balanced AI Strategy';
  }

  private calculateRiskScore(analysis: MarketAnalysis): number {
    const volatilityRisk = analysis.volatility * 4; // 0-4
    const sectorRisk = analysis.sector === 'Technology' ? 2 : 1; // Tech is riskier
    const momentumRisk = analysis.momentum < 0.3 ? 2 : 0; // Low momentum adds risk
    
    return Math.min(10, volatilityRisk + sectorRisk + momentumRisk);
  }

  private calculateExpectedReturn(analysis: MarketAnalysis): number {
    const baseReturn = analysis.compositeScore * 15; // 0-15% base
    const momentumBonus = analysis.momentum * 5; // Up to 5% momentum bonus
    const volatilityPenalty = analysis.volatility * 3; // Up to 3% volatility penalty
    
    return Math.max(0, baseReturn + momentumBonus - volatilityPenalty);
  }

  private getMarketCapCategory(symbol: string): 'large' | 'mid' | 'small' {
    const largeCaps = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
    return largeCaps.includes(symbol) ? 'large' : 'mid';
  }

  private getHistoricalAverage(symbol: string): number {
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

// Default AI settings with advanced allocation parameters
export const DEFAULT_AI_SETTINGS: AISettings = {
  riskTolerance: 'moderate',
  investmentAmount: 100000, // $100k
  strategies: ['momentum', 'value', 'sentiment'],
  rebalanceFrequency: 'daily',
  maxPositions: 6,
  // Advanced allocation settings
  diversificationTarget: 0.7, // 70% diversification target
  volatilityThreshold: 0.25, // 25% max volatility
  correlationLimit: 0.6, // 60% max correlation
  sectorAllocationLimits: {
    'Technology': 0.4,
    'Consumer': 0.3,
    'Automotive': 0.2,
    'Healthcare': 0.3,
    'Financial': 0.25
  },
  rebalanceThreshold: 0.1 // 10% drift triggers rebalance
};

// Global AI engine instance
export const aiInvestmentEngine = new AIInvestmentEngine(DEFAULT_AI_SETTINGS);