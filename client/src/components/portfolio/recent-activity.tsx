import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/hooks/use-trading-data";
import { TrendingUp, TrendingDown, ArrowRightLeft, Brain, User, ExternalLink } from "lucide-react";

export function RecentActivity() {
  const { trades } = useTradingData();

  const recentTrades = trades?.slice(0, 10) || [];

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTradeIcon = (side: string) => {
    return side === 'BUY' ? TrendingUp : TrendingDown;
  };

  const getTradeColor = (side: string) => {
    return side === 'BUY' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Recent Activity</h2>
        <Button variant="outline" size="sm">
          <ExternalLink size={16} className="mr-2" />
          View All Transactions
        </Button>
      </div>

      <Card className="trading-card border">
        <CardHeader>
          <CardTitle>Latest Trades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentTrades.map((trade) => {
            const Icon = getTradeIcon(trade.side);
            const pnl = parseFloat(trade.pnl || "0");
            const isPositive = pnl >= 0;
            
            return (
              <div key={trade.id} className="flex items-center justify-between p-4 trading-accent rounded-lg hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${trade.side === 'BUY' ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                    <Icon size={20} className={getTradeColor(trade.side)} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-lg">{trade.symbol}</span>
                      <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                        {trade.side}
                      </Badge>
                      {trade.isAutomatic && (
                        <Badge variant="secondary" className="text-xs bg-blue-600">
                          <Brain size={12} className="mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {trade.quantity} shares @ ${parseFloat(trade.price).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(trade.executedAt)} • {trade.strategyName || "Manual Trade"}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    ${parseFloat(trade.amount).toLocaleString()}
                  </div>
                  {trade.pnl && (
                    <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}${trade.pnl} P&L
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Total value
                  </div>
                </div>
              </div>
            );
          })}

          {recentTrades.length === 0 && (
            <div className="text-center py-8">
              <ArrowRightLeft size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No recent trades</h3>
              <p className="text-gray-400">
                Your trading activity will appear here once you start investing
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="trading-card border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Trades</p>
                <p className="text-2xl font-bold">{trades?.length || 0}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">All time activity</p>
          </CardContent>
        </Card>

        <Card className="trading-card border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">AI Trades</p>
                <p className="text-2xl font-bold">
                  {trades?.filter(t => t.isAutomatic).length || 0}
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {trades?.length ? 
                `${Math.round((trades.filter(t => t.isAutomatic).length / trades.length) * 100)}% automated` : 
                "0% automated"
              }
            </p>
          </CardContent>
        </Card>

        <Card className="trading-card border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {trades?.length ? 
                    `${Math.round((trades.filter(t => parseFloat(t.pnl || "0") > 0).length / trades.length) * 100)}%` : 
                    "0%"
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">Profitable trades</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}