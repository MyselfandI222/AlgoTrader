import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTradingData } from "@/hooks/use-trading-data";
import type { Position } from "@shared/schema";

export function AIHoldings() {
  const { positions, marketData } = useTradingData();

  return (
    <div className="space-y-6">
      <div className="trading-card rounded-xl p-6 border" data-testid="ai-holdings">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold">AI Investment Holdings</h3>
            <p className="text-gray-400">What your AI has invested your money in</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Holdings</p>
            <p className="text-xl font-bold">{positions?.length || 0} stocks</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions?.map((position: Position) => {
            const marketPrice = marketData?.find(m => m.symbol === position.symbol);
            const isProfit = parseFloat(position.unrealizedPnl) >= 0;
            
            return (
              <div 
                key={position.id} 
                className="p-4 trading-accent rounded-lg border"
                data-testid={`holding-${position.symbol}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold">{position.symbol}</h4>
                    <p className="text-sm text-gray-400">
                      {position.quantity} shares
                    </p>
                  </div>
                  <div className={`flex items-center space-x-1 ${isProfit ? 'success-text' : 'danger-text'}`}>
                    {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="text-sm font-semibold">
                      {isProfit ? '+' : ''}{position.unrealizedPnlPercent}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Current Price:</span>
                    <span className="font-semibold">${position.currentPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Avg Cost:</span>
                    <span className="text-gray-300">${position.averagePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Market Value:</span>
                    <span className="font-semibold">${position.marketValue}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-sm text-gray-400">Unrealized P&L:</span>
                    <span className={`font-semibold ${isProfit ? 'success-text' : 'danger-text'}`}>
                      {isProfit ? '+' : ''}${position.unrealizedPnl}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-blue-600/20 rounded text-xs text-blue-400">
                  🤖 AI selected this investment based on market analysis
                </div>
              </div>
            );
          }) || (
            <div className="col-span-full text-center text-gray-400 py-12">
              <p className="text-lg mb-2">No AI investments yet</p>
              <p className="text-sm">Deposit funds to start AI investing</p>
            </div>
          )}
        </div>
        
        {positions && positions.length > 0 && (
          <div className="mt-6 p-4 trading-accent rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-400">AI Investment Strategy</h4>
                <p className="text-sm text-gray-400">
                  Your AI automatically diversifies across growth stocks, 
                  rebalances regularly, and optimizes for long-term returns
                </p>
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-adjust-strategy"
              >
                Adjust Strategy
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="trading-card rounded-xl p-6 border">
        <h4 className="text-xl font-bold mb-4">How AI Investment Works</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h5 className="font-semibold mb-2">You Deposit</h5>
            <p className="text-sm text-gray-400">Add money to your account anytime</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h5 className="font-semibold mb-2">AI Analyzes</h5>
            <p className="text-sm text-gray-400">AI studies market data and trends</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h5 className="font-semibold mb-2">AI Invests</h5>
            <p className="text-sm text-gray-400">Automatically buys optimal stocks</p>
          </div>
        </div>
      </div>
    </div>
  );
}