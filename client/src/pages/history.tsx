import { useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingData } from "@/hooks/use-trading-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp, 
  TrendingDown, 
  Brain, 
  User,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  DollarSign,
  Target,
  Clock,
  ArrowUpDown,
  Eye,
  ExternalLink,
  FileText
} from "lucide-react";

interface TradeFilters {
  search: string;
  startDate: string;
  endDate: string;
  side: string; // BUY, SELL, ALL
  tradeType: string; // AUTOMATIC, MANUAL, ALL
  strategy: string;
  symbol: string;
}

export default function History() {
  const { trades, strategies } = useTradingData();
  const [activeTab, setActiveTab] = useState<"trades" | "analytics" | "performance">("trades");
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"date" | "symbol" | "amount" | "pnl">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<TradeFilters>({
    search: "",
    startDate: "",
    endDate: "",
    side: "ALL",
    tradeType: "ALL",
    strategy: "ALL",
    symbol: "ALL"
  });

  const tradesPerPage = 25;

  // Get unique values for filters
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set(trades?.map(t => t.symbol) || []);
    return Array.from(symbols).sort();
  }, [trades]);

  const uniqueStrategies = useMemo(() => {
    const strategies = new Set(trades?.filter(t => t.strategyName).map(t => t.strategyName) || []);
    return Array.from(strategies).sort();
  }, [trades]);

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    if (!trades) return [];

    let filtered = trades.filter(trade => {
      // Search filter
      if (filters.search && !trade.symbol.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Date filters
      if (filters.startDate && new Date(trade.executedAt) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(trade.executedAt) > new Date(filters.endDate)) {
        return false;
      }

      // Side filter
      if (filters.side !== "ALL" && trade.side !== filters.side) {
        return false;
      }

      // Trade type filter
      if (filters.tradeType !== "ALL") {
        const isAutomatic = filters.tradeType === "AUTOMATIC";
        if (trade.isAutomatic !== isAutomatic) {
          return false;
        }
      }

      // Strategy filter
      if (filters.strategy !== "ALL" && trade.strategyName !== filters.strategy) {
        return false;
      }

      // Symbol filter
      if (filters.symbol !== "ALL" && trade.symbol !== filters.symbol) {
        return false;
      }

      return true;
    });

    // Sort trades
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "date":
          aVal = new Date(a.executedAt).getTime();
          bVal = new Date(b.executedAt).getTime();
          break;
        case "symbol":
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case "amount":
          aVal = parseFloat(a.amount);
          bVal = parseFloat(b.amount);
          break;
        case "pnl":
          aVal = parseFloat(a.pnl || "0");
          bVal = parseFloat(b.pnl || "0");
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [trades, filters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * tradesPerPage,
    currentPage * tradesPerPage
  );

  // Analytics data
  const analytics = useMemo(() => {
    if (!trades) return null;

    const totalTrades = trades.length;
    const buyTrades = trades.filter(t => t.side === "BUY").length;
    const sellTrades = trades.filter(t => t.side === "SELL").length;
    const automaticTrades = trades.filter(t => t.isAutomatic).length;
    const manualTrades = totalTrades - automaticTrades;

    const totalPnL = trades.reduce((sum, t) => sum + parseFloat(t.pnl || "0"), 0);
    const profitableTrades = trades.filter(t => parseFloat(t.pnl || "0") > 0).length;
    const losingTrades = trades.filter(t => parseFloat(t.pnl || "0") < 0).length;

    const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    // Monthly P&L data
    const monthlyPnL: Record<string, number> = {};
    trades.forEach(trade => {
      const month = new Date(trade.executedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyPnL[month] = (monthlyPnL[month] || 0) + parseFloat(trade.pnl || "0");
    });

    const monthlyData = Object.entries(monthlyPnL).map(([month, pnl]) => ({
      month,
      pnl: parseFloat(pnl.toFixed(2))
    }));

    // Strategy performance
    const strategyPnL: Record<string, number> = {};
    trades.forEach(trade => {
      const strategy = trade.strategyName || "Manual";
      strategyPnL[strategy] = (strategyPnL[strategy] || 0) + parseFloat(trade.pnl || "0");
    });

    const strategyData = Object.entries(strategyPnL).map(([name, pnl]) => ({
      name,
      pnl: parseFloat(pnl.toFixed(2)),
      fill: name === "Manual" ? "#6B7280" : name.includes("Growth") ? "#10B981" : name.includes("Value") ? "#3B82F6" : name.includes("Sentiment") ? "#F59E0B" : "#8B5CF6"
    }));

    // Symbol distribution
    const symbolCounts: Record<string, number> = {};
    trades.forEach(trade => {
      symbolCounts[trade.symbol] = (symbolCounts[trade.symbol] || 0) + 1;
    });

    const symbolData = Object.entries(symbolCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([symbol, count]) => ({ symbol, count }));

    return {
      totalTrades,
      buyTrades,
      sellTrades,
      automaticTrades,
      manualTrades,
      totalPnL,
      profitableTrades,
      losingTrades,
      totalVolume,
      avgTradeSize,
      winRate,
      monthlyData,
      strategyData,
      symbolData
    };
  }, [trades]);

  const updateFilter = (key: keyof TradeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      startDate: "",
      endDate: "",
      side: "ALL",
      tradeType: "ALL",
      strategy: "ALL",
      symbol: "ALL"
    });
    setCurrentPage(1);
  };

  const exportTrades = () => {
    // Simulate CSV export
    const csvContent = [
      "Date,Symbol,Side,Quantity,Price,Amount,P&L,Strategy,Type",
      ...filteredTrades.map(trade => 
        `${new Date(trade.executedAt).toISOString()},${trade.symbol},${trade.side},${trade.quantity},${trade.price},${trade.amount},${trade.pnl || "0"},${trade.strategyName || "Manual"},${trade.isAutomatic ? "Automatic" : "Manual"}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trading-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTradeIcon = (side: string) => {
    return side === 'BUY' ? TrendingUp : TrendingDown;
  };

  const getTradeColor = (side: string) => {
    return side === 'BUY' ? 'text-green-400' : 'text-red-400';
  };

  const getPnLColor = (pnl: string) => {
    const value = parseFloat(pnl);
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <HistoryIcon className="mr-3" />
                Trading History
              </h1>
              <p className="text-gray-400">
                Comprehensive trading activity with advanced analytics and filtering
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={exportTrades} variant="outline">
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="trading-card border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Trades</p>
                      <p className="text-2xl font-bold">{analytics.totalTrades}</p>
                      <p className="text-xs text-gray-400">
                        {analytics.automaticTrades} AI • {analytics.manualTrades} Manual
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="trading-card border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total P&L</p>
                      <p className={`text-2xl font-bold ${analytics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {analytics.totalPnL >= 0 ? '+' : ''}${analytics.totalPnL.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {analytics.profitableTrades} wins • {analytics.losingTrades} losses
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
                      <p className="text-sm text-gray-400">Win Rate</p>
                      <p className="text-2xl font-bold text-blue-400">{analytics.winRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">
                        Avg: ${analytics.avgTradeSize.toFixed(2)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="trading-card border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Volume</p>
                      <p className="text-2xl font-bold">${analytics.totalVolume.toFixed(0)}</p>
                      <p className="text-xs text-gray-400">
                        {analytics.buyTrades} buys • {analytics.sellTrades} sells
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trades">Trade History</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="space-y-6">
              {/* Filters */}
              <Card className="trading-card border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="mr-2" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Search Symbol</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search symbols..."
                          value={filters.search}
                          onChange={(e) => updateFilter("search", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => updateFilter("startDate", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => updateFilter("endDate", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Trade Side</Label>
                      <Select value={filters.side} onValueChange={(value) => updateFilter("side", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Sides</SelectItem>
                          <SelectItem value="BUY">Buy Only</SelectItem>
                          <SelectItem value="SELL">Sell Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Trade Type</Label>
                      <Select value={filters.tradeType} onValueChange={(value) => updateFilter("tradeType", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          <SelectItem value="AUTOMATIC">AI Only</SelectItem>
                          <SelectItem value="MANUAL">Manual Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Strategy</Label>
                      <Select value={filters.strategy} onValueChange={(value) => updateFilter("strategy", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Strategies</SelectItem>
                          {uniqueStrategies.map(strategy => (
                            <SelectItem key={strategy} value={strategy}>
                              {strategy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Symbol</Label>
                      <Select value={filters.symbol} onValueChange={(value) => updateFilter("symbol", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Symbols</SelectItem>
                          {uniqueSymbols.map(symbol => (
                            <SelectItem key={symbol} value={symbol}>
                              {symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Sort By</Label>
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="symbol">Symbol</SelectItem>
                          <SelectItem value="amount">Amount</SelectItem>
                          <SelectItem value="pnl">P&L</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-400">
                      Showing {filteredTrades.length} of {trades?.length || 0} trades
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      <ArrowUpDown size={14} className="mr-2" />
                      {sortOrder === "asc" ? "Ascending" : "Descending"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trades Table */}
              <Card className="trading-card border">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50 border-b border-gray-700">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-300">Date & Time</th>
                          <th className="text-left p-4 font-semibold text-gray-300">Symbol</th>
                          <th className="text-left p-4 font-semibold text-gray-300">Side</th>
                          <th className="text-right p-4 font-semibold text-gray-300">Quantity</th>
                          <th className="text-right p-4 font-semibold text-gray-300">Price</th>
                          <th className="text-right p-4 font-semibold text-gray-300">Amount</th>
                          <th className="text-right p-4 font-semibold text-gray-300">P&L</th>
                          <th className="text-left p-4 font-semibold text-gray-300">Strategy</th>
                          <th className="text-center p-4 font-semibold text-gray-300">Type</th>
                          <th className="text-center p-4 font-semibold text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTrades.map((trade) => {
                          const Icon = getTradeIcon(trade.side);
                          const pnl = parseFloat(trade.pnl || "0");
                          
                          return (
                            <tr 
                              key={trade.id} 
                              className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <Clock size={14} className="text-gray-400" />
                                  <span className="text-sm">{formatDateTime(trade.executedAt)}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-lg">{trade.symbol}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <div className={`p-1.5 rounded-lg ${trade.side === 'BUY' ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                                    <Icon size={14} className={getTradeColor(trade.side)} />
                                  </div>
                                  <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                                    {trade.side}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-4 text-right font-mono">{trade.quantity}</td>
                              <td className="p-4 text-right font-mono">${trade.price}</td>
                              <td className="p-4 text-right font-mono font-semibold">${trade.amount}</td>
                              <td className={`p-4 text-right font-mono font-semibold ${getPnLColor(trade.pnl || "0")}`}>
                                {pnl >= 0 ? '+' : ''}${trade.pnl || '0.00'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  {trade.isAutomatic ? (
                                    <Badge className="text-xs bg-blue-600">
                                      <Brain size={10} className="mr-1" />
                                      {trade.strategyName || 'AI'}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <User size={10} className="mr-1" />
                                      Manual
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className={`w-2 h-2 rounded-full ${trade.isAutomatic ? 'bg-blue-400' : 'bg-gray-400'}`}></div>
                              </td>
                              <td className="p-4 text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedTrade(trade.id)}
                                >
                                  <Eye size={14} />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredTrades.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No trades found</h3>
                      <p className="text-gray-400">Try adjusting your filters to see more results</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages} ({filteredTrades.length} total trades)
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="trading-card border">
                      <CardHeader>
                        <CardTitle>Monthly P&L Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.monthlyData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                              <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                              <Line 
                                type="monotone" 
                                dataKey="pnl" 
                                stroke="#10B981" 
                                strokeWidth={3}
                                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="trading-card border">
                      <CardHeader>
                        <CardTitle>Strategy Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.strategyData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="pnl"
                                label={(entry) => `${entry.name}: $${entry.pnl}`}
                              >
                                {analytics.strategyData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="trading-card border">
                      <CardHeader>
                        <CardTitle>Top Traded Symbols</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.symbolData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="symbol" stroke="#94A3B8" fontSize={12} />
                              <YAxis stroke="#94A3B8" fontSize={12} />
                              <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="trading-card border">
                      <CardHeader>
                        <CardTitle>Trade Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 trading-accent rounded-lg">
                            <p className="text-sm text-gray-400">Buy Trades</p>
                            <p className="text-xl font-bold text-green-400">{analytics.buyTrades}</p>
                            <p className="text-xs text-gray-400">
                              {((analytics.buyTrades / analytics.totalTrades) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-4 trading-accent rounded-lg">
                            <p className="text-sm text-gray-400">Sell Trades</p>
                            <p className="text-xl font-bold text-red-400">{analytics.sellTrades}</p>
                            <p className="text-xs text-gray-400">
                              {((analytics.sellTrades / analytics.totalTrades) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-4 trading-accent rounded-lg">
                            <p className="text-sm text-gray-400">AI Trades</p>
                            <p className="text-xl font-bold text-blue-400">{analytics.automaticTrades}</p>
                            <p className="text-xs text-gray-400">
                              {((analytics.automaticTrades / analytics.totalTrades) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-4 trading-accent rounded-lg">
                            <p className="text-sm text-gray-400">Manual Trades</p>
                            <p className="text-xl font-bold text-gray-400">{analytics.manualTrades}</p>
                            <p className="text-xs text-gray-400">
                              {((analytics.manualTrades / analytics.totalTrades) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="trading-card border">
                      <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Trades:</span>
                          <span className="font-semibold">{analytics.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Win Rate:</span>
                          <span className="font-semibold text-blue-400">{analytics.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total P&L:</span>
                          <span className={`font-semibold ${analytics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {analytics.totalPnL >= 0 ? '+' : ''}${analytics.totalPnL.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Trade:</span>
                          <span className="font-semibold">${(analytics.totalPnL / analytics.totalTrades).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Best Trade:</span>
                          <span className="font-semibold text-green-400">
                            ${Math.max(...(trades?.map(t => parseFloat(t.pnl || "0")) || [0])).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Worst Trade:</span>
                          <span className="font-semibold text-red-400">
                            ${Math.min(...(trades?.map(t => parseFloat(t.pnl || "0")) || [0])).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="trading-card border">
                      <CardHeader>
                        <CardTitle>Volume Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Volume:</span>
                          <span className="font-semibold">${analytics.totalVolume.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Trade Size:</span>
                          <span className="font-semibold">${analytics.avgTradeSize.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Largest Trade:</span>
                          <span className="font-semibold">
                            ${Math.max(...(trades?.map(t => parseFloat(t.amount)) || [0])).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Smallest Trade:</span>
                          <span className="font-semibold">
                            ${Math.min(...(trades?.map(t => parseFloat(t.amount)) || [0])).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">AI Volume:</span>
                          <span className="font-semibold text-blue-400">
                            ${trades?.filter(t => t.isAutomatic).reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Manual Volume:</span>
                          <span className="font-semibold text-gray-400">
                            ${trades?.filter(t => !t.isAutomatic).reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="trading-card border">
                      <CardHeader>
                        <CardTitle>Strategy Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analytics.strategyData.map((strategy, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">{strategy.name}:</span>
                            <span className={`font-semibold ${strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}