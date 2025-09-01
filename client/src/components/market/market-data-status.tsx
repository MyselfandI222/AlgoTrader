import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMarketDataProviders, useRefreshMarketData } from "@/hooks/use-market-data";
import { RefreshCw, Wifi, WifiOff, Clock, AlertCircle } from "lucide-react";

export function MarketDataStatus() {
  const { data: providers, isLoading } = useMarketDataProviders();
  const refreshMutation = useRefreshMarketData();

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="trading-card border">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-400">Loading market data status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isRealTime = providers?.current && providers.current !== "Mock Data";

  return (
    <Card className="trading-card border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isRealTime ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-yellow-400" />
            )}
            <span>Market Data</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw 
              className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} 
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Current Provider:</span>
          <Badge 
            variant={isRealTime ? "default" : "secondary"}
            className={isRealTime ? "bg-green-600" : "bg-yellow-600"}
          >
            {providers?.current || "Unknown"}
          </Badge>
        </div>

        {!isRealTime && (
          <div className="flex items-start space-x-2 p-3 bg-yellow-600/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-200 font-medium">Using Simulated Data</p>
              <p className="text-yellow-300/80">
                Configure API keys for real-time market data
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">Available Providers:</p>
          {providers?.available.map((provider) => (
            <div key={provider.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{provider.name}</span>
              <Badge 
                variant={provider.configured ? "default" : "outline"}
                className="text-xs"
              >
                {provider.configured ? "Configured" : "Not Configured"}
              </Badge>
            </div>
          ))}
        </div>

        {refreshMutation.isSuccess && (
          <div className="text-xs text-green-400 flex items-center space-x-1">
            <RefreshCw className="h-3 w-3" />
            <span>Data refreshed successfully</span>
          </div>
        )}

        {refreshMutation.isError && (
          <div className="text-xs text-red-400 flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>Failed to refresh data</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}