import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bot, Zap, AlertCircle } from "lucide-react";

function useAISettings() {
  return useQuery({
    queryKey: ['/api/ai/settings'],
    staleTime: 300000, // 5 minutes
  });
}

function useTriggerAIAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => fetch("/api/ai/analyze-and-invest", { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/portfolio-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/portfolio-performance"] });
    }
  });
}

export function AIStrategies() {
  const [, setLocation] = useLocation();
  const { data: settings } = useAISettings();
  const triggerAnalysis = useTriggerAIAnalysis();
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // Auto-trigger AI analysis every 2 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('🤖 Auto-triggering AI analysis...');
      try {
        await triggerAnalysis.mutateAsync();
        setLastAnalysis(new Date());
      } catch (error) {
        console.error('Auto AI analysis failed:', error);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [triggerAnalysis]);

  const manualTrigger = async () => {
    try {
      await triggerAnalysis.mutateAsync();
      setLastAnalysis(new Date());
    } catch (error) {
      console.error('Manual AI analysis failed:', error);
    }
  };

  return (
    <div className="trading-card rounded-xl p-6 border" data-testid="ai-strategies">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">AI Investment Engine</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-xs text-green-400">Active</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-400/30">
          <div className="flex items-center space-x-2 mb-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-blue-400">Automated AI Trading</h4>
          </div>
          <p className="text-sm text-gray-300">
            AI continuously analyzes market data and automatically executes trades based on your settings
          </p>
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-400">
              Risk Level: <span className="text-white font-semibold capitalize">{settings?.riskTolerance || 'moderate'}</span>
            </div>
            <Badge variant="default" className="bg-green-600">
              Auto-Trading
            </Badge>
          </div>
        </div>

        <div className="p-4 trading-accent rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold">Active Strategies</span>
          </div>
          <div className="space-y-1">
            {settings?.strategies?.map((strategy: string) => (
              <div key={strategy} className="flex items-center justify-between text-sm">
                <span className="capitalize">{strategy.replace('_', ' ')}</span>
                <div className="w-1 h-1 rounded-full bg-green-400"></div>
              </div>
            )) || (
              <div className="text-sm text-gray-400">Loading strategies...</div>
            )}
          </div>
        </div>

        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Investment Amount:</span>
            <span className="text-white font-semibold">${(settings?.investmentAmount || 100000).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-400">Max Positions:</span>
            <span className="text-white font-semibold">{settings?.maxPositions || 6}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => setLocation("/strategies")}
          data-testid="button-configure-strategies"
        >
          Configure AI Settings
        </Button>
        
        <Button 
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={manualTrigger}
          disabled={triggerAnalysis.isPending}
          data-testid="button-trigger-analysis"
        >
          {triggerAnalysis.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            "Trigger AI Analysis Now"
          )}
        </Button>
      </div>

      {lastAnalysis && (
        <div className="flex items-center space-x-2 mt-3 p-2 bg-green-900/20 rounded text-xs text-green-400">
          <AlertCircle className="w-3 h-3" />
          <span>Last analysis: {lastAnalysis.toLocaleTimeString()}</span>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-900/20 rounded-lg">
        <p className="text-xs text-yellow-300">
          🤖 AI runs automatically every 2 minutes. You can only adjust settings - all trades are automated.
        </p>
      </div>
    </div>
  );
}
