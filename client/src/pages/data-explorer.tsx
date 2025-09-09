import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity, Database, Filter, Download } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

interface MarketData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  sector: string;
  fundamentals?: {
    epsGrowth: number;
    roe: number;
    salesGrowth: number;
    peRatio: number;
    pbRatio: number;
    debtToEquity: number;
    currentRatio: number;
    grossMargin: number;
    operatingMargin: number;
    fundamentalScore: number;
  };
  technicals?: {
    rsi: number;
    breakoutSignal: boolean;
    volumeSurge: boolean;
    movingAverageSignal: string;
    technicalScore: number;
    trendStrength: number;
  };
  combinedScore?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DataExplorer() {
  const [selectedMetric, setSelectedMetric] = useState('price');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedView, setSelectedView] = useState('overview');
  
  const { data: marketData = [], isLoading } = useQuery<MarketData[]>({
    queryKey: ['/api/market'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: aiAnalysis = [] } = useQuery<any[]>({
    queryKey: ['/api/ai/decisions'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Process data for analytics
  const processedData = marketData.map((stock: MarketData) => ({
    ...stock,
    absChange: Math.abs(stock.change),
    marketCapNum: parseFloat(stock.marketCap?.replace(/[^0-9.-]+/g, "") || "0"),
    performanceCategory: stock.changePercent > 3 ? 'Strong Gain' : 
                        stock.changePercent > 0 ? 'Gain' :
                        stock.changePercent > -3 ? 'Loss' : 'Strong Loss'
  }));

  // Filter data by sector
  const filteredData = selectedSector === 'all' 
    ? processedData 
    : processedData.filter(stock => stock.sector === selectedSector);

  // Get unique sectors
  const sectors = Array.from(new Set(marketData.map((stock: MarketData) => stock.sector))).filter(Boolean);

  // Performance distribution data
  const performanceData = [
    { name: 'Strong Gain (>3%)', count: processedData.filter(s => s.changePercent > 3).length, fill: '#00C49F' },
    { name: 'Gain (0-3%)', count: processedData.filter(s => s.changePercent > 0 && s.changePercent <= 3).length, fill: '#82ca9d' },
    { name: 'Loss (0-3%)', count: processedData.filter(s => s.changePercent < 0 && s.changePercent >= -3).length, fill: '#FFBB28' },
    { name: 'Strong Loss (<-3%)', count: processedData.filter(s => s.changePercent < -3).length, fill: '#FF8042' }
  ];

  // Sector performance data
  const sectorData = sectors.map(sector => {
    const sectorStocks = processedData.filter(stock => stock.sector === sector);
    const avgChange = sectorStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / sectorStocks.length;
    const totalVolume = sectorStocks.reduce((sum, stock) => sum + (stock.volume || 0), 0);
    
    return {
      sector,
      avgChange: Number(avgChange.toFixed(2)),
      totalVolume,
      count: sectorStocks.length,
      topStock: sectorStocks.sort((a, b) => b.changePercent - a.changePercent)[0]?.symbol || ''
    };
  });

  // Technical indicators scatter plot data
  const technicalData = processedData.map(stock => ({
    symbol: stock.symbol,
    rsi: stock.technicals?.rsi || 50,
    trendStrength: stock.technicals?.trendStrength || 0,
    changePercent: stock.changePercent,
    technicalScore: stock.technicals?.technicalScore || 0,
    fundamentalScore: stock.fundamentals?.fundamentalScore || 0
  }));

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Symbol,Price,Change,Change%,Volume,Sector,RSI,Technical Score,Fundamental Score,Combined Score\n" +
      filteredData.map(stock => 
        `${stock.symbol},${stock.price},${stock.change},${stock.changePercent},${stock.volume},${stock.sector},${stock.technicals?.rsi || 'N/A'},${stock.technicals?.technicalScore || 'N/A'},${stock.fundamentals?.fundamentalScore || 'N/A'},${stock.combinedScore || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `market-data-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <TopBar />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading market data...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Database className="h-8 w-8 text-blue-400" />
              Data Explorer
            </h1>
            <p className="text-gray-400 mt-1">Advanced market data analytics and visualization</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600">Performance</TabsTrigger>
            <TabsTrigger value="technical" className="data-[state=active]:bg-blue-600">Technical</TabsTrigger>
            <TabsTrigger value="fundamental" className="data-[state=active]:bg-blue-600">Fundamental</TabsTrigger>
            <TabsTrigger value="correlations" className="data-[state=active]:bg-blue-600">Correlations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Stocks</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{filteredData.length}</div>
                  <p className="text-xs text-gray-500">
                    {sectors.length} sectors tracked
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Avg Performance</CardTitle>
                  <Activity className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {(filteredData.reduce((sum, stock) => sum + stock.changePercent, 0) / filteredData.length).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-500">
                    Market average today
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Top Gainer</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  {(() => {
                    const topGainer = filteredData.sort((a, b) => b.changePercent - a.changePercent)[0];
                    return (
                      <div>
                        <div className="text-2xl font-bold text-white">{topGainer?.symbol}</div>
                        <p className="text-xs text-green-400">
                          +{topGainer?.changePercent.toFixed(2)}%
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Top Loser</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  {(() => {
                    const topLoser = filteredData.sort((a, b) => a.changePercent - b.changePercent)[0];
                    return (
                      <div>
                        <div className="text-2xl font-bold text-white">{topLoser?.symbol}</div>
                        <p className="text-xs text-red-400">
                          {topLoser?.changePercent.toFixed(2)}%
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-blue-400" />
                    Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, count }) => `${name}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Sector Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="sector" 
                        stroke="#9CA3AF"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar 
                        dataKey="avgChange" 
                        fill="#3B82F6"
                        name="Avg Change %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Price Performance</CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="changePercent">Change %</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                      <SelectItem value="marketCapNum">Market Cap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="symbol" 
                      stroke="#9CA3AF"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Bar 
                      dataKey={selectedMetric} 
                      fill="#3B82F6"
                      name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Symbol</TableHead>
                        <TableHead className="text-gray-300">Price</TableHead>
                        <TableHead className="text-gray-300">Change</TableHead>
                        <TableHead className="text-gray-300">Change %</TableHead>
                        <TableHead className="text-gray-300">Volume</TableHead>
                        <TableHead className="text-gray-300">Sector</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData
                        .sort((a, b) => b.changePercent - a.changePercent)
                        .slice(0, 10)
                        .map((stock) => (
                          <TableRow key={stock.symbol} className="border-gray-700">
                            <TableCell className="font-medium text-white">{stock.symbol}</TableCell>
                            <TableCell className="text-gray-300">${stock.price.toFixed(2)}</TableCell>
                            <TableCell className={stock.change > 0 ? "text-green-400" : "text-red-400"}>
                              {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}
                            </TableCell>
                            <TableCell className={stock.changePercent > 0 ? "text-green-400" : "text-red-400"}>
                              {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-gray-300">{stock.volume?.toLocaleString() || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {stock.sector}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">RSI vs Trend Strength</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={technicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number" 
                      dataKey="rsi" 
                      name="RSI"
                      stroke="#9CA3AF"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="trendStrength" 
                      name="Trend Strength"
                      stroke="#9CA3AF"
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Scatter 
                      name="Stocks" 
                      dataKey="changePercent" 
                      fill="#3B82F6" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Technical Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredData
                      .filter(stock => stock.technicals)
                      .slice(0, 8)
                      .map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{stock.symbol}</span>
                            {stock.technicals?.breakoutSignal && (
                              <Badge className="bg-green-600 hover:bg-green-700">Breakout</Badge>
                            )}
                            {stock.technicals?.volumeSurge && (
                              <Badge className="bg-blue-600 hover:bg-blue-700">Volume</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-400">RSI</div>
                              <div className="text-white">{stock.technicals?.rsi.toFixed(0) || 'N/A'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">Score</div>
                              <div className="text-white">{stock.technicals?.technicalScore.toFixed(1) || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Technical Score Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={filteredData
                        .filter(stock => stock.technicals?.technicalScore)
                        .map(stock => ({
                          symbol: stock.symbol,
                          technicalScore: stock.technicals?.technicalScore || 0
                        }))
                        .sort((a, b) => b.technicalScore - a.technicalScore)
                        .slice(0, 15)
                      } 
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="symbol" 
                        stroke="#9CA3AF"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="technicalScore" fill="#10B981" name="Technical Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fundamental" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">EPS Growth Leaders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredData
                      .filter(stock => stock.fundamentals?.epsGrowth)
                      .sort((a, b) => (b.fundamentals?.epsGrowth || 0) - (a.fundamentals?.epsGrowth || 0))
                      .slice(0, 5)
                      .map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between">
                          <span className="text-white font-medium">{stock.symbol}</span>
                          <span className="text-green-400">{stock.fundamentals?.epsGrowth.toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">ROE Leaders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredData
                      .filter(stock => stock.fundamentals?.roe)
                      .sort((a, b) => (b.fundamentals?.roe || 0) - (a.fundamentals?.roe || 0))
                      .slice(0, 5)
                      .map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between">
                          <span className="text-white font-medium">{stock.symbol}</span>
                          <span className="text-blue-400">{stock.fundamentals?.roe.toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Sales Growth Leaders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredData
                      .filter(stock => stock.fundamentals?.salesGrowth)
                      .sort((a, b) => (b.fundamentals?.salesGrowth || 0) - (a.fundamentals?.salesGrowth || 0))
                      .slice(0, 5)
                      .map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between">
                          <span className="text-white font-medium">{stock.symbol}</span>
                          <span className="text-purple-400">{stock.fundamentals?.salesGrowth.toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fundamental Score vs Price Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart 
                    data={technicalData.filter(stock => stock.fundamentalScore > 0)} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number" 
                      dataKey="fundamentalScore" 
                      name="Fundamental Score"
                      stroke="#9CA3AF"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="changePercent" 
                      name="Change %"
                      stroke="#9CA3AF"
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Scatter name="Stocks" dataKey="technicalScore" fill="#8B5CF6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Technical vs Fundamental Scoring</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart 
                    data={technicalData.filter(stock => stock.fundamentalScore > 0 && stock.technicalScore > 0)} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number" 
                      dataKey="fundamentalScore" 
                      name="Fundamental Score"
                      stroke="#9CA3AF"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="technicalScore" 
                      name="Technical Score"
                      stroke="#9CA3AF"
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Scatter name="Stocks" dataKey="changePercent" fill="#F59E0B" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Combined Score Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {filteredData
                        .filter(stock => stock.combinedScore)
                        .sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0))
                        .slice(0, 10)
                        .map((stock, index) => (
                          <div key={stock.symbol} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-sm">#{index + 1}</span>
                              <span className="text-white font-medium">{stock.symbol}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xs text-gray-400">Combined</div>
                                <div className="text-white">{stock.combinedScore?.toFixed(1)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-400">Change</div>
                                <div className={stock.changePercent > 0 ? "text-green-400" : "text-red-400"}>
                                  {stock.changePercent.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">AI Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Stocks Analyzed</span>
                      <span className="text-white font-medium">{marketData.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">AI Decisions</span>
                      <span className="text-white font-medium">{aiAnalysis.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Buy Signals</span>
                      <span className="text-green-400 font-medium">
                        {aiAnalysis.filter((decision: any) => decision.action === 'buy').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Sell Signals</span>
                      <span className="text-red-400 font-medium">
                        {aiAnalysis.filter((decision: any) => decision.action === 'sell').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Hold Signals</span>
                      <span className="text-yellow-400 font-medium">
                        {aiAnalysis.filter((decision: any) => decision.action === 'hold').length}
                      </span>
                    </div>
                    <Separator className="bg-gray-600" />
                    <div className="text-sm text-gray-400">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </main>
    </div>
  );
}