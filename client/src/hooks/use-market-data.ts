import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StockQuote {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  volume: number;
  timestamp: string;
}

interface MarketDataProvider {
  name: string;
  configured: boolean;
}

interface ProvidersResponse {
  current: string;
  available: MarketDataProvider[];
}

export function useMarketData() {
  return useQuery<StockQuote[]>({
    queryKey: ["/api/market"],
    refetchInterval: 60000, // Refresh every 60 seconds (much more reasonable)
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep data in cache for 5 minutes
  });
}

export function useStockQuote(symbol: string) {
  return useQuery<StockQuote>({
    queryKey: ["/api/market/quote", symbol],
    refetchInterval: 60000, // Refresh every 60 seconds (same as market data)
    staleTime: 30000, // Consider data stale after 30 seconds
    enabled: !!symbol,
    gcTime: 300000, // Keep data in cache for 5 minutes
  });
}

export function useMarketDataProviders() {
  return useQuery<ProvidersResponse>({
    queryKey: ["/api/market/providers"],
    staleTime: 300000, // Providers info doesn't change often - 5 minutes
    refetchInterval: false, // Don't auto-refresh providers
    gcTime: 600000, // Keep in cache for 10 minutes
  });
}

export function useRefreshMarketData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetch("/api/market/refresh", { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      // Invalidate market data queries to trigger refresh
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
    }
  });
}