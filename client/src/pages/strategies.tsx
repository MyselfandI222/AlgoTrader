import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default function Strategies() {
  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6">
          <div className="trading-card rounded-xl p-6 border">
            <h1 className="text-2xl font-bold mb-4">AI Trading Strategies</h1>
            <p className="text-gray-400">Strategy configuration coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
