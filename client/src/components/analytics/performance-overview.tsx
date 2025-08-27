import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTradingData } from "@/hooks/use-trading-data";
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Award } from "lucide-react";

export function PerformanceOverview() {
  const { portfolio, trades, strategies } = useTradingData();

  const totalTrades = trades?.length || 0;
  const profitableTrades = trades?.filter(t => parseFloat(t.pnl || "0") > 0).length || 0;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades * 100) : 0;
  
  const activeStrategies = strategies?.filter(s => s.isActive).length || 0;
  const totalStrategyPnL = strategies?.reduce((sum, s) => sum + parseFloat(s.totalPnl || "0"), 0) || 0;
  
  const monthlyReturn = 8.4; // In a real app, calculate from historical data
  const sharpeRatio = 1.8;
  const maxDrawdown = 4.2;

  const metrics = [
    {
      title: "Portfolio Value",
      value: `$${portfolio?.totalValue || "0.00"}`,
      change: portfolio?.dailyPnlPercent || "0.00",
      changeLabel: "Today",
      icon: DollarSign,
      positive: parseFloat(portfolio?.dailyPnlPercent || "0") >= 0
    },
    {
      title: "Monthly Return",
      value: `${monthlyReturn}%`,
      change: "2.1",
      changeLabel: "vs last month",
      icon: TrendingUp,
      positive: true
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      change: profitableTrades.toString(),
      changeLabel: `of ${totalTrades} trades`,
      icon: Target,
      positive: winRate > 60
    },
    {
      title: "Sharpe Ratio",
      value: sharpeRatio.toFixed(2),
      change: "0.3",
      changeLabel: "vs benchmark",
      icon: Award,
      positive: sharpeRatio > 1.5
    },
    {
      title: "Max Drawdown",
      value: `${maxDrawdown}%`,
      change: "1.2",
      changeLabel: "improved",
      icon: TrendingDown,
      positive: false
    },
    {
      title: "Active Strategies",
      value: activeStrategies.toString(),
      change: totalStrategyPnL.toFixed(2),
      changeLabel: "total P&L",
      icon: Calendar,
      positive: totalStrategyPnL >= 0
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Performance Overview</h2>
        <Badge variant="outline" className="text-green-400 border-green-400">
          Last updated: 2 min ago
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.positive;
          
          return (
            <Card key={index} className="trading-card border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center space-x-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{metric.change}% {metric.changeLabel}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}