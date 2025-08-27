import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useTradingData } from "@/hooks/use-trading-data";
import { Brain, TrendingUp, Shield, Zap, BarChart3, Target, Settings } from "lucide-react";

const STRATEGY_TYPES = [
  {
    id: "momentum",
    name: "Momentum Growth",
    description: "Identifies stocks with strong upward price momentum and growing volume",
    icon: TrendingUp,
    riskLevel: "Medium",
    timeframe: "Short-term",
    sectors: ["Technology", "Healthcare", "Energy"],
    indicators: ["RSI", "MACD", "Volume", "Price Action"]
  },
  {
    id: "value",
    name: "AI Value Discovery",
    description: "Machine learning analysis of fundamentals to find undervalued companies",
    icon: Target,
    riskLevel: "Low",
    timeframe: "Long-term", 
    sectors: ["Financials", "Industrials", "Consumer"],
    indicators: ["P/E Ratio", "Book Value", "Debt Levels", "Earnings Growth"]
  },
  {
    id: "sentiment",
    name: "Market Sentiment AI",
    description: "Analyzes news, social media, and market sentiment for trading signals",
    icon: Brain,
    riskLevel: "Medium",
    timeframe: "Medium-term",
    sectors: ["All Sectors"],
    indicators: ["News Sentiment", "Social Volume", "Analyst Ratings", "Options Flow"]
  },
  {
    id: "volatility",
    name: "Volatility Harvesting",
    description: "Capitalizes on market volatility using options and statistical arbitrage",
    icon: Zap,
    riskLevel: "High",
    timeframe: "Short-term",
    sectors: ["Technology", "Biotech", "Crypto"],
    indicators: ["VIX", "Implied Volatility", "Gamma", "Theta Decay"]
  },
  {
    id: "pairs",
    name: "Statistical Pairs Trading",
    description: "Identifies correlated stocks and trades mean reversion opportunities",
    icon: BarChart3,
    riskLevel: "Low",
    timeframe: "Medium-term",
    sectors: ["Same Sector Pairs"],
    indicators: ["Correlation", "Cointegration", "Z-Score", "Beta"]
  },
  {
    id: "defensive",
    name: "Defensive AI Shield",
    description: "Protects portfolio during market downturns with hedging strategies",
    icon: Shield,
    riskLevel: "Very Low",
    timeframe: "Long-term",
    sectors: ["Utilities", "REITs", "Bonds"],
    indicators: ["Market Beta", "Volatility", "Correlation", "Safe Haven Assets"]
  }
];

export function StrategyList() {
  const { strategies } = useTradingData();
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  // Create strategy status map
  const activeStrategies = new Set(strategies?.filter(s => s.isActive).map(s => s.name) || []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Very Low": return "text-green-400 bg-green-400/20";
      case "Low": return "text-green-400 bg-green-400/20";
      case "Medium": return "text-yellow-400 bg-yellow-400/20";
      case "High": return "text-orange-400 bg-orange-400/20";
      default: return "text-gray-400 bg-gray-400/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Available AI Strategies</h2>
        <Badge variant="outline" className="text-blue-400 border-blue-400">
          {activeStrategies.size} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {STRATEGY_TYPES.map((strategy) => {
          const Icon = strategy.icon;
          const isActive = activeStrategies.has(strategy.name);
          const userStrategy = strategies?.find(s => s.name === strategy.name);
          
          return (
            <Card 
              key={strategy.id} 
              className={`trading-card border cursor-pointer transition-all hover:border-blue-500 ${
                selectedStrategy === strategy.id ? 'border-blue-500 ring-1 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedStrategy(selectedStrategy === strategy.id ? null : strategy.id)}
              data-testid={`strategy-card-${strategy.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-600/20">
                      <Icon size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <p className="text-sm text-gray-400 mt-1">{strategy.description}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isActive}
                    onCheckedChange={() => {
                      // In a real app, this would update the strategy status
                      console.log(`Toggle ${strategy.name}`);
                    }}
                    data-testid={`switch-${strategy.id}`}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge className={getRiskColor(strategy.riskLevel)}>
                      {strategy.riskLevel} Risk
                    </Badge>
                    <span className="text-sm text-gray-400">{strategy.timeframe}</span>
                  </div>
                  {userStrategy && (
                    <div className="text-right">
                      <div className={`font-semibold ${parseFloat(userStrategy.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(userStrategy.totalPnl) >= 0 ? '+' : ''}${userStrategy.totalPnl}
                      </div>
                      <div className="text-xs text-gray-400">P&L</div>
                    </div>
                  )}
                </div>

                {selectedStrategy === strategy.id && (
                  <div className="pt-4 border-t border-gray-700 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Risk Allocation: {userStrategy?.riskAllocation || "10"}%
                      </label>
                      <Slider
                        value={[parseFloat(userStrategy?.riskAllocation || "10")]}
                        onValueChange={(value) => {
                          // In a real app, this would update the allocation
                          console.log(`Update allocation for ${strategy.name}: ${value[0]}%`);
                        }}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                        data-testid={`slider-${strategy.id}`}
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Target Sectors</h4>
                      <div className="flex flex-wrap gap-2">
                        {strategy.sectors.map((sector) => (
                          <Badge key={sector} variant="outline" className="text-xs">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Indicators</h4>
                      <div className="flex flex-wrap gap-2">
                        {strategy.indicators.map((indicator) => (
                          <Badge key={indicator} variant="secondary" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        data-testid={`button-backtest-${strategy.id}`}
                      >
                        <BarChart3 size={14} className="mr-2" />
                        Backtest
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        data-testid={`button-configure-${strategy.id}`}
                      >
                        <Settings size={14} className="mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}