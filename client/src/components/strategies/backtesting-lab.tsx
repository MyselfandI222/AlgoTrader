import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { 
  Play, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  Target,
  Activity,
  Download,
  Share,
  Settings,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface BacktestResult {
  strategy: string;
  period: string;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgTrade: number;
  volatility: number;
  calmarRatio: number;
}

interface BacktestConfig {
  strategy: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  benchmark: string;
  riskFreeRate: number;
}

export function BacktestingLab() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [config, setConfig] = useState<BacktestConfig>({
    strategy: "momentum",
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    initialCapital: 100000,
    commission: 0.001,
    slippage: 0.0005,
    benchmark: "SPY",
    riskFreeRate: 0.05
  });

  const [results, setResults] = useState<BacktestResult[]>([
    {
      strategy: "Momentum Growth",
      period: "2023-2024",
      totalReturn: 24.7,
      annualizedReturn: 22.3,
      sharpeRatio: 1.87,
      maxDrawdown: 8.2,
      winRate: 68.4,
      profitFactor: 2.34,
      totalTrades: 147,
      avgTrade: 1.2,
      volatility: 14.8,
      calmarRatio: 2.72
    },
    {
      strategy: "AI Value Discovery",
      period: "2023-2024",
      totalReturn: 18.9,
      annualizedReturn: 17.1,
      sharpeRatio: 2.12,
      maxDrawdown: 5.6,
      winRate: 72.1,
      profitFactor: 2.89,
      totalTrades: 89,
      avgTrade: 1.8,
      volatility: 11.2,
      calmarRatio: 3.05
    },
    {
      strategy: "Market Sentiment AI",
      period: "2023-2024",
      totalReturn: 31.4,
      annualizedReturn: 28.7,
      sharpeRatio: 1.64,
      maxDrawdown: 12.3,
      winRate: 64.7,
      profitFactor: 1.98,
      totalTrades: 203,
      avgTrade: 0.9,
      volatility: 18.9,
      calmarRatio: 2.33
    }
  ]);

  // Sample performance data
  const performanceData = [
    { date: "Jan", strategy: 100000, benchmark: 100000 },
    { date: "Feb", strategy: 103500, benchmark: 101200 },
    { date: "Mar", strategy: 108900, benchmark: 98700 },
    { date: "Apr", strategy: 112400, benchmark: 102800 },
    { date: "May", strategy: 109800, benchmark: 104300 },
    { date: "Jun", strategy: 116200, benchmark: 106800 },
    { date: "Jul", strategy: 121500, benchmark: 109200 },
    { date: "Aug", strategy: 118700, benchmark: 107500 },
    { date: "Sep", strategy: 124300, benchmark: 110800 },
    { date: "Oct", strategy: 127800, benchmark: 112300 },
    { date: "Nov", strategy: 125400, benchmark: 113900 },
    { date: "Dec", strategy: 124700, benchmark: 115600 }
  ];

  const drawdownData = [
    { date: "Jan", drawdown: 0 },
    { date: "Feb", drawdown: -2.1 },
    { date: "Mar", drawdown: -1.3 },
    { date: "Apr", drawdown: -3.8 },
    { date: "May", drawdown: -5.2 },
    { date: "Jun", drawdown: -2.9 },
    { date: "Jul", drawdown: -1.1 },
    { date: "Aug", drawdown: -4.7 },
    { date: "Sep", drawdown: -2.3 },
    { date: "Oct", drawdown: -1.8 },
    { date: "Nov", drawdown: -3.5 },
    { date: "Dec", drawdown: -8.2 }
  ];

  const monthlyReturns = [
    { month: "Jan", return: 3.5 },
    { month: "Feb", return: 5.2 },
    { month: "Mar", return: -1.8 },
    { month: "Apr", return: 3.2 },
    { month: "May", return: -2.3 },
    { month: "Jun", return: 5.8 },
    { month: "Jul", return: 4.6 },
    { month: "Aug", return: -2.3 },
    { month: "Sep", return: 4.7 },
    { month: "Oct", return: 2.8 },
    { month: "Nov", return: -1.9 },
    { month: "Dec", return: -0.6 }
  ];

  const runBacktest = () => {
    setIsRunning(true);
    setProgress(0);
    setIsCompleted(false);
    
    // Simulate backtest progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setIsCompleted(true);
          // Auto-hide completion message after 3 seconds
          setTimeout(() => setIsCompleted(false), 3000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const updateConfig = (key: keyof BacktestConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backtesting Laboratory</h2>
          <p className="text-gray-400">Test and optimize your trading algorithms with historical data</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Export Results
          </Button>
          <Button variant="outline">
            <Share size={16} className="mr-2" />
            Share Analysis
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Backtest Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Strategy</Label>
                  <Select value={config.strategy} onValueChange={(value) => updateConfig("strategy", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momentum">Momentum Growth</SelectItem>
                      <SelectItem value="value">AI Value Discovery</SelectItem>
                      <SelectItem value="sentiment">Market Sentiment AI</SelectItem>
                      <SelectItem value="volatility">Volatility Harvesting</SelectItem>
                      <SelectItem value="pairs">Statistical Pairs Trading</SelectItem>
                      <SelectItem value="defensive">Defensive AI Shield</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={config.startDate}
                      onChange={(e) => updateConfig("startDate", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={config.endDate}
                      onChange={(e) => updateConfig("endDate", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Initial Capital ($)</Label>
                  <Input
                    type="number"
                    value={config.initialCapital}
                    onChange={(e) => updateConfig("initialCapital", parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Commission (%)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={config.commission}
                      onChange={(e) => updateConfig("commission", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Slippage (%)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={config.slippage}
                      onChange={(e) => updateConfig("slippage", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Benchmark</Label>
                  <Select value={config.benchmark} onValueChange={(value) => updateConfig("benchmark", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPY">S&P 500 (SPY)</SelectItem>
                      <SelectItem value="QQQ">NASDAQ 100 (QQQ)</SelectItem>
                      <SelectItem value="VTI">Total Stock Market (VTI)</SelectItem>
                      <SelectItem value="IWM">Russell 2000 (IWM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Risk-Free Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.riskFreeRate}
                    onChange={(e) => updateConfig("riskFreeRate", parseFloat(e.target.value))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-blue-600/30 rounded-lg bg-blue-600/10">
                  <h4 className="font-semibold mb-2">Monte Carlo Simulation</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Run 1000+ random scenarios to assess strategy robustness
                  </p>
                  <Button variant="outline" size="sm" className="border-blue-600">
                    Enable Monte Carlo
                  </Button>
                </div>

                <div className="p-4 border border-purple-600/30 rounded-lg bg-purple-600/10">
                  <h4 className="font-semibold mb-2">Walk-Forward Analysis</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Test strategy adaptation over rolling time windows
                  </p>
                  <Button variant="outline" size="sm" className="border-purple-600">
                    Enable Walk-Forward
                  </Button>
                </div>

                <div className="p-4 border border-green-600/30 rounded-lg bg-green-600/10">
                  <h4 className="font-semibold mb-2">Stress Testing</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Evaluate performance during market crashes and volatility spikes
                  </p>
                  <Button variant="outline" size="sm" className="border-green-600">
                    Enable Stress Test
                  </Button>
                </div>

                <div className="p-4 border border-orange-600/30 rounded-lg bg-orange-600/10">
                  <h4 className="font-semibold mb-2">Parameter Optimization</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Find optimal parameters using genetic algorithms
                  </p>
                  <Button variant="outline" size="sm" className="border-orange-600">
                    Enable Optimization
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="trading-card border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Run Backtest</h3>
                <Button 
                  onClick={runBacktest} 
                  disabled={isRunning}
                  className={`transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  data-testid="run-backtest-button"
                >
                  {isRunning ? (
                    <>
                      <Activity size={16} className="mr-2 animate-spin" />
                      Running...
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Start Backtest
                    </>
                  )}
                </Button>
              </div>
              
              {isRunning && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-xs text-gray-400">
                    Processing historical data and calculating performance metrics...
                  </p>
                </div>
              )}

              {isCompleted && (
                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4 animate-in fade-in duration-500">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} className="text-green-400" />
                    <div>
                      <h4 className="font-semibold text-green-400">Backtest Complete!</h4>
                      <p className="text-sm text-gray-300">
                        Strategy analysis finished. Check the Results and Analysis tabs for detailed insights.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-400">Current Configuration</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Strategy:</span> 
                    <span className="ml-2 font-medium">{config.strategy}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Period:</span> 
                    <span className="ml-2 font-medium">{config.startDate} to {config.endDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Capital:</span> 
                    <span className="ml-2 font-medium">${config.initialCapital.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Benchmark:</span> 
                    <span className="ml-2 font-medium">{config.benchmark}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <Card key={index} className="trading-card border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.strategy}</CardTitle>
                    <Badge className="text-green-400 bg-green-400/20">
                      {result.totalReturn > 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">Annual Return</p>
                      <p className="font-semibold text-green-400">{result.annualizedReturn.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Sharpe Ratio</p>
                      <p className="font-semibold">{result.sharpeRatio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Max Drawdown</p>
                      <p className="font-semibold text-red-400">{result.maxDrawdown.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Win Rate</p>
                      <p className="font-semibold text-blue-400">{result.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Profit Factor</p>
                      <p className="font-semibold">{result.profitFactor.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total Trades</p>
                      <p className="font-semibold">{result.totalTrades}</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-700">
                    <Button size="sm" variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Cumulative Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                      <Line 
                        type="monotone" 
                        dataKey="strategy" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Strategy"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="benchmark" 
                        stroke="#6B7280" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Benchmark"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Drawdown Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={drawdownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `${value}%`} />
                      <Line 
                        type="monotone" 
                        dataKey="drawdown" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        fill="#EF4444"
                        fillOpacity={0.3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Monthly Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyReturns}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `${value}%`} />
                      <Bar 
                        dataKey="return" 
                        fill="#10B981"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card border">
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 trading-accent rounded-lg">
                    <p className="text-sm text-gray-400">Volatility</p>
                    <p className="text-lg font-bold">14.8%</p>
                  </div>
                  <div className="p-3 trading-accent rounded-lg">
                    <p className="text-sm text-gray-400">Beta</p>
                    <p className="text-lg font-bold">0.92</p>
                  </div>
                  <div className="p-3 trading-accent rounded-lg">
                    <p className="text-sm text-gray-400">Alpha</p>
                    <p className="text-lg font-bold text-green-400">+8.3%</p>
                  </div>
                  <div className="p-3 trading-accent rounded-lg">
                    <p className="text-sm text-gray-400">R-Squared</p>
                    <p className="text-lg font-bold">0.78</p>
                  </div>
                  <div className="p-3 trading-accent rounded-lg">
                    <p className="text-sm text-gray-400">Calmar Ratio</p>
                    <p className="text-lg font-bold">2.72</p>
                  </div>
                  <div className="p-3 trading-accent rounded-lg">
                    <p className="text-sm text-gray-400">Sortino Ratio</p>
                    <p className="text-lg font-bold">2.89</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="trading-card border">
            <CardHeader>
              <CardTitle>Strategy Comparison Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2">Strategy</th>
                      <th className="text-right p-2">Total Return</th>
                      <th className="text-right p-2">Sharpe</th>
                      <th className="text-right p-2">Max DD</th>
                      <th className="text-right p-2">Win Rate</th>
                      <th className="text-right p-2">Volatility</th>
                      <th className="text-right p-2">Calmar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="p-2 font-medium">{result.strategy}</td>
                        <td className={`p-2 text-right font-semibold ${result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%
                        </td>
                        <td className="p-2 text-right">{result.sharpeRatio.toFixed(2)}</td>
                        <td className="p-2 text-right text-red-400">{result.maxDrawdown.toFixed(1)}%</td>
                        <td className="p-2 text-right text-blue-400">{result.winRate.toFixed(1)}%</td>
                        <td className="p-2 text-right">{result.volatility.toFixed(1)}%</td>
                        <td className="p-2 text-right">{result.calmarRatio.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}