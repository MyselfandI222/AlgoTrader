import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { HoldingsList } from "@/components/portfolio/holdings-list";
import { AllocationBreakdown } from "@/components/portfolio/allocation-breakdown";
import { RecentActivity } from "@/components/portfolio/recent-activity";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { BarChart3, PieChart, Activity, TrendingUp } from "lucide-react";

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<"overview" | "holdings" | "allocation" | "activity">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "holdings" as const, label: "Holdings", icon: TrendingUp },
    { id: "allocation" as const, label: "Allocation", icon: PieChart },
    { id: "activity" as const, label: "Activity", icon: Activity },
  ];

  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6 space-y-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Investments</h1>
              <p className="text-gray-400">
                Track your AI-managed portfolio performance, holdings, and investment activity
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 trading-accent rounded-lg p-1 w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <PortfolioSummary />
                <PortfolioChart />
              </div>
            )}
            {activeTab === "holdings" && <HoldingsList />}
            {activeTab === "allocation" && <AllocationBreakdown />}
            {activeTab === "activity" && <RecentActivity />}
          </div>
        </div>
      </main>
    </div>
  );
}
