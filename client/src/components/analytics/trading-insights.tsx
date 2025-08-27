import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/hooks/use-trading-data";
import { TrendingUp, TrendingDown, Clock, DollarSign, Brain, AlertTriangle, Download } from "lucide-react";

export function TradingInsights() {
  const { trades, portfolio, strategies } = useTradingData();

  const recentTrades = trades?.slice(0, 10) || [];
  const totalPnL = trades?.reduce((sum, trade) => sum + parseFloat(trade.pnl || "0"), 0) || 0;
  const avgHoldTime = "2.3 days"; // Calculate from actual trade data
  const bestPerformer = trades?.sort((a, b) => parseFloat(b.pnl || "0") - parseFloat(a.pnl || "0"))[0];
  const worstPerformer = trades?.sort((a, b) => parseFloat(a.pnl || "0") - parseFloat(b.pnl || "0"))[0];

  const insights = [
    {
      title: "Best Performing Stock",
      value: bestPerformer?.symbol || "N/A",
      detail: `+$${bestPerformer?.pnl || "0.00"} P&L`,
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      title: "Most Active Strategy",
      value: "Momentum Growth",
      detail: "42% of total trades",
      icon: Brain,
      color: "text-blue-400"
    },
    {
      title: "Average Hold Time",
      value: avgHoldTime,
      detail: "Optimal for strategy type",
      icon: Clock,
      color: "text-purple-400"
    },
    {
      title: "Risk Alert",
      value: "Portfolio Exposure",
      detail: "85% equity allocation",
      icon: AlertTriangle,
      color: "text-orange-400"
    }
  ];

  const exportReport = () => {
    // In a real app, this would generate and download a PDF/CSV report
    console.log("Exporting analytics report...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trading Insights & Reports</h2>
        <Button onClick={exportReport} className="bg-blue-600 hover:bg-blue-700">
          <Download size={16} className="mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Card key={index} className="trading-card border">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${insight.color}`} />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">{insight.title}</p>
                    <p className="font-semibold text-sm">{insight.value}</p>
                    <p className="text-xs text-gray-500">{insight.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trading Activity */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle>Recent Trading Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTrades.map((trade) => {
              const pnlValue = parseFloat(trade.pnl || "0");
              const isPositive = pnlValue >= 0;
              
              return (
                <div key={trade.id} className="flex items-center justify-between p-3 trading-accent rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${trade.side === 'BUY' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{trade.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {trade.side}
                        </Badge>
                        {trade.isAutomatic && (
                          <Badge variant="secondary" className="text-xs bg-blue-600">
                            AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {trade.quantity} shares @ ${trade.price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}${trade.pnl}
                    </div>
                    <p className="text-xs text-gray-400">{trade.strategyName || "Manual"}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Total Trades</p>
                <p className="text-2xl font-bold">{trades?.length || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Total P&L</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold mb-3">Best & Worst Performers</h4>
              <div className="space-y-3">
                {bestPerformer && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Best: {bestPerformer.symbol}</span>
                    </div>
                    <span className="text-green-400 font-semibold">+${bestPerformer.pnl}</span>
                  </div>
                )}
                {worstPerformer && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-sm">Worst: {worstPerformer.symbol}</span>
                    </div>
                    <span className="text-red-400 font-semibold">${worstPerformer.pnl}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold mb-3">AI Strategy Breakdown</h4>
              <div className="space-y-2">
                {strategies?.slice(0, 3).map((strategy) => (
                  <div key={strategy.id} className="flex items-center justify-between">
                    <span className="text-sm">{strategy.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">{strategy.riskAllocation}%</span>
                      <span className={`text-sm font-semibold ${parseFloat(strategy.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(strategy.totalPnl) >= 0 ? '+' : ''}${strategy.totalPnl}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}