import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { StrategyOverview } from "@/components/strategies/strategy-overview";
import { StrategyList } from "@/components/strategies/strategy-list";
import { RiskManagement } from "@/components/strategies/risk-management";
import { AdvancedStrategyConfig } from "@/components/strategies/advanced-strategy-config";
import { AlgorithmEngine } from "@/components/strategies/algorithm-engine";
import { BacktestingLab } from "@/components/strategies/backtesting-lab";
import { APISettings } from "@/components/settings/api-settings";
import { AllocationVisualization } from "@/components/ai/allocation-visualization";
import { ExitSignalsMonitor } from "@/components/ai/exit-signals-monitor";
import { StopLossDashboard } from "@/components/stop-loss/stop-loss-dashboard";
import { AdvancedRiskDashboard } from "@/components/risk/advanced-risk-dashboard";
import { Button } from "@/components/ui/button";
import { Brain, Shield, BarChart3, Activity, Target, Key, AlertTriangle } from "lucide-react";

export default function Strategies() {
  const [activeTab, setActiveTab] = useState<"overview" | "strategies" | "allocation" | "exits" | "stoploss" | "advanced-risk" | "risk" | "engine" | "backtest" | "config" | "api">("overview");
  const [selectedStrategy, setSelectedStrategy] = useState<{ id: string; name: string } | null>(null);

  // Handle URL parameters to set the active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'strategies', 'allocation', 'exits', 'stoploss', 'advanced-risk', 'risk', 'engine', 'backtest', 'config', 'api'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "strategies" as const, label: "AI Strategies", icon: Brain },
    { id: "allocation" as const, label: "Advanced Allocation", icon: Target },
    { id: "exits" as const, label: "Exit Signals", icon: AlertTriangle },
    { id: "stoploss" as const, label: "Stop-Loss Manager", icon: Shield },
    { id: "advanced-risk" as const, label: "Advanced Risk Engine", icon: Activity },
    { id: "engine" as const, label: "Algorithm Engine", icon: Activity },
    { id: "backtest" as const, label: "Backtesting Lab", icon: Target },
    { id: "risk" as const, label: "Risk Management", icon: Shield },
    { id: "api" as const, label: "API Settings", icon: Key },
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
            {activeTab === "allocation" && <AllocationVisualization />}
            {activeTab === "exits" && <ExitSignalsMonitor />}
            {activeTab === "stoploss" && <StopLossDashboard />}
            {activeTab === "advanced-risk" && <AdvancedRiskDashboard />}
            {activeTab === "engine" && <AlgorithmEngine />}
            {activeTab === "backtest" && <BacktestingLab />}
            {activeTab === "risk" && <RiskManagement />}
            {activeTab === "api" && <APISettings />}
            {selectedStrategy && (
              <AdvancedStrategyConfig 
                strategyId={selectedStrategy.id}
                strategyName={selectedStrategy.name}
                onClose={() => setSelectedStrategy(null)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
