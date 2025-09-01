import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import type { User, Portfolio, Trade, Strategy, MarketData, Transaction, Position } from "@shared/schema";

const DEMO_USER_ID = "demo-user-123";

// Global initialization state - shared across all hook instances
let globalInitialized = false;
let initPromise: Promise<any> | null = null;

export function useTradingData() {
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(globalInitialized);

  // Initialize demo data
  const initMutation = useMutation({
    mutationFn: async () => {
      // Prevent multiple simultaneous init requests
      if (initPromise) {
        return initPromise;
      }
      
      initPromise = apiRequest("POST", "/api/demo/init", {}).then(res => res.json());
      return initPromise;
    },
    onSuccess: () => {
      globalInitialized = true;
      setInitialized(true);
      queryClient.invalidateQueries();
      initPromise = null; // Reset for future use
    },
    onError: () => {
      initPromise = null; // Reset on error
    }
  });

  // Initialize demo data on first load - only if not already initialized globally
  useEffect(() => {
    if (!globalInitialized && !initialized && !initMutation.isPending) {
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

  // Fetch positions
  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/positions/portfolio", portfolio?.id],
    enabled: !!portfolio?.id,
  });

  // Fetch market data - remove duplicate query since useMarketData() already handles this
  const { data: marketData, refetch: refetchMarketData } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
    enabled: initialized,
    staleTime: 60000, // Use same timing as useMarketData
    refetchInterval: 60000, // Consistent with other market data queries
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
    positions,
    marketData,
    createTransaction: createTransactionMutation.mutateAsync,
    refreshMarketData: refetchMarketData,
    isLoading: initMutation.isPending || !initialized,
  };
}
