import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTradingData } from "@/hooks/use-trading-data";
import { TrendingUp, TrendingDown, Search, Filter, ArrowUpDown } from "lucide-react";

export function HoldingsList() {
  const { positions, marketData } = useTradingData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "value" | "pnl" | "percent">("value");
  const [filterBy, setFilterBy] = useState<"all" | "profitable" | "losing">("all");

  const filteredPositions = positions?.filter(position => {
    const matchesSearch = position.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const pnl = parseFloat(position.unrealizedPnl || "0");
    
    let matchesFilter = true;
    if (filterBy === "profitable") {
      matchesFilter = pnl > 0;
    } else if (filterBy === "losing") {
      matchesFilter = pnl < 0;
    }
    
    return matchesSearch && matchesFilter;
  }) || [];

  const sortedPositions = [...filteredPositions].sort((a, b) => {
    switch (sortBy) {
      case "symbol":
        return a.symbol.localeCompare(b.symbol);
      case "value":
        return parseFloat(b.marketValue || "0") - parseFloat(a.marketValue || "0");
      case "pnl":
        return parseFloat(b.unrealizedPnl || "0") - parseFloat(a.unrealizedPnl || "0");
      case "percent":
        return parseFloat(b.unrealizedPnlPercent || "0") - parseFloat(a.unrealizedPnlPercent || "0");
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Current Holdings</h2>
        <Badge variant="outline" className="text-blue-400 border-blue-400">
          {sortedPositions.length} positions
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card className="trading-card border">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search holdings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as any)}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="trading-card border">
                <SelectItem value="all">All Holdings</SelectItem>
                <SelectItem value="profitable">Profitable</SelectItem>
                <SelectItem value="losing">Losing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="trading-card border">
                <SelectItem value="value">Market Value</SelectItem>
                <SelectItem value="pnl">P&L Amount</SelectItem>
                <SelectItem value="percent">P&L Percent</SelectItem>
                <SelectItem value="symbol">Symbol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedPositions.map((position) => {
          const pnl = parseFloat(position.unrealizedPnl || "0");
          const pnlPercent = parseFloat(position.unrealizedPnlPercent || "0");
          const isPositive = pnl >= 0;
          const marketPrice = marketData?.find(m => m.symbol === position.symbol);
          
          return (
            <Card key={position.id} className="trading-card border hover:border-blue-500 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{position.symbol}</CardTitle>
                    <p className="text-sm text-gray-400">{position.quantity} shares</p>
                  </div>
                  <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    <div className="text-right">
                      <div className="font-semibold">{isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%</div>
                      <div className="text-sm">{isPositive ? '+' : ''}${pnl.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Current Price</p>
                    <p className="font-semibold">${parseFloat(position.currentPrice || "0").toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Avg Cost</p>
                    <p className="font-semibold">${parseFloat(position.averagePrice || "0").toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Market Value</p>
                    <p className="font-semibold">${parseFloat(position.marketValue || "0").toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Cost Basis</p>
                    <p className="font-semibold">${(parseFloat(position.averagePrice || "0") * parseFloat(position.quantity || "0")).toLocaleString()}</p>
                  </div>
                </div>

                {marketPrice && (
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Day Change:</span>
                      <span className={`font-semibold ${parseFloat(marketPrice.changePercent || "0") >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(marketPrice.changePercent || "0") >= 0 ? '+' : ''}{marketPrice.changePercent}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs border-red-600 text-red-400 hover:bg-red-600">
                    Sell
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedPositions.length === 0 && (
        <Card className="trading-card border">
          <CardContent className="text-center py-12">
            <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No holdings found</h3>
            <p className="text-gray-400">
              {searchTerm || filterBy !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Your AI will start investing once you deposit funds"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}