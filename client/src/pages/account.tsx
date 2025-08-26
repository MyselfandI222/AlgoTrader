import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default function Account() {
  return (
    <div className="flex h-screen overflow-hidden trading-bg text-white font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6">
          <div className="trading-card rounded-xl p-6 border">
            <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
            <p className="text-gray-400">Account management features coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
