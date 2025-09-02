import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketData, useStockQuote } from "@/hooks/use-market-data";
import { DollarSign, TrendingUp, TrendingDown, Clock, Target, Zap, AlertCircle } from "lucide-react";
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

export default function PaperTrading() {
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

  const resetAccount = () => {
    if (confirm("Are you sure you want to reset your paper trading account? This will delete all positions and trades.")) {
      setPaperBalance(INITIAL_PAPER_BALANCE);
      setPaperPositions([]);
      setPaperTrades([]);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Paper Trading</h1>
                <p className="text-gray-400">Test strategies with $100k fake money using real market data</p>
              </div>
            </div>
            <Button 
              onClick={resetAccount}
              variant="outline" 
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              Reset Account
            </Button>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Entry */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span>Place Order</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Symbol</label>
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
                  <label className="text-sm text-gray-400 block mb-2">Order Type</label>
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
                  <label className="text-sm text-gray-400 block mb-2">Quantity</label>
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
                    <label className="text-sm text-gray-400 block mb-2">Limit Price</label>
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

                <div className="bg-gray-900 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="text-white">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Order Value:</span>
                    <span className="text-white">${orderValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available Balance:</span>
                    <span className="text-white">${paperBalance.toLocaleString()}</span>
                  </div>
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

                <div className="flex items-center space-x-2 bg-blue-900/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-300">
                    🎯 Paper trading with real market data - no real money at risk!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Positions and Orders */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="positions">Positions ({paperPositions.length})</TabsTrigger>
                  <TabsTrigger value="orders">Order History ({paperTrades.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="positions" className="space-y-4">
                  {paperPositions.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No open positions</p>
                        <p className="text-sm text-gray-500">Execute your first paper trade to get started!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {paperPositions.map(position => (
                        <Card key={position.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold text-white">{position.symbol}</span>
                                <Badge 
                                  variant={position.side === 'buy' ? "default" : "destructive"}
                                  className={cn(
                                    "text-xs",
                                    position.side === 'buy' ? "bg-green-600" : "bg-red-600"
                                  )}
                                >
                                  {position.side === 'buy' ? 'LONG' : 'SHORT'} {position.quantity}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className={cn(
                                  "text-lg font-bold",
                                  position.pnl >= 0 ? "text-green-400" : "text-red-400"
                                )}>
                                  ${position.pnl.toFixed(2)}
                                </div>
                                <div className={cn(
                                  "text-sm",
                                  position.pnl >= 0 ? "text-green-400" : "text-red-400"
                                )}>
                                  ({position.pnlPercent.toFixed(2)}%)
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400 block">Entry Price</span>
                                <span className="text-white font-semibold">${position.entryPrice.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Current Price</span>
                                <span className="text-white font-semibold">${position.currentPrice.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Market Value</span>
                                <span className="text-white font-semibold">${(position.currentPrice * position.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  {paperTrades.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-8 text-center">
                        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No trading history</p>
                        <p className="text-sm text-gray-500">Your executed trades will appear here</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {paperTrades.slice(0, 20).map(trade => (
                        <Card key={trade.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <span className="font-semibold text-white">{trade.symbol}</span>
                                <Badge 
                                  variant={trade.side === 'buy' ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {trade.side.toUpperCase()}
                                </Badge>
                                <Badge 
                                  variant={trade.status === 'filled' ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {trade.status}
                                </Badge>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-white">
                                  {trade.quantity} @ ${trade.price.toFixed(2)}
                                </div>
                                <div className="text-gray-400">
                                  {trade.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}