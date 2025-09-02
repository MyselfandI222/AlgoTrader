import { TrendingUp, ArrowRightLeft, Target, Briefcase } from "lucide-react";
import { useTradingData } from "@/hooks/use-trading-data";

export function StatsOverview() {
  const { portfolio, trades } = useTradingData();

  const activeTrades = trades?.filter(trade => trade.side === 'BUY').length || 0;
  const aiTrades = trades?.filter(trade => trade.isAutomatic).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" data-testid="stats-overview">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">Today's P&L</p>
            <p className="text-3xl font-bold text-green-400 mb-1" data-testid="daily-pnl">
              +${portfolio?.dailyPnl || "0.00"}
            </p>
            <p className="text-sm text-green-400 font-medium">
              +{portfolio?.dailyPnlPercent || "0.00"}% ↗
            </p>
          </div>
          <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-green-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">AI Investments</p>
            <p className="text-3xl font-bold text-white mb-1" data-testid="active-trades">{activeTrades}</p>
            <p className="text-sm text-blue-400 font-medium">Active Holdings</p>
          </div>
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <ArrowRightLeft className="w-7 h-7 text-blue-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">AI Success Rate</p>
            <p className="text-3xl font-bold text-white mb-1" data-testid="win-rate">87.3%</p>
            <p className="text-sm text-purple-400 font-medium">Profitable trades</p>
          </div>
          <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Target className="w-7 h-7 text-purple-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">Total Invested</p>
            <p className="text-3xl font-bold text-white mb-1" data-testid="portfolio-value">
              ${portfolio?.totalValue || "0.00"}
            </p>
            <p className="text-sm text-yellow-400 font-medium">AI managed</p>
          </div>
          <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
