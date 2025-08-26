import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, User, Wallet } from "lucide-react";
import { DepositModal } from "@/components/modals/deposit-modal";
import { WithdrawModal } from "@/components/modals/withdraw-modal";
import { useTradingData } from "@/hooks/use-trading-data";

export function TopBar() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { user, portfolio } = useTradingData();

  return (
    <>
      <header className="trading-card border-b px-6 py-4" data-testid="topbar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-gray-400">
              Welcome back, <span data-testid="user-name">{user?.username || "Trader"}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 trading-accent rounded-lg px-4 py-2">
              <div className="text-right">
                <p className="text-sm text-gray-400">Account Balance</p>
                <p className="font-bold text-lg" data-testid="account-balance">
                  ${user?.balance || "0.00"}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Wallet className="text-white" size={16} />
              </div>
            </div>
            
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowDepositModal(true)}
              data-testid="button-deposit"
            >
              <Plus className="mr-2" size={16} />
              Deposit
            </Button>
            
            <Button 
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => setShowWithdrawModal(true)}
              data-testid="button-withdraw"
            >
              <Minus className="mr-2" size={16} />
              Withdraw
            </Button>
            
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors" data-testid="user-menu">
              <User className="text-white" size={16} />
            </div>
          </div>
        </div>
      </header>

      <DepositModal 
        open={showDepositModal} 
        onOpenChange={setShowDepositModal} 
      />
      <WithdrawModal 
        open={showWithdrawModal} 
        onOpenChange={setShowWithdrawModal} 
      />
    </>
  );
}
