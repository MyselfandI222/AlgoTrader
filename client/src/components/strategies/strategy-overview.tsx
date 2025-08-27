import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTradingData } from "@/hooks/use-trading-data";
import { TrendingUp, TrendingDown, Brain, Shield, Target } from "lucide-react";

export function StrategyOverview() {
  const { strategies, portfolio } = useTradingData();

  const activeStrategies = strategies?.filter(s => s.isActive) || [];
  const totalAllocation = activeStrategies.reduce((sum, s) => sum + parseFloat(s.riskAllocation), 0);
  const totalPnL = activeStrategies.reduce((sum, s) => sum + parseFloat(s.totalPnl), 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="trading-card border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
          <Brain className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeStrategies.length}</div>
          <p className="text-xs text-gray-400">
            {strategies?.length || 0} total configured
          </p>
        </CardContent>
      </Card>

      <Card className="trading-card border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Allocation</CardTitle>
          <Shield className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAllocation.toFixed(1)}%</div>
          <p className="text-xs text-gray-400">
            of portfolio in AI strategies
          </p>
        </CardContent>
      </Card>

      <Card className="trading-card border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Strategy P&L</CardTitle>
          {totalPnL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
          <p className="text-xs text-gray-400">
            from AI strategy trades
          </p>
        </CardContent>
      </Card>
    </div>
  );
}