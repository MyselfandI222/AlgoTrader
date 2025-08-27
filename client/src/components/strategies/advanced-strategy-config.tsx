import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  TrendingUp, 
  Target, 
  Brain, 
  Zap, 
  BarChart3, 
  Shield,
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface AdvancedStrategyConfigProps {
  strategyId: string;
  strategyName: string;
  onClose: () => void;
}

export function AdvancedStrategyConfig({ strategyId, strategyName, onClose }: AdvancedStrategyConfigProps) {
  const { toast } = useToast();
  
  const [config, setConfig] = useState({
    // General Settings
    isActive: true,
    riskAllocation: 25,
    maxPositionSize: 5,
    
    // Entry Conditions
    entrySignalStrength: 70,
    confirmationPeriod: 3,
    volumeThreshold: 150,
    priceActionFilter: true,
    
    // Technical Indicators
    rsiEnabled: true,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    
    macdEnabled: true,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    
    bollinger: true,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
    
    smaEnabled: true,
    smaPeriod: 50,
    emaEnabled: true,
    emaPeriod: 20,
    
    // Exit Conditions
    stopLossEnabled: true,
    stopLossPercent: 8,
    trailingStopEnabled: true,
    trailingStopPercent: 5,
    
    takeProfitEnabled: true,
    takeProfitPercent: 15,
    partialProfitEnabled: true,
    partialProfitPercent: 10,
    partialProfitSize: 50,
    
    // Risk Management
    maxDrawdown: 12,
    correlationLimit: 0.7,
    sectorConcentration: 25,
    volatilityLimit: 25,
    
    // Market Conditions
    marketRegime: "all", // bull, bear, sideways, all
    volatilityFilter: true,
    volumeFilter: true,
    liquidityThreshold: 1000000,
    
    // Advanced Features
    portfolioRebalancing: true,
    rebalanceFrequency: "weekly",
    dynamicPositionSizing: true,
    riskParity: false,
    momentumDecay: 0.95,
    
    // Machine Learning
    mlModelEnabled: true,
    predictionConfidence: 65,
    featureEngineering: true,
    ensembleVoting: true,
    backtestPeriod: 252, // trading days
    
    // News & Sentiment
    newsAnalysis: true,
    sentimentWeight: 0.3,
    socialMediaWeight: 0.2,
    analystRatings: true,
    
    // Options Strategy
    optionsEnabled: false,
    impliedVolatility: true,
    deltaHedging: false,
    gammaScalping: false
  });

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfiguration = () => {
    // In a real app, this would save to backend
    toast({
      title: "Configuration Saved",
      description: `Advanced settings for ${strategyName} have been updated.`,
    });
    onClose();
  };

  const runBacktest = () => {
    toast({
      title: "Backtest Started",
      description: "Running historical performance analysis...",
    });
  };

  const resetToDefaults = () => {
    // Reset to default values
    toast({
      title: "Settings Reset",
      description: "Configuration reset to default values.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{strategyName} - Advanced Configuration</h2>
          <p className="text-gray-400">Fine-tune algorithm parameters and risk controls</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={runBacktest}>
            <Activity size={16} className="mr-2" />
            Run Backtest
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset Defaults
          </Button>
          <Button onClick={saveConfiguration} className="bg-blue-600 hover:bg-blue-700">
            Save Configuration
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <XCircle size={16} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="entry">Entry Signals</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="exit">Exit Rules</TabsTrigger>
          <TabsTrigger value="risk">Risk Mgmt</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Strategy Active</Label>
                  <Switch 
                    checked={config.isActive} 
                    onCheckedChange={(value) => updateConfig("isActive", value)}
                  />
                </div>
                
                <div>
                  <Label>Risk Allocation: {config.riskAllocation}%</Label>
                  <Slider
                    value={[config.riskAllocation]}
                    onValueChange={([value]) => updateConfig("riskAllocation", value)}
                    max={50}
                    min={5}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Max Position Size: {config.maxPositionSize}%</Label>
                  <Slider
                    value={[config.maxPositionSize]}
                    onValueChange={([value]) => updateConfig("maxPositionSize", value)}
                    max={15}
                    min={1}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Market Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Market Regime</Label>
                  <Select value={config.marketRegime} onValueChange={(value) => updateConfig("marketRegime", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Market Conditions</SelectItem>
                      <SelectItem value="bull">Bull Market Only</SelectItem>
                      <SelectItem value="bear">Bear Market Only</SelectItem>
                      <SelectItem value="sideways">Sideways Market Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Volatility Filter</Label>
                  <Switch 
                    checked={config.volatilityFilter} 
                    onCheckedChange={(value) => updateConfig("volatilityFilter", value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Volume Filter</Label>
                  <Switch 
                    checked={config.volumeFilter} 
                    onCheckedChange={(value) => updateConfig("volumeFilter", value)}
                  />
                </div>
                
                <div>
                  <Label>Liquidity Threshold</Label>
                  <Input
                    type="number"
                    value={config.liquidityThreshold}
                    onChange={(e) => updateConfig("liquidityThreshold", parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entry" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Signal Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Entry Signal Strength: {config.entrySignalStrength}%</Label>
                  <Slider
                    value={[config.entrySignalStrength]}
                    onValueChange={([value]) => updateConfig("entrySignalStrength", value)}
                    max={95}
                    min={50}
                    step={5}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Confirmation Period: {config.confirmationPeriod} bars</Label>
                  <Slider
                    value={[config.confirmationPeriod]}
                    onValueChange={([value]) => updateConfig("confirmationPeriod", value)}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Volume Threshold: {config.volumeThreshold}%</Label>
                  <Slider
                    value={[config.volumeThreshold]}
                    onValueChange={([value]) => updateConfig("volumeThreshold", value)}
                    max={300}
                    min={100}
                    step={10}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Price Action Filter</Label>
                  <Switch 
                    checked={config.priceActionFilter} 
                    onCheckedChange={(value) => updateConfig("priceActionFilter", value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>RSI Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable RSI</Label>
                  <Switch 
                    checked={config.rsiEnabled} 
                    onCheckedChange={(value) => updateConfig("rsiEnabled", value)}
                  />
                </div>
                
                {config.rsiEnabled && (
                  <>
                    <div>
                      <Label>RSI Period: {config.rsiPeriod}</Label>
                      <Slider
                        value={[config.rsiPeriod]}
                        onValueChange={([value]) => updateConfig("rsiPeriod", value)}
                        max={30}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Overbought Level: {config.rsiOverbought}</Label>
                      <Slider
                        value={[config.rsiOverbought]}
                        onValueChange={([value]) => updateConfig("rsiOverbought", value)}
                        max={85}
                        min={65}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Oversold Level: {config.rsiOversold}</Label>
                      <Slider
                        value={[config.rsiOversold]}
                        onValueChange={([value]) => updateConfig("rsiOversold", value)}
                        max={35}
                        min={15}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>MACD Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable MACD</Label>
                  <Switch 
                    checked={config.macdEnabled} 
                    onCheckedChange={(value) => updateConfig("macdEnabled", value)}
                  />
                </div>
                
                {config.macdEnabled && (
                  <>
                    <div>
                      <Label>Fast EMA: {config.macdFast}</Label>
                      <Slider
                        value={[config.macdFast]}
                        onValueChange={([value]) => updateConfig("macdFast", value)}
                        max={20}
                        min={8}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Slow EMA: {config.macdSlow}</Label>
                      <Slider
                        value={[config.macdSlow]}
                        onValueChange={([value]) => updateConfig("macdSlow", value)}
                        max={35}
                        min={20}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Signal Line: {config.macdSignal}</Label>
                      <Slider
                        value={[config.macdSignal]}
                        onValueChange={([value]) => updateConfig("macdSignal", value)}
                        max={15}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Moving Averages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable SMA</Label>
                  <Switch 
                    checked={config.smaEnabled} 
                    onCheckedChange={(value) => updateConfig("smaEnabled", value)}
                  />
                </div>
                
                {config.smaEnabled && (
                  <div>
                    <Label>SMA Period: {config.smaPeriod}</Label>
                    <Slider
                      value={[config.smaPeriod]}
                      onValueChange={([value]) => updateConfig("smaPeriod", value)}
                      max={200}
                      min={10}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Label>Enable EMA</Label>
                  <Switch 
                    checked={config.emaEnabled} 
                    onCheckedChange={(value) => updateConfig("emaEnabled", value)}
                  />
                </div>
                
                {config.emaEnabled && (
                  <div>
                    <Label>EMA Period: {config.emaPeriod}</Label>
                    <Slider
                      value={[config.emaPeriod]}
                      onValueChange={([value]) => updateConfig("emaPeriod", value)}
                      max={100}
                      min={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Bollinger Bands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Bollinger Bands</Label>
                  <Switch 
                    checked={config.bollinger} 
                    onCheckedChange={(value) => updateConfig("bollinger", value)}
                  />
                </div>
                
                {config.bollinger && (
                  <>
                    <div>
                      <Label>Period: {config.bollingerPeriod}</Label>
                      <Slider
                        value={[config.bollingerPeriod]}
                        onValueChange={([value]) => updateConfig("bollingerPeriod", value)}
                        max={30}
                        min={10}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Standard Deviation: {config.bollingerStdDev}</Label>
                      <Slider
                        value={[config.bollingerStdDev]}
                        onValueChange={([value]) => updateConfig("bollingerStdDev", value)}
                        max={3}
                        min={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Stop Loss</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Stop Loss</Label>
                  <Switch 
                    checked={config.stopLossEnabled} 
                    onCheckedChange={(value) => updateConfig("stopLossEnabled", value)}
                  />
                </div>
                
                {config.stopLossEnabled && (
                  <div>
                    <Label>Stop Loss %: {config.stopLossPercent}%</Label>
                    <Slider
                      value={[config.stopLossPercent]}
                      onValueChange={([value]) => updateConfig("stopLossPercent", value)}
                      max={20}
                      min={3}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Label>Enable Trailing Stop</Label>
                  <Switch 
                    checked={config.trailingStopEnabled} 
                    onCheckedChange={(value) => updateConfig("trailingStopEnabled", value)}
                  />
                </div>
                
                {config.trailingStopEnabled && (
                  <div>
                    <Label>Trailing Stop %: {config.trailingStopPercent}%</Label>
                    <Slider
                      value={[config.trailingStopPercent]}
                      onValueChange={([value]) => updateConfig("trailingStopPercent", value)}
                      max={15}
                      min={2}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Take Profit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Take Profit</Label>
                  <Switch 
                    checked={config.takeProfitEnabled} 
                    onCheckedChange={(value) => updateConfig("takeProfitEnabled", value)}
                  />
                </div>
                
                {config.takeProfitEnabled && (
                  <div>
                    <Label>Take Profit %: {config.takeProfitPercent}%</Label>
                    <Slider
                      value={[config.takeProfitPercent]}
                      onValueChange={([value]) => updateConfig("takeProfitPercent", value)}
                      max={50}
                      min={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Label>Enable Partial Profit</Label>
                  <Switch 
                    checked={config.partialProfitEnabled} 
                    onCheckedChange={(value) => updateConfig("partialProfitEnabled", value)}
                  />
                </div>
                
                {config.partialProfitEnabled && (
                  <>
                    <div>
                      <Label>Partial Profit %: {config.partialProfitPercent}%</Label>
                      <Slider
                        value={[config.partialProfitPercent]}
                        onValueChange={([value]) => updateConfig("partialProfitPercent", value)}
                        max={25}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Position Size to Close: {config.partialProfitSize}%</Label>
                      <Slider
                        value={[config.partialProfitSize]}
                        onValueChange={([value]) => updateConfig("partialProfitSize", value)}
                        max={80}
                        min={25}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Portfolio Risk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Max Drawdown: {config.maxDrawdown}%</Label>
                  <Slider
                    value={[config.maxDrawdown]}
                    onValueChange={([value]) => updateConfig("maxDrawdown", value)}
                    max={25}
                    min={5}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Correlation Limit: {config.correlationLimit}</Label>
                  <Slider
                    value={[config.correlationLimit]}
                    onValueChange={([value]) => updateConfig("correlationLimit", value)}
                    max={1}
                    min={0.3}
                    step={0.05}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Sector Concentration: {config.sectorConcentration}%</Label>
                  <Slider
                    value={[config.sectorConcentration]}
                    onValueChange={([value]) => updateConfig("sectorConcentration", value)}
                    max={50}
                    min={10}
                    step={5}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Volatility Limit: {config.volatilityLimit}%</Label>
                  <Slider
                    value={[config.volatilityLimit]}
                    onValueChange={([value]) => updateConfig("volatilityLimit", value)}
                    max={50}
                    min={10}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Machine Learning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable ML Model</Label>
                  <Switch 
                    checked={config.mlModelEnabled} 
                    onCheckedChange={(value) => updateConfig("mlModelEnabled", value)}
                  />
                </div>
                
                <div>
                  <Label>Prediction Confidence: {config.predictionConfidence}%</Label>
                  <Slider
                    value={[config.predictionConfidence]}
                    onValueChange={([value]) => updateConfig("predictionConfidence", value)}
                    max={95}
                    min={50}
                    step={5}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Feature Engineering</Label>
                  <Switch 
                    checked={config.featureEngineering} 
                    onCheckedChange={(value) => updateConfig("featureEngineering", value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Ensemble Voting</Label>
                  <Switch 
                    checked={config.ensembleVoting} 
                    onCheckedChange={(value) => updateConfig("ensembleVoting", value)}
                  />
                </div>
                
                <div>
                  <Label>Backtest Period: {config.backtestPeriod} days</Label>
                  <Slider
                    value={[config.backtestPeriod]}
                    onValueChange={([value]) => updateConfig("backtestPeriod", value)}
                    max={1000}
                    min={100}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Portfolio Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Portfolio Rebalancing</Label>
                  <Switch 
                    checked={config.portfolioRebalancing} 
                    onCheckedChange={(value) => updateConfig("portfolioRebalancing", value)}
                  />
                </div>
                
                <div>
                  <Label>Rebalance Frequency</Label>
                  <Select value={config.rebalanceFrequency} onValueChange={(value) => updateConfig("rebalanceFrequency", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Dynamic Position Sizing</Label>
                  <Switch 
                    checked={config.dynamicPositionSizing} 
                    onCheckedChange={(value) => updateConfig("dynamicPositionSizing", value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Risk Parity</Label>
                  <Switch 
                    checked={config.riskParity} 
                    onCheckedChange={(value) => updateConfig("riskParity", value)}
                  />
                </div>
                
                <div>
                  <Label>Momentum Decay: {config.momentumDecay}</Label>
                  <Slider
                    value={[config.momentumDecay]}
                    onValueChange={([value]) => updateConfig("momentumDecay", value)}
                    max={1}
                    min={0.8}
                    step={0.01}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>News & Sentiment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>News Analysis</Label>
                  <Switch 
                    checked={config.newsAnalysis} 
                    onCheckedChange={(value) => updateConfig("newsAnalysis", value)}
                  />
                </div>
                
                <div>
                  <Label>Sentiment Weight: {config.sentimentWeight}</Label>
                  <Slider
                    value={[config.sentimentWeight]}
                    onValueChange={([value]) => updateConfig("sentimentWeight", value)}
                    max={0.5}
                    min={0.1}
                    step={0.05}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Social Media Weight: {config.socialMediaWeight}</Label>
                  <Slider
                    value={[config.socialMediaWeight]}
                    onValueChange={([value]) => updateConfig("socialMediaWeight", value)}
                    max={0.4}
                    min={0.1}
                    step={0.05}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Analyst Ratings</Label>
                  <Switch 
                    checked={config.analystRatings} 
                    onCheckedChange={(value) => updateConfig("analystRatings", value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Options Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Options</Label>
                  <Switch 
                    checked={config.optionsEnabled} 
                    onCheckedChange={(value) => updateConfig("optionsEnabled", value)}
                  />
                </div>
                
                {config.optionsEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Implied Volatility Analysis</Label>
                      <Switch 
                        checked={config.impliedVolatility} 
                        onCheckedChange={(value) => updateConfig("impliedVolatility", value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Delta Hedging</Label>
                      <Switch 
                        checked={config.deltaHedging} 
                        onCheckedChange={(value) => updateConfig("deltaHedging", value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Gamma Scalping</Label>
                      <Switch 
                        checked={config.gammaScalping} 
                        onCheckedChange={(value) => updateConfig("gammaScalping", value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Configuration Summary */}
      <Card className="trading-card border">
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm">Risk Allocation: {config.riskAllocation}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm">Stop Loss: {config.stopLossPercent}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm">Take Profit: {config.takeProfitPercent}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm">ML Model: {config.mlModelEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm">News Analysis: {config.newsAnalysis ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm">Rebalancing: {config.rebalanceFrequency}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}