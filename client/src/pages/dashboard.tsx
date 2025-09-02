import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { AIStrategies } from "@/components/dashboard/ai-strategies";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { RiskAnalysis } from "@/components/dashboard/risk-analysis";
import { MarketWatch } from "@/components/dashboard/market-watch";
import { MarketDataStatus } from "@/components/market/market-data-status";

export default function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6 space-y-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Investment Dashboard</h1>
            <p className="text-gray-400">AI-powered trading platform with automated investment strategies</p>
          </div>

          {/* Key Stats - Clean and prominent */}
          <StatsOverview />
          
          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Portfolio Performance - Takes more space */}
            <div className="xl:col-span-3">
              <PortfolioChart />
            </div>
            
            {/* AI Control Panel - Compact side panel */}
            <div className="xl:col-span-1">
              <AIStrategies />
            </div>
          </div>

          {/* Secondary Information */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Recent Activity */}
            <div className="xl:col-span-2">
              <RecentTrades />
            </div>
            
            {/* Market Status */}
            <div className="xl:col-span-1">
              <MarketDataStatus />
            </div>
            
            {/* Risk Overview */}
            <div className="xl:col-span-1">
              <RiskAnalysis />
            </div>
          </div>

          {/* Market Overview - Full width at bottom */}
          <div className="mt-8">
            <MarketWatch />
          </div>
        </div>
      </main>
    </div>
  );
}
