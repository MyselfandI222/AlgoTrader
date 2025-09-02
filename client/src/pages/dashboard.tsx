import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { AIStrategies } from "@/components/dashboard/ai-strategies";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { RiskAnalysis } from "@/components/dashboard/risk-analysis";
import { MarketWatch } from "@/components/dashboard/market-watch";
import { MarketDataStatus } from "@/components/market/market-data-status";
import { PaperTradingSidebar } from "@/components/trading/paper-trading-sidebar";

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6 space-y-6 pr-84">
          <StatsOverview />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PortfolioChart />
            </div>
            <AIStrategies />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentTrades />
            </div>
            <div className="space-y-6">
              <MarketDataStatus />
              <RiskAnalysis />
            </div>
          </div>

          <MarketWatch />
        </div>
      </main>
      <PaperTradingSidebar />
    </div>
  );
}
