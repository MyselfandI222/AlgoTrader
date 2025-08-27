import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { PerformanceOverview } from "@/components/analytics/performance-overview";
import { PerformanceCharts } from "@/components/analytics/performance-charts";
import { StrategyPerformance } from "@/components/analytics/strategy-performance";
import { TradingInsights } from "@/components/analytics/trading-insights";
import { Button } from "@/components/ui/button";
import { BarChart3, Target, Brain, FileText, Calendar } from "lucide-react";

export default function Analytics() {
  const [activeSection, setActiveSection] = useState<"overview" | "charts" | "strategies" | "insights">("overview");

  const sections = [
    { id: "overview" as const, label: "Performance Overview", icon: BarChart3 },
    { id: "charts" as const, label: "Charts & Analysis", icon: Target },
    { id: "strategies" as const, label: "Strategy Performance", icon: Brain },
    { id: "insights" as const, label: "Trading Insights", icon: FileText },
  ];

  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
                <p className="text-gray-400">
                  Comprehensive insights into your AI investment performance and strategy effectiveness
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Last updated: 2 min ago</span>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="flex space-x-1 trading-accent rounded-lg p-1 w-fit">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                    data-testid={`section-${section.id}`}
                  >
                    <Icon size={16} />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Section Content */}
            {activeSection === "overview" && <PerformanceOverview />}
            {activeSection === "charts" && <PerformanceCharts />}
            {activeSection === "strategies" && <StrategyPerformance />}
            {activeSection === "insights" && <TradingInsights />}
          </div>
        </div>
      </main>
    </div>
  );
}