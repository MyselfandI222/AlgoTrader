import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTradingData } from "@/hooks/use-trading-data";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createTransaction } = useTradingData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !method) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createTransaction({
        type: "DEPOSIT",
        amount,
        method,
        status: "COMPLETED",
        userId: "demo-user-123",
      });

      toast({
        title: "Deposit Successful",
        description: `$${amount} deposited. AI will start investing shortly.`,
      });

      setAmount("");
      setMethod("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "There was an error processing your deposit",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="trading-card border max-w-md" data-testid="deposit-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Deposit Funds</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              data-testid="input-deposit-amount"
            />
          </div>
          
          <div>
            <Label htmlFor="method" className="block text-sm font-medium text-gray-300 mb-2">
              Payment Method
            </Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger 
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="select-payment-method"
              >
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="BANK_ACCOUNT">Bank Account ****1234</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card ****5678</SelectItem>
                <SelectItem value="WIRE_TRANSFER">Wire Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-deposit"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              disabled={isSubmitting}
              data-testid="button-submit-deposit"
            >
              {isSubmitting ? "Processing..." : "Deposit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
