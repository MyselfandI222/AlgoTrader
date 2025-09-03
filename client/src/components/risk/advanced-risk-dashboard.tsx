import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Activity, Brain, TrendingDown, AlertTriangle, Target, BarChart3, Settings } from "lucide-react";

interface RiskConfig {
  initialAtrMult: number;
  chandelierMult: number;
  chandelierLookback: number;
  wMomentum: number;
  wVolExpansion: number;
  wRsiStress: number;
  wStructureBreak: number;
  wDrawdown: number;
  wTime: number;
  exitThreshold: number;
  emaFast: number;
  emaSlow: number;
  volWindow: number;
  volPctForExit: number;
  rsiLen: number;
  rsiExitLong: number;
  rsiExitShort: number;
  structureLookback: number;
  maxIntradeDrawdownR: number;
  maxBarsInTrade: number;
  enableScaleOuts: boolean;
  minBarsForIndicators: number;
}

interface RiskAnalysis {
  symbol: string;
  action: 'hold' | 'exit' | 'scale_out';
  reason: string;
  confidence: number;
  factors: {
    momentum: number;
    volExpansion: number;
    rsiStress: number;
    structureBreak: number;
    drawdown: number;
    time: number;
  };
  compositeScore: number;
}

function useRiskConfig() {
  return useQuery({
    queryKey: ['/api/risk/config'],
    staleTime: 300000, // 5 minutes
  });
}

function useRiskAnalysis() {
  return useQuery({
    queryKey: ['/api/risk/analysis'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000,
  });
}

function useUpdateRiskConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: Partial<RiskConfig>) => 
      fetch("/api/risk/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/risk/analysis"] });
    }
  });
}

