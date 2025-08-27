import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTradingData } from "@/hooks/use-trading-data";
import { TrendingUp, TrendingDown, DollarSign, Plus, Minus, BarChart3, PieChart } from "lucide-react";

export function PortfolioSummary() {
  const { portfolio, positions, trades } = useTradingData();

  const totalPositions = positions?.length || 0;
  const totalTrades = trades?.length || 0;
  const profitablePositions = positions?.filter(p => parseFloat(p.unrealizedPnl || "0") > 0).length || 0;
  const profitRate = totalPositions > 0 ? (profitablePositions / totalPositions * 100) : 0;

  const todaysPnL = parseFloat(portfolio?.dailyPnl || "0");
  const totalValue = parseFloat(portfolio?.totalValue || "0");
  const cashBalance = 25000; // Placeholder - would calculate from account balance
  const investedAmount = totalValue - cashBalance;

  const summaryStats = [
    {
      title: "Total Portfolio Value",
      value: `$${totalValue.toLocaleString()}`,
      change: `${portfolio?.dailyPnlPercent || "0.00"}%`,
      changeValue: `${todaysPnL >= 0 ? '+' : ''}$${Math.abs(todaysPnL).toLocaleString()}`,
      icon: DollarSign,
      positive: todaysPnL >= 0
    },
    {
      title: "Invested Amount",
      value: `$${investedAmount.toLocaleString()}`,
      subtitle: `${totalPositions} positions`,
      icon: BarChart3,
      positive: true
    },
    {
      title: "Cash Available",
      value: `$${cashBalance.toLocaleString()}`,
      subtitle: "Ready to invest",
      icon: DollarSign,
      positive: true
    },
    {
      title: "Profit Rate",
      value: `${profitRate.toFixed(1)}%`,
      subtitle: `${profitablePositions}/${totalPositions} profitable`,
      icon: PieChart,
      positive: profitRate > 50
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Overview</h2>
          <p className="text-gray-400">Your AI-managed investment portfolio</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" className="border-green-600 text-green-400 hover:bg-green-600">
            <Plus size={16} className="mr-2" />
            Add Funds
          </Button>
          <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600">
            <Minus size={16} className="mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.positive;
          
          return (
            <Card key={index} className="trading-card border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <div className="flex items-center space-x-1 mt-1">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                    <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change} ({stat.changeValue}) today
                    </p>
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="trading-card border">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Button variant="outline" className="flex-1">
            <Plus size={16} className="mr-2" />
            Deposit Funds
          </Button>
          <Button variant="outline" className="flex-1">
            <TrendingUp size={16} className="mr-2" />
            Rebalance Portfolio
          </Button>
          <Button variant="outline" className="flex-1">
            <BarChart3 size={16} className="mr-2" />
            View Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}