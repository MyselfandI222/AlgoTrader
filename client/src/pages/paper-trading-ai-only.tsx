import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketData } from '@/hooks/use-market-data';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bot, Brain, Briefcase, DollarSign, TrendingUp, TrendingDown, 
  Target, Zap, Settings, BarChart 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaperAISettings } from '@/components/paper-ai-settings';
import { PaperAIComparison } from '@/components/paper-ai-comparison';

interface PaperPosition {
  id: string;
  symbol: string;
  shares: number;
  avgPrice: number;
  cost: number;
  pnl: number;
}

const INITIAL_PAPER_BALANCE = 100000; // $100k starting balance

function useTriggerPaperAI() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => fetch("/api/paper-ai/analyze-and-invest", { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      // Refresh any relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/ai/allocation"] });
    }
  });
}

export default function PaperTradingAIOnly() {
  const [paperBalance, setPaperBalance] = useState(INITIAL_PAPER_BALANCE);
  const [paperPositions, setPaperPositions] = useState<PaperPosition[]>([]);
  const [lastAiAnalysis, setLastAiAnalysis] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  const { data: marketData } = useMarketData();
  const triggerPaperAI = useTriggerPaperAI();
  
  // Calculate total P&L
  const totalPnL = paperPositions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalValue = paperBalance + totalPnL;
  const totalPnLPercent = ((totalValue - INITIAL_PAPER_BALANCE) / INITIAL_PAPER_BALANCE) * 100;

  // Auto-trigger AI analysis every 2 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('🤖 Auto-triggering Paper AI analysis...');
      try {
        await triggerPaperAI.mutateAsync();
        setLastAiAnalysis(new Date());
      } catch (error) {
        console.error('Paper AI analysis failed:', error);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [triggerPaperAI]);

  const triggerManualAiAnalysis = async () => {
    try {
      await triggerPaperAI.mutateAsync();
      setLastAiAnalysis(new Date());
    } catch (error) {
      console.error('Manual Paper AI analysis failed:', error);
    }
  };

  const resetAccount = () => {
    if (confirm("Are you sure you want to reset your paper trading account? This will delete all positions and trades.")) {
      setPaperBalance(INITIAL_PAPER_BALANCE);
      setPaperPositions([]);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI-Only Paper Trading</h1>
          <p className="text-gray-400">Fully automated AI trading with real market data</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowComparison(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <BarChart className="w-4 h-4 mr-2" />
            Compare Strategies
          </Button>
          <Button
            onClick={() => setShowSettings(true)}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            AI Settings
          </Button>
          <div className="flex items-center space-x-2 bg-green-600 px-4 py-2 rounded-lg">
            <Bot className="w-4 h-4" />
            <span>AI-Only Mode</span>
          </div>
          <Button 
            onClick={resetAccount}
            variant="outline" 
            className="border-red-600 text-red-400 hover:bg-red-600/10"
          >
            Reset Account
          </Button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Paper Balance</p>
                <p className="text-xl font-bold">${paperBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {totalPnL >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-sm text-gray-400">Total P&L</p>
                <p className={cn("text-xl font-bold", totalPnL >= 0 ? "text-green-400" : "text-red-400")}>
                  ${totalPnL.toFixed(2)} ({totalPnLPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Open Positions</p>
                <p className="text-xl font-bold">{paperPositions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Mode Controls - Always visible in AI-only mode */}
      <Card className="bg-blue-900/20 border-blue-400/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-semibold text-blue-400">AI Trading Mode Active</h3>
                <p className="text-sm text-gray-300">Advanced allocation algorithm is managing your paper portfolio</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={triggerManualAiAnalysis}
                disabled={triggerPaperAI.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {triggerPaperAI.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  "Trigger AI Now"
                )}
              </Button>
              {lastAiAnalysis && (
                <div className="text-xs text-green-400">
                  Last: {lastAiAnalysis.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Managed Positions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-green-400" />
            <span>AI-Managed Positions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paperPositions.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">AI is analyzing the market and will start building positions automatically</p>
              <p className="text-sm text-gray-500 mt-2">The AI analyzes {marketData?.length || 20} stocks every 2 minutes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paperPositions.map((position, index) => {
                const marketStock = marketData?.find(stock => stock.symbol === position.symbol);
                const currentPrice = parseFloat(marketStock?.price || "0");
                const value = position.shares * currentPrice;
                const pnl = value - position.cost;
                const pnlPercent = (pnl / position.cost) * 100;
                
                return (
                  <div key={index} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{position.symbol.substring(0, 2)}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{position.symbol}</div>
                          <div className="text-sm text-gray-400">{position.shares} shares @ ${position.avgPrice.toFixed(2)}</div>
                          <div className="text-xs text-blue-400">AI Selected</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${value.toFixed(2)}</div>
                        <div className={cn(
                          "text-sm font-medium",
                          pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      {showSettings && (
        <PaperAISettings onClose={() => setShowSettings(false)} />
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <PaperAIComparison onClose={() => setShowComparison(false)} />
      )}
    </div>
  );
}