export function AdvancedRiskDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "factors" | "config">("overview");
  
  const { data: config } = useRiskConfig();
  const { data: analysis } = useRiskAnalysis();
  const updateConfig = useUpdateRiskConfig();

  const riskConfig = config as RiskConfig;
  const riskAnalysis = (analysis as RiskAnalysis[]) || [];

  const handleConfigUpdate = (updates: Partial<RiskConfig>) => {
    updateConfig.mutate(updates);
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-400';
    if (score >= 0.6) return 'text-orange-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-600';
    if (score >= 0.6) return 'bg-orange-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Advanced Risk Management</h2>
          <p className="text-gray-400">Multi-factor risk assessment and intelligent exit signals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-blue-400">AI-Powered Risk Engine</span>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Active Positions</p>
                <p className="text-2xl font-bold text-blue-400">{riskAnalysis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">High Risk</p>
                <p className="text-2xl font-bold text-red-400">
                  {riskAnalysis.filter(a => a.compositeScore >= 0.7).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Exit Signals</p>
                <p className="text-2xl font-bold text-green-400">
                  {riskAnalysis.filter(a => a.action === 'exit').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Risk Score</p>
                <p className="text-2xl font-bold text-purple-400">
                  {riskAnalysis.length > 0 
                    ? (riskAnalysis.reduce((sum, a) => sum + a.compositeScore, 0) / riskAnalysis.length * 100).toFixed(0)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="overview">Risk Overview</TabsTrigger>
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Position Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAnalysis.map((analysis, index) => (
                  <div key={index} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-bold text-white">{analysis.symbol}</h4>
                        <Badge className={`text-white text-xs ${getRiskBgColor(analysis.compositeScore)}`}>
                          {analysis.action.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getRiskColor(analysis.compositeScore)}`}>
                          {(analysis.compositeScore * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-400">Risk Score</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <Progress 
                        value={analysis.compositeScore * 100} 
                        className="h-2"
                      />
                    </div>

                    <p className="text-sm text-gray-300 mb-3">{analysis.reason}</p>

                    {/* Risk Factor Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {Object.entries(analysis.factors).map(([factor, value]) => (
                        <div key={factor} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{factor}:</span>
                          <span className={getRiskColor(value)}>{(value * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {riskAnalysis.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No positions to analyze</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Risk Factor Weights</CardTitle>
            </CardHeader>
            <CardContent>
              {riskConfig && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Factor Weights</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label>Momentum Weight: {(riskConfig.wMomentum * 100).toFixed(0)}%</Label>
                          <Slider
                            value={[riskConfig.wMomentum * 100]}
                            onValueChange={([value]) => handleConfigUpdate({ wMomentum: value / 100 })}
                            max={50}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Volatility Expansion: {(riskConfig.wVolExpansion * 100).toFixed(0)}%</Label>
                          <Slider
                            value={[riskConfig.wVolExpansion * 100]}
                            onValueChange={([value]) => handleConfigUpdate({ wVolExpansion: value / 100 })}
                            max={50}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>RSI Stress: {(riskConfig.wRsiStress * 100).toFixed(0)}%</Label>
                          <Slider
                            value={[riskConfig.wRsiStress * 100]}
                            onValueChange={([value]) => handleConfigUpdate({ wRsiStress: value / 100 })}
                            max={50}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Additional Factors</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label>Structure Break: {(riskConfig.wStructureBreak * 100).toFixed(0)}%</Label>
                          <Slider
                            value={[riskConfig.wStructureBreak * 100]}
                            onValueChange={([value]) => handleConfigUpdate({ wStructureBreak: value / 100 })}
                            max={50}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Drawdown: {(riskConfig.wDrawdown * 100).toFixed(0)}%</Label>
                          <Slider
                            value={[riskConfig.wDrawdown * 100]}
                            onValueChange={([value]) => handleConfigUpdate({ wDrawdown: value / 100 })}
                            max={50}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Time Factor: {(riskConfig.wTime * 100).toFixed(0)}%</Label>
                          <Slider
                            value={[riskConfig.wTime * 100]}
                            onValueChange={([value]) => handleConfigUpdate({ wTime: value / 100 })}
                            max={50}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-600">
                    <div className="flex items-center justify-between">
                      <Label>Exit Threshold: {(riskConfig.exitThreshold * 100).toFixed(0)}%</Label>
                      <span className="text-sm text-gray-400">Risk score needed to trigger exit</span>
                    </div>
                    <Slider
                      value={[riskConfig.exitThreshold * 100]}
                      onValueChange={([value]) => handleConfigUpdate({ exitThreshold: value / 100 })}
                      min={50}
                      max={95}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {riskConfig && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Technical Parameters</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Fast EMA</Label>
                          <Input
                            type="number"
                            value={riskConfig.emaFast}
                            onChange={(e) => handleConfigUpdate({ emaFast: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label>Slow EMA</Label>
                          <Input
                            type="number"
                            value={riskConfig.emaSlow}
                            onChange={(e) => handleConfigUpdate({ emaSlow: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label>RSI Length</Label>
                          <Input
                            type="number"
                            value={riskConfig.rsiLen}
                            onChange={(e) => handleConfigUpdate({ rsiLen: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label>ATR Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={riskConfig.initialAtrMult}
                            onChange={(e) => handleConfigUpdate({ initialAtrMult: parseFloat(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Risk Limits</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Max Drawdown (R)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={riskConfig.maxIntradeDrawdownR}
                            onChange={(e) => handleConfigUpdate({ maxIntradeDrawdownR: parseFloat(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label>Max Time (Bars)</Label>
                          <Input
                            type="number"
                            value={riskConfig.maxBarsInTrade}
                            onChange={(e) => handleConfigUpdate({ maxBarsInTrade: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label>RSI Exit (Long)</Label>
                          <Input
                            type="number"
                            value={riskConfig.rsiExitLong}
                            onChange={(e) => handleConfigUpdate({ rsiExitLong: parseFloat(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label>RSI Exit (Short)</Label>
                          <Input
                            type="number"
                            value={riskConfig.rsiExitShort}
                            onChange={(e) => handleConfigUpdate({ rsiExitShort: parseFloat(e.target.value) })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={riskConfig.enableScaleOuts}
                          onCheckedChange={(checked) => handleConfigUpdate({ enableScaleOuts: checked })}
                        />
                        <Label>Enable Scale-Outs</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}