"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockQuote } from "@/hooks/use-market-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Clock, X } from "lucide-react";
import { useState } from "react";

interface StockDetailModalProps {
  symbol: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type TimePeriod = '1D' | '7D' | '30D' | '90D' | '1Y' | '2Y';

export function StockDetailModal({ symbol, isOpen, onClose }: StockDetailModalProps) {
  const { data: stockData, isLoading } = useStockQuote(symbol || "");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30D');

  if (!symbol) return null;

  // Get number of days and interval based on selected period
  const getPeriodDetails = (period: TimePeriod) => {
    switch (period) {
      case '1D': return { days: 1, interval: 'hour', points: 24, label: '1-Day' };
      case '7D': return { days: 7, interval: 'day', points: 7, label: '7-Day' };
      case '30D': return { days: 30, interval: 'day', points: 30, label: '30-Day' };
      case '90D': return { days: 90, interval: 'day', points: 30, label: '90-Day' }; // Show every 3 days
      case '1Y': return { days: 365, interval: 'week', points: 52, label: '1-Year' };
      case '2Y': return { days: 730, interval: 'month', points: 24, label: '2-Year' };
    }
  };

  // Generate mock historical data for the chart
  const generateHistoricalData = () => {
    const currentPrice = parseFloat(stockData?.price || "100");
    const data = [];
    const now = new Date();
    const { days, interval, points } = getPeriodDetails(selectedPeriod);
    
    for (let i = points; i >= 0; i--) {
      const date = new Date(now);
      
      // Set the date based on interval type
      if (interval === 'hour') {
        date.setHours(date.getHours() - i);
      } else if (interval === 'day') {
        date.setDate(date.getDate() - i);
      } else if (interval === 'week') {
        date.setDate(date.getDate() - (i * 7));
      } else if (interval === 'month') {
        date.setMonth(date.getMonth() - i);
      }
      
      // Generate realistic price movement
      const variance = (Math.random() - 0.5) * 0.1; // ±10% variance
      const trendFactor = selectedPeriod === '1D' ? 0.001 : 0.002; // Less trend for shorter periods
      const price = currentPrice * (1 + variance - (i * trendFactor));
      
      // Format date based on period
      let dateStr;
      if (selectedPeriod === '1D') {
        dateStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (selectedPeriod === '1Y' || selectedPeriod === '2Y') {
        dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      data.push({
        date: dateStr,
        price: price,
        volume: Math.floor(Math.random() * 5000000) + 1000000
      });
    }
    
    return data;
  };

  const historicalData = generateHistoricalData();
  const isPositive = parseFloat(stockData?.change || "0") >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-3xl font-bold text-white">{symbol}</DialogTitle>
            <p className="text-gray-400 mt-1">Real-time stock data</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 animate-pulse text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400">Loading stock data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Price Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-gray-400">Current Price</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">${stockData?.price}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    {isPositive ? (
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    )}
                    <span className="text-sm text-gray-400">Change</span>
                  </div>
                  <p className={`text-xl font-bold mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}${stockData?.change} ({stockData?.changePercent}%)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Volume</span>
                  </div>
                  <p className="text-xl font-bold text-white mt-2">
                    {(stockData?.volume || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm text-gray-400">Status</span>
                  </div>
                  <Badge variant="default" className="mt-2 bg-green-600">
                    Live Data
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="chart" className="text-white data-[state=active]:bg-blue-600">
                  Price Chart
                </TabsTrigger>
                <TabsTrigger value="volume" className="text-white data-[state=active]:bg-blue-600">
                  Volume Analysis
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-white data-[state=active]:bg-blue-600">
                  Trading Actions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{getPeriodDetails(selectedPeriod).label} Price History</CardTitle>
                      
                      {/* Time Period Selection */}
                      <div className="flex space-x-2">
                        {(['1D', '7D', '30D', '90D', '1Y', '2Y'] as TimePeriod[]).map((period) => (
                          <Button
                            key={period}
                            variant={selectedPeriod === period ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedPeriod(period)}
                            className={`text-xs transition-colors ${
                              selectedPeriod === period 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
                            }`}
                            data-testid={`period-${period}`}
                          >
                            {period}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPrice)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="volume" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Volume Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any) => [value.toLocaleString(), 'Volume']}
                        />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-green-400">Buy {symbol}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Shares</label>
                        <input 
                          type="number" 
                          placeholder="Number of shares"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Order Type</label>
                        <select className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                          <option>Market Order</option>
                          <option>Limit Order</option>
                          <option>Stop Loss</option>
                        </select>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Place Buy Order
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-red-400">Sell {symbol}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Shares</label>
                        <input 
                          type="number" 
                          placeholder="Number of shares"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Order Type</label>
                        <select className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white">
                          <option>Market Order</option>
                          <option>Limit Order</option>
                          <option>Stop Loss</option>
                        </select>
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        Place Sell Order
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">AI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <span className="text-gray-300">Technical Score</span>
                        <Badge variant={isPositive ? "default" : "secondary"} className={isPositive ? "bg-green-600" : "bg-red-600"}>
                          {isPositive ? "BULLISH" : "BEARISH"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <span className="text-gray-300">Support Level</span>
                        <span className="text-white font-bold">${(parseFloat(stockData?.price || "100") * 0.95).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <span className="text-gray-300">Resistance Level</span>
                        <span className="text-white font-bold">${(parseFloat(stockData?.price || "100") * 1.05).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}