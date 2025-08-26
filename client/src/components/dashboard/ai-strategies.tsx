import { Button } from "@/components/ui/button";
import { useTradingData } from "@/hooks/use-trading-data";

export function AIStrategies() {
  const { strategies } = useTradingData();

  return (
    <div className="trading-card rounded-xl p-6 border" data-testid="ai-strategies">
      <h3 className="text-xl font-bold mb-6">AI Investment Strategies</h3>
      
      <div className="space-y-4">
        {strategies?.map((strategy) => (
          <div key={strategy.id} className="p-4 trading-accent rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold" data-testid={`strategy-name-${strategy.id}`}>
                  {strategy.name}
                </h4>
                <p className="text-sm text-gray-400">{strategy.description}</p>
              </div>
              <div className="text-right">
                <div className={`w-2 h-2 rounded-full mb-1 ${strategy.isActive ? 'success-bg' : 'bg-yellow-500'}`}></div>
                <span className={`text-xs ${strategy.isActive ? 'success-text' : 'text-yellow-500'}`}>
                  {strategy.isActive ? 'Active' : 'Monitoring'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">
                Risk Allocation: <span className="font-semibold">{strategy.riskAllocation}%</span>
              </span>
              <span className={`font-semibold ${parseFloat(strategy.totalPnl) >= 0 ? 'success-text' : 'danger-text'}`}>
                {parseFloat(strategy.totalPnl) >= 0 ? '+' : ''}${strategy.totalPnl}
              </span>
            </div>
          </div>
        )) || (
          <div className="text-center text-gray-400 py-8">
            No strategies configured
          </div>
        )}
      </div>
      
      <Button 
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
        data-testid="button-configure-strategies"
      >
        Adjust AI Settings
      </Button>
    </div>
  );
}
