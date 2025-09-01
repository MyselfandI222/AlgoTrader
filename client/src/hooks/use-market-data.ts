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
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useStockQuote(symbol: string) {
  return useQuery<StockQuote>({
    queryKey: ["/api/market/quote", symbol],
    refetchInterval: 15000, // Refresh every 15 seconds for individual quotes
    staleTime: 5000,
    enabled: !!symbol,
  });
}

export function useMarketDataProviders() {
  return useQuery<ProvidersResponse>({
    queryKey: ["/api/market/providers"],
    staleTime: 60000, // Providers info doesn't change often
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