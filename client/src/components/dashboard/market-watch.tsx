import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useMarketData, useRefreshMarketData } from "@/hooks/use-market-data";
import { StockDetailModal } from "@/components/trading/stock-detail-modal";
import { useState } from "react";

export function MarketWatch() {
  const { data: marketData, isLoading } = useMarketData();
  const refreshMutation = useRefreshMarketData();
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  return (
    <div className="trading-card rounded-xl p-6 border" data-testid="market-watch">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Market Watch</h3>
        <div className="flex space-x-4">
          <span className="text-sm text-gray-400">
            Updated: <span data-testid="market-updated">2 minutes ago</span>
          </span>
          <Button 
            variant="ghost" 
            className="text-blue-400 hover:text-blue-300 text-sm p-0"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            data-testid="button-refresh-market"
          >
            <RefreshCw className="mr-1" size={14} />
            Refresh
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center text-gray-400 py-8">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading live market data...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {marketData?.map((stock) => (
            <div 
              key={stock.symbol} 
              className="p-4 trading-accent rounded-lg trading-hover cursor-pointer transition-colors hover:bg-blue-600/20"
              onClick={() => setSelectedStock(stock.symbol)}
              data-testid={`stock-card-${stock.symbol}`}
            >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">{stock.symbol}</span>
              <div className={`w-2 h-2 rounded-full ${
                parseFloat(stock.change) >= 0 ? 'success-bg' : 'danger-bg'
              }`}></div>
            </div>
            <p className="text-lg font-semibold" data-testid={`price-${stock.symbol}`}>
              ${stock.price}
            </p>
            <p className={`text-sm ${
              parseFloat(stock.change) >= 0 ? 'success-text' : 'danger-text'
            }`} data-testid={`change-${stock.symbol}`}>
              {parseFloat(stock.change) >= 0 ? '+' : ''}${stock.change} ({stock.changePercent}%)
            </p>
          </div>
        )) || (
            <div className="col-span-full text-center text-gray-400 py-8">
              No market data available
            </div>
          )}
        </div>
      )}
      
      <StockDetailModal 
        symbol={selectedStock}
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
      />
    </div>
  );
}
