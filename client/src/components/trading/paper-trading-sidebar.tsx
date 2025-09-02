import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketData, useStockQuote } from "@/hooks/use-market-data";
import { DollarSign, TrendingUp, TrendingDown, Clock, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaperPosition {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  side: 'buy' | 'sell';
  timestamp: Date;
  pnl: number;
  pnlPercent: number;
}

interface PaperTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  orderType: 'market' | 'limit' | 'stop';
  limitPrice?: number;
  timestamp: Date;
  status: 'filled' | 'pending' | 'canceled';
}

const INITIAL_PAPER_BALANCE = 100000; // $100k starting balance

export function PaperTradingSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [paperBalance, setPaperBalance] = useState(INITIAL_PAPER_BALANCE);
  const [paperPositions, setPaperPositions] = useState<PaperPosition[]>([]);
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  
  // Trading form state
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [quantity, setQuantity] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  
  const { data: marketData } = useMarketData();
  const { data: currentQuote } = useStockQuote(selectedSymbol);
  
  const currentPrice = parseFloat(currentQuote?.price || "0");
  const orderValue = parseInt(quantity || "0") * currentPrice;
  
  // Calculate total P&L
  const totalPnL = paperPositions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalValue = paperBalance + totalPnL;
  const totalPnLPercent = ((totalValue - INITIAL_PAPER_BALANCE) / INITIAL_PAPER_BALANCE) * 100;

  // Update position prices when market data changes
  useEffect(() => {
    if (!marketData) return;
    
    setPaperPositions(prev => prev.map(position => {
      const marketStock = marketData.find(stock => stock.symbol === position.symbol);
      if (marketStock) {
        const currentPrice = parseFloat(marketStock.price);
        const pnl = position.side === 'buy' 
          ? (currentPrice - position.entryPrice) * position.quantity
          : (position.entryPrice - currentPrice) * position.quantity;
        const pnlPercent = (pnl / (position.entryPrice * position.quantity)) * 100;
        
        return {
          ...position,
          currentPrice,
          pnl,
          pnlPercent
        };
      }
      return position;
    }));
  }, [marketData]);

  const executePaperTrade = () => {
    if (!currentPrice || !quantity) return;
    
    const tradeQuantity = parseInt(quantity);
    const tradePrice = orderType === 'market' ? currentPrice : parseFloat(limitPrice || "0");
    const tradeValue = tradeQuantity * tradePrice;
    
    // Check if enough balance for buy orders
    if (orderSide === 'buy' && tradeValue > paperBalance) {
      alert("Insufficient paper balance for this trade");
      return;
    }
    
    const newTrade: PaperTrade = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      side: orderSide,
      quantity: tradeQuantity,
      price: tradePrice,
      orderType,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      timestamp: new Date(),
      status: orderType === 'market' ? 'filled' : 'pending'
    };
    
    setPaperTrades(prev => [newTrade, ...prev]);
    
    if (orderType === 'market') {
      // Execute immediately for market orders
      if (orderSide === 'buy') {
        setPaperBalance(prev => prev - tradeValue);
        
        // Add or update position
        setPaperPositions(prev => {
          const existing = prev.find(pos => pos.symbol === selectedSymbol && pos.side === orderSide);
          if (existing) {
            const totalQuantity = existing.quantity + tradeQuantity;
            const weightedPrice = ((existing.entryPrice * existing.quantity) + (tradePrice * tradeQuantity)) / totalQuantity;
            return prev.map(pos => 
              pos.id === existing.id 
                ? { ...pos, quantity: totalQuantity, entryPrice: weightedPrice }
                : pos
            );
          } else {
            const newPosition: PaperPosition = {
              id: Date.now().toString(),
              symbol: selectedSymbol,
              quantity: tradeQuantity,
              entryPrice: tradePrice,
              currentPrice: tradePrice,
              side: orderSide,
              timestamp: new Date(),
              pnl: 0,
              pnlPercent: 0
            };
            return [newPosition, ...prev];
          }
        });
      } else {
        // Sell logic - close existing positions or short
        setPaperBalance(prev => prev + tradeValue);
        
        setPaperPositions(prev => {
          const existingBuy = prev.find(pos => pos.symbol === selectedSymbol && pos.side === 'buy');
          if (existingBuy) {
            if (existingBuy.quantity > tradeQuantity) {
              // Partial close
              return prev.map(pos => 
                pos.id === existingBuy.id
                  ? { ...pos, quantity: pos.quantity - tradeQuantity }
                  : pos
              );
            } else if (existingBuy.quantity === tradeQuantity) {
              // Full close
              return prev.filter(pos => pos.id !== existingBuy.id);
            } else {
              // Over-sell, close position and create short
              const shortQuantity = tradeQuantity - existingBuy.quantity;
              const newShort: PaperPosition = {
                id: Date.now().toString(),
                symbol: selectedSymbol,
                quantity: shortQuantity,
                entryPrice: tradePrice,
                currentPrice: tradePrice,
                side: 'sell',
                timestamp: new Date(),
                pnl: 0,
                pnlPercent: 0
              };
              return [newShort, ...prev.filter(pos => pos.id !== existingBuy.id)];
            }
          } else {
            // Create new short position
            const newPosition: PaperPosition = {
              id: Date.now().toString(),
              symbol: selectedSymbol,
              quantity: tradeQuantity,
              entryPrice: tradePrice,
              currentPrice: tradePrice,
              side: 'sell',
              timestamp: new Date(),
              pnl: 0,
              pnlPercent: 0
            };
            return [newPosition, ...prev];
          }
        });
      }
    }
    
    // Reset form
    setQuantity("10");
    setLimitPrice("");
  };

  if (!isOpen) {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-6 writing-mode-vertical text-sm"
          data-testid="open-paper-trading"
        >
          Paper Trading
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-40 overflow-y-auto">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Paper Trading</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          data-testid="close-paper-trading"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Summary */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Paper Balance</span>
              <span className="font-semibold text-white">${paperBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Total P&L</span>
              <span className={cn("font-semibold", totalPnL >= 0 ? "text-green-400" : "text-red-400")}>
                ${totalPnL.toFixed(2)} ({totalPnLPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Total Value</span>
              <span className="font-semibold text-white">${totalValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Entry */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Place Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Symbol</label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {marketData?.map(stock => (
                    <SelectItem key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - ${stock.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderSide === 'buy' ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderSide('buy')}
                className={cn(
                  orderSide === 'buy' ? "bg-green-600 hover:bg-green-700" : "border-gray-600 hover:bg-gray-700"
                )}
                data-testid="buy-button"
              >
                Buy
              </Button>
              <Button
                variant={orderSide === 'sell' ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderSide('sell')}
                className={cn(
                  orderSide === 'sell' ? "bg-red-600 hover:bg-red-700" : "border-gray-600 hover:bg-gray-700"
                )}
                data-testid="sell-button"
              >
                Sell
              </Button>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Order Type</label>
              <Select value={orderType} onValueChange={(value: 'market' | 'limit' | 'stop') => setOrderType(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop">Stop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-gray-700 border-gray-600"
                placeholder="10"
                data-testid="quantity-input"
              />
            </div>

            {orderType === 'limit' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Limit Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                  placeholder={currentPrice.toFixed(2)}
                  data-testid="limit-price-input"
                />
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <div>Current Price: ${currentPrice.toFixed(2)}</div>
              <div>Order Value: ${orderValue.toFixed(2)}</div>
            </div>

            <Button
              onClick={executePaperTrade}
              className={cn(
                "w-full",
                orderSide === 'buy' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
              disabled={!currentPrice || !quantity || (orderType === 'limit' && !limitPrice)}
              data-testid="execute-trade-button"
            >
              {orderSide === 'buy' ? 'Buy' : 'Sell'} {quantity} {selectedSymbol}
            </Button>
          </CardContent>
        </Card>

        {/* Tabs for Positions and Orders */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">
              Paper Positions ({paperPositions.length})
            </div>
            {paperPositions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No positions</div>
            ) : (
              paperPositions.map(position => (
                <Card key={position.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{position.symbol}</span>
                        <Badge 
                          variant={position.side === 'buy' ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {position.side === 'buy' ? 'LONG' : 'SHORT'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white">{position.quantity} shares</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Entry: </span>
                        <span className="text-white">${position.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Current: </span>
                        <span className="text-white">${position.currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">P&L: </span>
                        <span className={cn(
                          "font-semibold",
                          position.pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          ${position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">
              Recent Orders ({paperTrades.length})
            </div>
            {paperTrades.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No orders</div>
            ) : (
              paperTrades.slice(0, 10).map(trade => (
                <Card key={trade.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{trade.symbol}</span>
                        <Badge 
                          variant={trade.side === 'buy' ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge 
                        variant={trade.status === 'filled' ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {trade.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">
                      {trade.quantity} @ ${trade.price.toFixed(2)} • {trade.orderType}
                    </div>
                    <div className="text-xs text-gray-500">
                      {trade.timestamp.toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="text-xs text-center text-gray-500 p-2 bg-gray-800 rounded">
          🎯 Paper Trading - Test our real market data with $100k fake money!
        </div>
      </div>
    </div>
  );
}