import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Bot, Save, RotateCcw } from "lucide-react";

interface PaperAISettings {
  id: string;
  name: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentAmount: number;
  strategies: string[];
  maxPositions: number;
  diversificationTarget: number;
  volatilityThreshold: number;
  correlationLimit: number;
  rebalanceThreshold: number;
  sectorLimits: Record<string, number>;
}

const AVAILABLE_STRATEGIES = [
  { id: 'momentum', name: 'Momentum Growth', description: 'Follow price trends and momentum' },
  { id: 'value', name: 'AI Value Discovery', description: 'Find undervalued opportunities' },
  { id: 'sentiment', name: 'Market Sentiment AI', description: 'Trade based on market sentiment' },
  { id: 'volatility', name: 'Volatility Harvesting', description: 'Capitalize on market volatility' },
  { id: 'pairs', name: 'Statistical Pairs Trading', description: 'Trade correlated stock pairs' },
  { id: 'defensive', name: 'Defensive AI Shield', description: 'Protect portfolio during downturns' }
];

function usePaperAISettings() {
  return useQuery({
    queryKey: ['/api/paper-ai/settings'],
    staleTime: 300000, // 5 minutes
  });
}

function useUpdatePaperAISettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: PaperAISettings) => 
      fetch("/api/paper-ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paper-ai/settings"] });
    }
  });
}

interface Props {
  onClose: () => void;
}

export function PaperAISettings({ onClose }: Props) {
  const { data: currentSettings } = usePaperAISettings();
  const updateSettings = useUpdatePaperAISettings();
  
  const [settings, setSettings] = useState<PaperAISettings>(() => ({
    id: 'default',
    name: 'Default Strategy',
    riskTolerance: 'moderate',
    investmentAmount: 100000,
    strategies: ['momentum', 'value', 'sentiment'],
    maxPositions: 6,
    diversificationTarget: 0.7,
    volatilityThreshold: 0.25,
    correlationLimit: 0.6,
    rebalanceThreshold: 0.1,
    sectorLimits: {
      'Technology': 0.4,
      'Consumer': 0.3,
      'Automotive': 0.2,
      'Healthcare': 0.3,
      'Financial': 0.25
    }
  }));

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      onClose();
    } catch (error) {
      console.error('Failed to save paper AI settings:', error);
    }
  };

  const handleReset = () => {
    setSettings({
      id: 'default',
      name: 'Default Strategy',
      riskTolerance: 'moderate',
      investmentAmount: 100000,
      strategies: ['momentum', 'value', 'sentiment'],
      maxPositions: 6,
      diversificationTarget: 0.7,
      volatilityThreshold: 0.25,
      correlationLimit: 0.6,
      rebalanceThreshold: 0.1,
      sectorLimits: {
        'Technology': 0.4,
        'Consumer': 0.3,
        'Automotive': 0.2,
        'Healthcare': 0.3,
        'Financial': 0.25
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>Paper Trading AI Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="strategy-name">Strategy Name</Label>
                <Input
                  id="strategy-name"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600"
                  placeholder="My Strategy"
                />
              </div>
              
              <div>
                <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                <Select value={settings.riskTolerance} onValueChange={(value: 'conservative' | 'moderate' | 'aggressive') => setSettings(prev => ({ ...prev, riskTolerance: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="investment-amount">Investment Amount</Label>
                <Input
                  id="investment-amount"
                  type="number"
                  value={settings.investmentAmount}
                  onChange={(e) => setSettings(prev => ({ ...prev, investmentAmount: parseInt(e.target.value) }))}
                  className="bg-gray-700 border-gray-600"
                  min="10000"
                  max="1000000"
                  step="1000"
                />
              </div>

              <div>
                <Label htmlFor="max-positions">Max Positions</Label>
                <Input
                  id="max-positions"
                  type="number"
                  value={settings.maxPositions}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxPositions: parseInt(e.target.value) }))}
                  className="bg-gray-700 border-gray-600"
                  min="1"
                  max="20"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <div>
                <Label>Diversification Target: {(settings.diversificationTarget * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.diversificationTarget]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, diversificationTarget: value }))}
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Volatility Threshold: {(settings.volatilityThreshold * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.volatilityThreshold]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, volatilityThreshold: value }))}
                  min={0.1}
                  max={0.5}
                  step={0.05}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Correlation Limit: {(settings.correlationLimit * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.correlationLimit]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, correlationLimit: value }))}
                  min={0.3}
                  max={0.8}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Rebalance Threshold: {(settings.rebalanceThreshold * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.rebalanceThreshold]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, rebalanceThreshold: value }))}
                  min={0.05}
                  max={0.2}
                  step={0.01}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Strategy Selection */}
          <div>
            <Label className="text-base font-semibold mb-4 block">AI Strategies</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_STRATEGIES.map((strategy) => (
                <div key={strategy.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                  <Checkbox
                    id={`strategy-${strategy.id}`}
                    checked={settings.strategies.includes(strategy.id)}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({
                        ...prev,
                        strategies: checked 
                          ? [...prev.strategies, strategy.id]
                          : prev.strategies.filter(s => s !== strategy.id)
                      }));
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`strategy-${strategy.id}`} className="text-sm font-medium text-white cursor-pointer">
                      {strategy.name}
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">{strategy.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Limits */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Sector Allocation Limits</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(settings.sectorLimits).map(([sector, limit]) => (
                <div key={sector}>
                  <Label className="text-sm">{sector}: {(limit * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[limit]}
                    onValueChange={([value]) => setSettings(prev => ({
                      ...prev,
                      sectorLimits: { ...prev.sectorLimits, [sector]: value }
                    }))}
                    min={0.1}
                    max={0.6}
                    step={0.05}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-600">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateSettings.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}