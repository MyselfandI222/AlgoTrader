import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { StrategyOverview } from "@/components/strategies/strategy-overview";
import { StrategyList } from "@/components/strategies/strategy-list";
import { RiskManagement } from "@/components/strategies/risk-management";
import { Button } from "@/components/ui/button";
import { Brain, Shield, BarChart3 } from "lucide-react";

export default function Strategies() {
  const [activeTab, setActiveTab] = useState<"overview" | "strategies" | "risk">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "strategies" as const, label: "AI Strategies", icon: Brain },
    { id: "risk" as const, label: "Risk Management", icon: Shield },
  ];

  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6 space-y-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Trading Strategies</h1>
              <p className="text-gray-400">
                Configure and manage your automated AI investment strategies
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
            {activeTab === "overview" && <StrategyOverview />}
            {activeTab === "strategies" && <StrategyList />}
            {activeTab === "risk" && <RiskManagement />}
          </div>
        </div>
      </main>
    </div>
  );
}
