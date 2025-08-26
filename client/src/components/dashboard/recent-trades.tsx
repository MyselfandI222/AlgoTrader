import { Button } from "@/components/ui/button";
import { useTradingData } from "@/hooks/use-trading-data";

export function RecentTrades() {
  const { trades } = useTradingData();
  const recentTrades = trades?.slice(0, 5) || [];

  return (
    <div className="trading-card rounded-xl p-6 border" data-testid="recent-trades">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Recent AI Investments</h3>
        <Button variant="ghost" className="text-blue-400 hover:text-blue-300 text-sm" data-testid="button-view-all-trades">
          View All
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th className="text-left pb-3">Symbol</th>
              <th className="text-left pb-3">Action</th>
              <th className="text-left pb-3">Price</th>
              <th className="text-right pb-3">P&L</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {recentTrades.length > 0 ? recentTrades.map((trade) => (
              <tr key={trade.id} className="border-t border-gray-700" data-testid={`trade-row-${trade.id}`}>
                <td className="py-3">
                  <div>
                    <span className="font-semibold">{trade.symbol}</span>
                    <span className="text-blue-400 text-sm block">
                      🤖 AI Investment
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-md text-sm ${
                    trade.side === 'BUY' 
                      ? 'success-bg-light success-text' 
                      : 'danger-bg-light danger-text'
                  }`}>
                    {trade.side}
                  </span>
                </td>
                <td className="py-3 text-gray-300">${trade.price}</td>
                <td className={`py-3 text-right font-semibold ${
                  parseFloat(trade.pnl || '0') >= 0 ? 'success-text' : 'danger-text'
                }`}>
                  {parseFloat(trade.pnl || '0') >= 0 ? '+' : ''}${trade.pnl || '0.00'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-8">
                  No trades available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
