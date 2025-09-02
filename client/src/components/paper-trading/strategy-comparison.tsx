import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Target, Zap, Trophy, BarChart3, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyResult {
  id: string;
  name: string;
  settings: {
    riskTolerance: string;
    strategies: string[];
    maxPositions: number;
  };
  performance: {
    totalReturn: number;
    totalReturnPercent: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
    avgTradeReturn: number;
    volatility: number;
  };
  chartData: Array<{ time: string; value: number; strategy: string }>;
  lastUpdated: Date;
}

function useStrategyComparisons() {
  return useQuery({
    queryKey: ['/api/paper-ai/comparisons'],
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

export function StrategyComparison() {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const { data: strategies, isLoading } = useStrategyComparisons();

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-400 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading strategy comparisons...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const strategyResults = strategies as StrategyResult[] || [];

  // Prepare combined chart data
  const combinedChartData = strategyResults.reduce((acc, strategy) => {
    strategy.chartData.forEach((point, index) => {
      if (!acc[index]) {
        acc[index] = { time: point.time };
      }
      acc[index][strategy.name] = point.value;
    });
    return acc;
  }, [] as any[]);

  // Performance comparison data
  const performanceData = strategyResults.map(strategy => ({
    name: strategy.name.substring(0, 8) + '...',
    return: strategy.performance.totalReturnPercent,
    sharpe: strategy.performance.sharpeRatio,
    winRate: strategy.performance.winRate,
    trades: strategy.performance.totalTrades
  }));

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Strategy Performance Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyResults.map((strategy, index) => {
              const isPositive = strategy.performance.totalReturnPercent >= 0;
              return (
                <div
                  key={strategy.id}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedStrategies.includes(strategy.id)
                      ? "border-blue-400 bg-blue-900/20"
                      : "border-gray-600 bg-gray-700 hover:border-gray-500"
                  )}
                  onClick={() => {
                    setSelectedStrategies(prev =>
                      prev.includes(strategy.id)
                        ? prev.filter(id => id !== strategy.id)
                        : [...prev, strategy.id]
                    );
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{strategy.name}</h4>
                    <Badge
                      variant={isPositive ? "default" : "destructive"}
                      className={isPositive ? "bg-green-600" : "bg-red-600"}
                    >
                      {isPositive ? '+' : ''}{strategy.performance.totalReturnPercent.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Risk:</span>
                      <span className="ml-1 capitalize">{strategy.settings.riskTolerance}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Positions:</span>
                      <span className="ml-1">{strategy.settings.maxPositions}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Sharpe:</span>
                      <span className="ml-1">{strategy.performance.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="ml-1">{strategy.performance.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-400">
                    Strategies: {strategy.settings.strategies.join(', ')}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Updated: {new Date(strategy.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>

          {strategyResults.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No strategy results available</p>
              <p className="text-sm text-gray-500 mt-2">Run some paper trading scenarios to see comparisons</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Charts */}
      {selectedStrategies.length > 0 && (
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="performance">Performance Chart</TabsTrigger>
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <span>Portfolio Performance Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                      />
                      {strategyResults
                        .filter(s => selectedStrategies.includes(s.id))
                        .map((strategy, index) => (
                        <Line
                          key={strategy.id}
                          type="monotone"
                          dataKey={strategy.name}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: colors[index % colors.length] }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Total Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                        <YAxis stroke="#94A3B8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Bar dataKey="return" fill="#10B981" name="Return %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                        <YAxis stroke="#94A3B8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Bar dataKey="sharpe" fill="#3B82F6" name="Sharpe Ratio" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4">
              {strategyResults
                .filter(s => selectedStrategies.includes(s.id))
                .map((strategy) => (
                <Card key={strategy.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{strategy.name}</span>
                      <Badge
                        variant={strategy.performance.totalReturnPercent >= 0 ? "default" : "destructive"}
                        className={strategy.performance.totalReturnPercent >= 0 ? "bg-green-600" : "bg-red-600"}
                      >
                        {strategy.performance.totalReturnPercent >= 0 ? '+' : ''}{strategy.performance.totalReturnPercent.toFixed(2)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          ${strategy.performance.totalReturn.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">Total Return</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {strategy.performance.sharpeRatio.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">Sharpe Ratio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {strategy.performance.winRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {strategy.performance.totalTrades}
                        </div>
                        <div className="text-sm text-gray-400">Total Trades</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-400">
                          {strategy.performance.maxDrawdown.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400">Max Drawdown</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-400">
                          {strategy.performance.volatility.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400">Volatility</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-cyan-400">
                          {strategy.performance.avgTradeReturn.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-400">Avg Trade Return</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-400">
                          {strategy.settings.maxPositions}
                        </div>
                        <div className="text-xs text-gray-400">Max Positions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}