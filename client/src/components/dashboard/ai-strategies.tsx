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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50" data-testid="ai-strategies">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">AI Engine</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-xs text-green-400 font-medium">Active</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-500/20">
          <div className="flex items-center space-x-2 mb-3">
            <Bot className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-blue-400">Automated Trading</h4>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            AI analyzes markets and executes trades automatically
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Risk: <span className="text-white font-medium capitalize">{(settings as any)?.riskTolerance || 'moderate'}</span>
            </span>
            <Badge className="bg-green-600 text-white text-xs px-2 py-1">
              Active
            </Badge>
          </div>
        </div>

        <div className="p-4 bg-gray-700/30 rounded-xl">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-medium text-white">Strategies</span>
          </div>
          <div className="space-y-2">
            {(settings as any)?.strategies?.map((strategy: string) => (
              <div key={strategy} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 capitalize">{strategy.replace('_', ' ')}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              </div>
            )) || (
              <div className="text-sm text-gray-400">Loading...</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center p-3 bg-gray-700/20 rounded-lg">
            <div className="text-gray-400 mb-1">Investment</div>
            <div className="text-white font-semibold">${((settings as any)?.investmentAmount || 100000).toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-gray-700/20 rounded-lg">
            <div className="text-gray-400 mb-1">Positions</div>
            <div className="text-white font-semibold">{(settings as any)?.maxPositions || 6}</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mt-6">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
          onClick={() => setLocation("/strategies")}
          data-testid="button-configure-strategies"
        >
          Configure Settings
        </Button>
        
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2"
          onClick={manualTrigger}
          disabled={triggerAnalysis.isPending}
          data-testid="button-trigger-analysis"
        >
          {triggerAnalysis.isPending ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            "Analyze Now"
          )}
        </Button>
      </div>

      {lastAnalysis && (
        <div className="flex items-center space-x-2 mt-4 p-3 bg-green-600/10 rounded-lg">
          <AlertCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">
            Last run: {lastAnalysis.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
