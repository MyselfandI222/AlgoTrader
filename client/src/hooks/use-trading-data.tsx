import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import type { User, Portfolio, Trade, Strategy, MarketData, Transaction } from "@shared/schema";

const DEMO_USER_ID = "demo-user-123";

export function useTradingData() {
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  // Initialize demo data
  const initMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/demo/init", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setInitialized(true);
    },
  });

  // Initialize demo data on first load
  useEffect(() => {
    if (!initialized) {
      initMutation.mutate();
    }
  }, [initialized, initMutation]);

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", DEMO_USER_ID],
    enabled: initialized,
  });

  // Fetch portfolio data
  const { data: portfolio } = useQuery<Portfolio>({
    queryKey: ["/api/portfolios/user", DEMO_USER_ID],
    enabled: initialized,
  });

  // Fetch trades
  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/trades/portfolio", portfolio?.id],
    enabled: !!portfolio?.id,
  });

  // Fetch strategies
  const { data: strategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies/portfolio", portfolio?.id],
    enabled: !!portfolio?.id,
  });

  // Fetch market data
  const { data: marketData, refetch: refetchMarketData } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
    enabled: initialized,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
      const response = await apiRequest("POST", "/api/transactions", {
        ...transaction,
        userId: DEMO_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  return {
    user,
    portfolio,
    trades,
    strategies,
    marketData,
    createTransaction: createTransactionMutation.mutateAsync,
    refreshMarketData: refetchMarketData,
    isLoading: initMutation.isPending || !initialized,
  };
}
