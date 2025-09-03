import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Shield, Target, Zap } from "lucide-react";

interface ExitSignal {
  symbol: string;
  triggerType: 'stop_loss' | 'take_profit' | 'trend_reversal' | 'emergency';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  currentPrice: number;
  targetPrice: number;
  reason: string;
  confidence: number;
}

function useExitSignals() {
  return useQuery({
    queryKey: ['/api/ai/exit-signals'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function ExitSignalsMonitor() {
  const { data: signals, isLoading } = useExitSignals();

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin h-6 w-6 border-b-2 border-blue-400 rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">Monitoring exit signals...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const exitSignals = (signals as ExitSignal[]) || [];
  const emergencySignals = exitSignals.filter(s => s.urgency === 'emergency');
  const highUrgency = exitSignals.filter(s => s.urgency === 'high');
  const activeSignals = exitSignals.filter(s => s.urgency !== 'low');

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'stop_loss': return <Shield className="w-4 h-4" />;
      case 'take_profit': return <Target className="w-4 h-4" />;
      case 'trend_reversal': return <TrendingDown className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span>AI Exit Signals</span>
          {activeSignals.length > 0 && (
            <Badge className="bg-red-600 text-white">
              {activeSignals.length} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Emergency Alerts */}
          {emergencySignals.length > 0 && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h4 className="font-semibold text-red-400">Emergency Exit Signals</h4>
              </div>
              <div className="space-y-2">
                {emergencySignals.map((signal, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{signal.symbol}</span>
                    <span className="text-red-300">{signal.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Signals */}
          <div className="space-y-3">
            {exitSignals.map((signal, index) => (
              <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTriggerIcon(signal.triggerType)}
                    <span className="font-medium text-white">{signal.symbol}</span>
                    <Badge className={`text-white text-xs ${getUrgencyColor(signal.urgency)}`}>
                      {signal.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400">
                    ${signal.currentPrice.toFixed(2)} → ${signal.targetPrice.toFixed(2)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-2">{signal.reason}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 capitalize">
                    {signal.triggerType.replace('_', ' ')}
                  </span>
                  <span className="text-blue-400">
                    Confidence: {(signal.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {exitSignals.length === 0 && (
            <div className="text-center py-6">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-green-400 font-medium">All Clear</p>
              <p className="text-gray-400 text-sm">No exit signals detected</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-600">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{exitSignals.length}</div>
              <div className="text-xs text-gray-400">Total Signals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{highUrgency.length}</div>
              <div className="text-xs text-gray-400">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{emergencySignals.length}</div>
              <div className="text-xs text-gray-400">Emergency</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}