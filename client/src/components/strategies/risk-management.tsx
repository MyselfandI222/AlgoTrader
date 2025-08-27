import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RiskManagement() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    maxPortfolioRisk: 25,
    maxPositionSize: 10,
    stopLossEnabled: true,
    stopLossPercent: 5,
    takeProfitEnabled: true,
    takeProfitPercent: 15,
    maxDrawdown: 10,
    rebalanceFrequency: "weekly",
    emergencyStopEnabled: true,
    emergencyStopPercent: 15,
    correlationLimit: 70,
    sectorConcentration: 30
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Risk Settings Saved",
      description: "Your risk management preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Risk Management</h2>
        <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700">
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Risk Limits */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span>Portfolio Risk Limits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                Maximum Portfolio Risk: {settings.maxPortfolioRisk}%
              </Label>
              <Slider
                value={[settings.maxPortfolioRisk]}
                onValueChange={([value]) => updateSetting("maxPortfolioRisk", value)}
                max={50}
                min={5}
                step={1}
                className="mt-2"
                data-testid="slider-portfolio-risk"
              />
              <p className="text-xs text-gray-400 mt-1">
                Maximum percentage of portfolio at risk in AI strategies
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Maximum Position Size: {settings.maxPositionSize}%
              </Label>
              <Slider
                value={[settings.maxPositionSize]}
                onValueChange={([value]) => updateSetting("maxPositionSize", value)}
                max={25}
                min={1}
                step={0.5}
                className="mt-2"
                data-testid="slider-position-size"
              />
              <p className="text-xs text-gray-400 mt-1">
                Maximum percentage of portfolio in any single position
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Sector Concentration Limit: {settings.sectorConcentration}%
              </Label>
              <Slider
                value={[settings.sectorConcentration]}
                onValueChange={([value]) => updateSetting("sectorConcentration", value)}
                max={60}
                min={10}
                step={5}
                className="mt-2"
                data-testid="slider-sector-concentration"
              />
              <p className="text-xs text-gray-400 mt-1">
                Maximum exposure to any single sector
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stop Loss & Take Profit */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-orange-400" />
              <span>Stop Loss & Take Profit</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="stop-loss-switch">Enable Stop Loss</Label>
              <Switch
                id="stop-loss-switch"
                checked={settings.stopLossEnabled}
                onCheckedChange={(checked) => updateSetting("stopLossEnabled", checked)}
                data-testid="switch-stop-loss"
              />
            </div>

            {settings.stopLossEnabled && (
              <div>
                <Label className="text-sm font-medium">
                  Stop Loss Threshold: {settings.stopLossPercent}%
                </Label>
                <Slider
                  value={[settings.stopLossPercent]}
                  onValueChange={([value]) => updateSetting("stopLossPercent", value)}
                  max={20}
                  min={1}
                  step={0.5}
                  className="mt-2"
                  data-testid="slider-stop-loss"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="take-profit-switch">Enable Take Profit</Label>
              <Switch
                id="take-profit-switch"
                checked={settings.takeProfitEnabled}
                onCheckedChange={(checked) => updateSetting("takeProfitEnabled", checked)}
                data-testid="switch-take-profit"
              />
            </div>

            {settings.takeProfitEnabled && (
              <div>
                <Label className="text-sm font-medium">
                  Take Profit Target: {settings.takeProfitPercent}%
                </Label>
                <Slider
                  value={[settings.takeProfitPercent]}
                  onValueChange={([value]) => updateSetting("takeProfitPercent", value)}
                  max={50}
                  min={5}
                  step={1}
                  className="mt-2"
                  data-testid="slider-take-profit"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Rebalance Frequency</Label>
              <Select 
                value={settings.rebalanceFrequency} 
                onValueChange={(value) => updateSetting("rebalanceFrequency", value)}
              >
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="trading-card border">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Controls */}
        <Card className="trading-card border border-red-600/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Emergency Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emergency-stop-switch">Emergency Stop</Label>
                <p className="text-xs text-gray-400">
                  Halt all AI trading when losses exceed threshold
                </p>
              </div>
              <Switch
                id="emergency-stop-switch"
                checked={settings.emergencyStopEnabled}
                onCheckedChange={(checked) => updateSetting("emergencyStopEnabled", checked)}
                data-testid="switch-emergency-stop"
              />
            </div>

            {settings.emergencyStopEnabled && (
              <div>
                <Label className="text-sm font-medium">
                  Emergency Stop at: {settings.emergencyStopPercent}% Loss
                </Label>
                <Slider
                  value={[settings.emergencyStopPercent]}
                  onValueChange={([value]) => updateSetting("emergencyStopPercent", value)}
                  max={30}
                  min={5}
                  step={1}
                  className="mt-2"
                  data-testid="slider-emergency-stop"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">
                Maximum Daily Drawdown: {settings.maxDrawdown}%
              </Label>
              <Slider
                value={[settings.maxDrawdown]}
                onValueChange={([value]) => updateSetting("maxDrawdown", value)}
                max={25}
                min={2}
                step={1}
                className="mt-2"
                data-testid="slider-max-drawdown"
              />
              <p className="text-xs text-gray-400 mt-1">
                Pause trading if daily losses exceed this amount
              </p>
            </div>

            <div className="p-4 bg-red-600/20 rounded-lg border border-red-600/30">
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                data-testid="button-emergency-stop"
              >
                Emergency Stop All Trading
              </Button>
              <p className="text-xs text-red-400 mt-2 text-center">
                Immediately halt all AI strategies and pending orders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span>Advanced Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                Correlation Limit: {settings.correlationLimit}%
              </Label>
              <Slider
                value={[settings.correlationLimit]}
                onValueChange={([value]) => updateSetting("correlationLimit", value)}
                max={95}
                min={50}
                step={5}
                className="mt-2"
                data-testid="slider-correlation-limit"
              />
              <p className="text-xs text-gray-400 mt-1">
                Avoid positions with correlation above this threshold
              </p>
            </div>

            <div>
              <Label htmlFor="min-liquidity" className="text-sm font-medium">
                Minimum Daily Volume
              </Label>
              <Input
                id="min-liquidity"
                type="number"
                placeholder="1000000"
                className="mt-2 bg-gray-700 border-gray-600"
                data-testid="input-min-volume"
              />
              <p className="text-xs text-gray-400 mt-1">
                Only trade stocks with minimum daily volume
              </p>
            </div>

            <div>
              <Label htmlFor="min-price" className="text-sm font-medium">
                Minimum Stock Price
              </Label>
              <Input
                id="min-price"
                type="number"
                placeholder="5.00"
                step="0.01"
                className="mt-2 bg-gray-700 border-gray-600"
                data-testid="input-min-price"
              />
              <p className="text-xs text-gray-400 mt-1">
                Avoid penny stocks below this price
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}