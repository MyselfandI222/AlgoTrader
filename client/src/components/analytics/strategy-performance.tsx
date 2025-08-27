import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/hooks/use-trading-data";
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const strategyPerformanceData = {
  "Momentum Growth": [
    { date: "Jan", pnl: 1200 },
    { date: "Feb", pnl: 1850 },
    { date: "Mar", pnl: 2100 },
    { date: "Apr", pnl: 1980 },
    { date: "May", pnl: 2450 },
    { date: "Jun", pnl: 2780 }
  ],
  "AI Value Discovery": [
    { date: "Jan", pnl: 800 },
    { date: "Feb", pnl: 1200 },
    { date: "Mar", pnl: 1650 },
    { date: "Apr", pnl: 1890 },
    { date: "May", pnl: 2100 },
    { date: "Jun", pnl: 2340 }
  ],
  "Market Sentiment AI": [
    { date: "Jan", pnl: 650 },
    { date: "Feb", pnl: 920 },
    { date: "Mar", pnl: 1180 },
    { date: "Apr", pnl: 1350 },
    { date: "May", pnl: 1620 },
    { date: "Jun", pnl: 1890 }
  ]
};

export function StrategyPerformance() {
  const { strategies, trades } = useTradingData();

  const getStrategyStats = (strategyName: string) => {
    const strategyTrades = trades?.filter(t => t.strategyName === strategyName) || [];
    const profitableTrades = strategyTrades.filter(t => parseFloat(t.pnl || "0") > 0);
    const winRate = strategyTrades.length > 0 ? (profitableTrades.length / strategyTrades.length * 100) : 0;
    const avgTrade = strategyTrades.length > 0 
      ? strategyTrades.reduce((sum, t) => sum + parseFloat(t.pnl || "0"), 0) / strategyTrades.length
      : 0;
    
    return {
      totalTrades: strategyTrades.length,
      winRate: winRate.toFixed(1),
      avgTrade: avgTrade.toFixed(2),
      lastTrade: strategyTrades[0]?.executedAt || null
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">AI Strategy Performance</h2>
        <Button variant="outline" size="sm" className="border-gray-600">
          <BarChart3 size={16} className="mr-2" />
          View Details
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Cards */}
        <div className="space-y-4">
          {strategies?.slice(0, 6).map((strategy) => {
            const stats = getStrategyStats(strategy.name);
            const pnlValue = parseFloat(strategy.totalPnl);
            const isPositive = pnlValue >= 0;
            
            return (
              <Card key={strategy.id} className="trading-card border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${strategy.isActive ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    </div>
                    <Badge 
                      variant={strategy.isActive ? "default" : "secondary"}
                      className={strategy.isActive ? "bg-green-600" : ""}
                    >
                      {strategy.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <DollarSign size={14} className={isPositive ? "text-green-400" : "text-red-400"} />
                        <span className="text-xs text-gray-400">Total P&L</span>
                      </div>
                      <div className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}${strategy.totalPnl}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Activity size={14} className="text-blue-400" />
                        <span className="text-xs text-gray-400">Win Rate</span>
                      </div>
                      <div className="text-lg font-bold">{stats.winRate}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <BarChart3 size={14} className="text-purple-400" />
                        <span className="text-xs text-gray-400">Trades</span>
                      </div>
                      <div className="text-sm font-semibold">{stats.totalTrades}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} className="text-orange-400" />
                        <span className="text-xs text-gray-400">Allocation</span>
                      </div>
                      <div className="text-sm font-semibold">{strategy.riskAllocation}%</div>
                    </div>
                  </div>

                  {/* Mini performance chart */}
                  {strategyPerformanceData[strategy.name as keyof typeof strategyPerformanceData] && (
                    <div className="h-20 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={strategyPerformanceData[strategy.name as keyof typeof strategyPerformanceData]}>
                          <Line 
                            type="monotone" 
                            dataKey="pnl" 
                            stroke={isPositive ? "#10B981" : "#EF4444"}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Performance Chart */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle>Strategy Comparison - 6 Month P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94A3B8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  {Object.entries(strategyPerformanceData).map(([name, data], index) => (
                    <Line 
                      key={name}
                      type="monotone" 
                      dataKey="pnl" 
                      data={data}
                      stroke={index === 0 ? "#10B981" : index === 1 ? "#3B82F6" : "#F59E0B"}
                      strokeWidth={2}
                      name={name}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Strategy Performance Summary</h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>Momentum Growth</span>
                  </div>
                  <span className="text-green-400 font-semibold">+$2,780</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span>AI Value Discovery</span>
                  </div>
                  <span className="text-green-400 font-semibold">+$2,340</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span>Market Sentiment AI</span>
                  </div>
                  <span className="text-green-400 font-semibold">+$1,890</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}