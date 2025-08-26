import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default function History() {
  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6">
          <div className="trading-card rounded-xl p-6 border">
            <h1 className="text-2xl font-bold mb-4">Trading History</h1>
            <p className="text-gray-400">Detailed trading history coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
