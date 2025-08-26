import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { AIHoldings } from "@/components/dashboard/ai-holdings";

export default function AIHoldingsPage() {
  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6">
          <AIHoldings />
        </div>
      </main>
    </div>
  );
}
