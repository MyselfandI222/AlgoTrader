import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTradingData } from "@/hooks/use-trading-data";
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  Target, 
  Zap, 
  Shield, 
  BarChart3,
  Play,
  Pause,
  Square,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";

interface AlgorithmStatus {
  id: string;
  name: string;
  status: "running" | "paused" | "stopped" | "error";
  lastSignal: "buy" | "sell" | "hold" | "none";
  signalStrength: number;
  lastExecution: Date;
  positions: number;
  pnl: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
}

export function AlgorithmEngine() {
  const { strategies, trades, positions } = useTradingData();
  const [algorithms, setAlgorithms] = useState<AlgorithmStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Initialize algorithm status based on strategies
    if (strategies) {
      const algorithmStatus: AlgorithmStatus[] = strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        status: strategy.isActive ? "running" : "paused",
        lastSignal: Math.random() > 0.5 ? "buy" : Math.random() > 0.3 ? "sell" : "hold",
        signalStrength: Math.floor(Math.random() * 40) + 60, // 60-100%
        lastExecution: new Date(Date.now() - Math.random() * 3600000), // Last hour
        positions: positions?.filter(p => trades?.some(t => t.symbol === p.symbol && t.strategyName === strategy.name)).length || 0,
        pnl: parseFloat(strategy.totalPnl || "0"),
        winRate: Math.floor(Math.random() * 30) + 65, // 65-95%
        sharpeRatio: Math.random() * 1.5 + 0.8, // 0.8-2.3
        maxDrawdown: Math.random() * 8 + 3, // 3-11%
        trades: trades?.filter(t => t.strategyName === strategy.name).length || 0
      }));
      setAlgorithms(algorithmStatus);
    }
  }, [strategies, trades, positions]);

  const getStatusColor = (status: AlgorithmStatus["status"]) => {
    switch (status) {
      case "running": return "text-green-400 bg-green-400/20";
      case "paused": return "text-yellow-400 bg-yellow-400/20";
      case "stopped": return "text-gray-400 bg-gray-400/20";
      case "error": return "text-red-400 bg-red-400/20";
      default: return "text-gray-400 bg-gray-400/20";
    }
  };

  const getSignalColor = (signal: AlgorithmStatus["lastSignal"]) => {
    switch (signal) {
      case "buy": return "text-green-400";
      case "sell": return "text-red-400";
      case "hold": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  const getSignalIcon = (signal: AlgorithmStatus["lastSignal"]) => {
    switch (signal) {
      case "buy": return TrendingUp;
      case "sell": return TrendingUp;
      case "hold": return Target;
      default: return Target;
    }
  };

  const controlAlgorithm = (id: string, action: "start" | "pause" | "stop") => {
    setAlgorithms(prev => prev.map(algo => 
      algo.id === id 
        ? { ...algo, status: action === "start" ? "running" : action as any }
        : algo
    ));
  };

  const runMarketScan = () => {
    setIsProcessing(true);
    // Simulate market scanning
    setTimeout(() => {
      setIsProcessing(false);
      // Update signal strengths
      setAlgorithms(prev => prev.map(algo => ({
        ...algo,
        signalStrength: Math.floor(Math.random() * 40) + 60,
        lastSignal: Math.random() > 0.6 ? "buy" : Math.random() > 0.4 ? "sell" : "hold"
      })));
    }, 3000);
  };

  const totalAlgorithms = algorithms.length;
  const runningAlgorithms = algorithms.filter(a => a.status === "running").length;
  const totalPositions = algorithms.reduce((sum, a) => sum + a.positions, 0);
  const totalPnL = algorithms.reduce((sum, a) => sum + a.pnl, 0);
  const avgWinRate = algorithms.length > 0 ? algorithms.reduce((sum, a) => sum + a.winRate, 0) / algorithms.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Algorithm Engine</h2>
          <p className="text-gray-400">Real-time trading algorithm monitoring and control</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={runMarketScan} 
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Activity size={16} className="mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Activity size={16} className="mr-2" />
                Market Scan
              </>
            )}
          </Button>
          <Button variant="outline">
            <Settings size={16} className="mr-2" />
            Global Settings
          </Button>
        </div>
      </div>

      {/* Engine Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="trading-card border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Running Algorithms</p>
                <p className="text-2xl font-bold text-green-400">{runningAlgorithms}/{totalAlgorithms}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Positions</p>
                <p className="text-2xl font-bold">{totalPositions}</p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total P&L</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Win Rate</p>
                <p className="text-2xl font-bold text-blue-400">{avgWinRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Algorithm Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {algorithms.map((algorithm) => {
          const SignalIcon = getSignalIcon(algorithm.lastSignal);
          const timeSinceExecution = Math.floor((Date.now() - algorithm.lastExecution.getTime()) / 60000);
          
          return (
            <Card key={algorithm.id} className="trading-card border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-600/20">
                      <Brain size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{algorithm.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(algorithm.status)}>
                          {algorithm.status.toUpperCase()}
                        </Badge>
                        <div className={`flex items-center space-x-1 ${getSignalColor(algorithm.lastSignal)}`}>
                          <SignalIcon size={14} />
                          <span className="text-xs font-semibold">{algorithm.lastSignal.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {algorithm.status !== "running" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => controlAlgorithm(algorithm.id, "start")}
                        className="text-green-400 border-green-400 hover:bg-green-400"
                      >
                        <Play size={14} />
                      </Button>
                    )}
                    {algorithm.status === "running" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => controlAlgorithm(algorithm.id, "pause")}
                        className="text-yellow-400 border-yellow-400 hover:bg-yellow-400"
                      >
                        <Pause size={14} />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => controlAlgorithm(algorithm.id, "stop")}
                      className="text-red-400 border-red-400 hover:bg-red-400"
                    >
                      <Square size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Signal Strength</span>
                    <span className="font-semibold">{algorithm.signalStrength}%</span>
                  </div>
                  <Progress value={algorithm.signalStrength} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Positions</p>
                    <p className="font-semibold">{algorithm.positions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Trades</p>
                    <p className="font-semibold">{algorithm.trades}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">P&L</p>
                    <p className={`font-semibold ${algorithm.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {algorithm.pnl >= 0 ? '+' : ''}${algorithm.pnl.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Win Rate</p>
                    <p className="font-semibold text-blue-400">{algorithm.winRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Sharpe Ratio</p>
                    <p className="font-semibold">{algorithm.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Max Drawdown</p>
                    <p className="font-semibold text-orange-400">{algorithm.maxDrawdown.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>Last execution: {timeSinceExecution}m ago</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Real-time Feed */}
      <Card className="trading-card border">
        <CardHeader>
          <CardTitle>Real-time Algorithm Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <div className="flex items-center space-x-3 p-3 trading-accent rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Momentum Growth detected strong BUY signal for NVDA</p>
                <p className="text-xs text-gray-400">Signal strength: 87% • 2 minutes ago</p>
              </div>
              <Badge className="text-green-400 bg-green-400/20">BUY</Badge>
            </div>
            
            <div className="flex items-center space-x-3 p-3 trading-accent rounded-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">AI Value Discovery rebalancing portfolio allocation</p>
                <p className="text-xs text-gray-400">Risk threshold reached • 5 minutes ago</p>
              </div>
              <Badge className="text-yellow-400 bg-yellow-400/20">REBALANCE</Badge>
            </div>
            
            <div className="flex items-center space-x-3 p-3 trading-accent rounded-lg">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Volatility Harvesting triggered stop-loss for TSLA</p>
                <p className="text-xs text-gray-400">Position closed at 5.2% loss • 8 minutes ago</p>
              </div>
              <Badge className="text-red-400 bg-red-400/20">SELL</Badge>
            </div>
            
            <div className="flex items-center space-x-3 p-3 trading-accent rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Market Sentiment AI analyzing earnings sentiment for AAPL</p>
                <p className="text-xs text-gray-400">Processing 2,847 news articles • 12 minutes ago</p>
              </div>
              <Badge className="text-blue-400 bg-blue-400/20">ANALYZE</Badge>
            </div>
            
            <div className="flex items-center space-x-3 p-3 trading-accent rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Statistical Pairs Trading identified mean reversion opportunity</p>
                <p className="text-xs text-gray-400">GOOGL/META correlation: 0.89 • 15 minutes ago</p>
              </div>
              <Badge className="text-purple-400 bg-purple-400/20">PAIRS</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}