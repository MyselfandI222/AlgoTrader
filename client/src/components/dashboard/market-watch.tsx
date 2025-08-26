import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTradingData } from "@/hooks/use-trading-data";

export function MarketWatch() {
  const { marketData, refreshMarketData } = useTradingData();

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
            onClick={() => refreshMarketData()}
            data-testid="button-refresh-market"
          >
            <RefreshCw className="mr-1" size={14} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {marketData?.map((stock) => (
          <div 
            key={stock.symbol} 
            className="p-4 trading-accent rounded-lg trading-hover cursor-pointer transition-colors"
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
    </div>
  );
}
