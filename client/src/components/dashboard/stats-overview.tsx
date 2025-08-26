import { TrendingUp, ArrowRightLeft, Target, Briefcase } from "lucide-react";
import { useTradingData } from "@/hooks/use-trading-data";

export function StatsOverview() {
  const { portfolio, trades } = useTradingData();

  const activeTrades = trades?.filter(trade => trade.side === 'BUY').length || 0;
  const aiTrades = trades?.filter(trade => trade.isAutomatic).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-overview">
      <div className="trading-card rounded-xl p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Today's P&L</p>
            <p className="text-2xl font-bold success-text" data-testid="daily-pnl">
              +${portfolio?.dailyPnl || "0.00"}
            </p>
            <p className="text-sm success-text">
              +{portfolio?.dailyPnlPercent || "0.00"}% ↗
            </p>
          </div>
          <div className="w-12 h-12 success-bg-light rounded-lg flex items-center justify-center">
            <TrendingUp className="success-text" />
          </div>
        </div>
      </div>
      
      <div className="trading-card rounded-xl p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">AI Investments</p>
            <p className="text-2xl font-bold" data-testid="active-trades">{activeTrades}</p>
            <p className="text-sm text-blue-400">Active Holdings</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="text-blue-500" />
          </div>
        </div>
      </div>
      
      <div className="trading-card rounded-xl p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">AI Success Rate</p>
            <p className="text-2xl font-bold" data-testid="win-rate">87.3%</p>
            <p className="text-sm success-text">Profitable investments</p>
          </div>
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Target className="text-purple-500" />
          </div>
        </div>
      </div>
      
      <div className="trading-card rounded-xl p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Invested</p>
            <p className="text-2xl font-bold" data-testid="portfolio-value">
              ${portfolio?.totalValue || "0.00"}
            </p>
            <p className="text-sm success-text">AI managed portfolio</p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Briefcase className="text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
