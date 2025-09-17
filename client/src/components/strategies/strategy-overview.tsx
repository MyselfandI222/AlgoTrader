import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useTradingData } from "@/hooks/use-trading-data";
import { useAISettings, useUpdateAISettings } from "@/hooks/use-ai-settings";
import { TrendingUp, TrendingDown, Brain, Shield, Target, Settings2 } from "lucide-react";

export function StrategyOverview() {
  const { strategies, portfolio } = useTradingData();
  const { data: aiSettings } = useAISettings();
  const updateSettings = useUpdateAISettings();

  const activeStrategies = strategies?.filter(s => s.isActive) || [];
  const totalAllocation = activeStrategies.reduce((sum, s) => sum + parseFloat(s.riskAllocation), 0);
  const totalPnL = activeStrategies.reduce((sum, s) => sum + parseFloat(s.totalPnl), 0);
  
  return (
    <div className="space-y-8">
      {/* Risk Management Controls */}
      <Card className="trading-card border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-400" />
                AI Risk Management Settings
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Control how the AI manages risk across all your strategies
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Risk Tolerance</Label>
              <Select 
                value={(aiSettings as any)?.riskTolerance || 'moderate'}
                onValueChange={(value) => updateSettings.mutate({ riskTolerance: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                Overall AI risk profile for all strategies
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Max Portfolio Risk: {(aiSettings as any)?.maxDrawdownPercent || 20}%
              </Label>
              <Slider
                value={[(aiSettings as any)?.maxDrawdownPercent || 20]}
                onValueCommit={([value]) => updateSettings.mutate({ maxDrawdownPercent: value })}
                max={50}
                min={5}
                step={1}
                className="w-full"
                disabled={updateSettings.isPending}
              />
              <p className="text-xs text-gray-400">
                Maximum portfolio drawdown allowed
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Max Positions: {(aiSettings as any)?.maxPositions || 6}
              </Label>
              <Slider
                value={[(aiSettings as any)?.maxPositions || 6]}
                onValueCommit={([value]) => updateSettings.mutate({ maxPositions: value })}
                max={20}
                min={1}
                step={1}
                className="w-full"
                disabled={updateSettings.isPending}
              />
              <p className="text-xs text-gray-400">
                Maximum number of simultaneous positions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Stop Loss: {(aiSettings as any)?.stopLossPercent || 8}%
              </Label>
              <Slider
                value={[(aiSettings as any)?.stopLossPercent || 8]}
                onValueCommit={([value]) => updateSettings.mutate({ stopLossPercent: value })}
                max={25}
                min={2}
                step={0.5}
                className="w-full"
                disabled={updateSettings.isPending}
              />
              <p className="text-xs text-gray-400">
                Automatic stop loss percentage for all positions
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Take Profit: {(aiSettings as any)?.takeProfitPercent || 15}%
              </Label>
              <Slider
                value={[(aiSettings as any)?.takeProfitPercent || 15]}
                onValueCommit={([value]) => updateSettings.mutate({ takeProfitPercent: value })}
                max={50}
                min={5}
                step={1}
                className="w-full"
                disabled={updateSettings.isPending}
              />
              <p className="text-xs text-gray-400">
                Automatic take profit percentage for all positions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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