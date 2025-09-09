import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, TrendingDown, Activity, Pause, Play, Zap, AlertCircle } from "lucide-react";

interface DataPoint {
  id: string;
  timestamp: Date;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  type: 'price' | 'volume' | 'breakout' | 'alert';
  message: string;
}

interface RealTimeFeedProps {
  symbols?: string[];
  maxItems?: number;
}

export function RealTimeFeed({ symbols = [], maxItems = 50 }: RealTimeFeedProps) {
  const [isActive, setIsActive] = useState(true);
  const [feedData, setFeedData] = useState<DataPoint[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [volumeAlertsEnabled, setVolumeAlertsEnabled] = useState(true);

  const { data: marketData = [] } = useQuery({
    queryKey: ['/api/market'],
    refetchInterval: isActive ? 5000 : false, // More frequent updates for real-time feel
  });

  const { data: aiDecisions = [] } = useQuery({
    queryKey: ['/api/ai/decisions'],
    refetchInterval: isActive ? 15000 : false,
  });

  // Simulate real-time data updates
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (marketData.length === 0) return;

      // Generate random data points for demonstration
      const randomStock = marketData[Math.floor(Math.random() * marketData.length)];
      const changePercent = (Math.random() - 0.5) * 8; // -4% to +4%
      const stockPrice = Number(randomStock.price) || 100;
      const change = stockPrice * (changePercent / 100);
      const newPrice = stockPrice + change;
      const volumeMultiplier = 1 + (Math.random() - 0.5) * 0.6; // 0.7x to 1.3x
      const newVolume = (Number(randomStock.volume) || 1000000) * volumeMultiplier;

      const dataTypes = ['price', 'volume', 'breakout', 'alert'];
      let type = 'price';
      let message = `${randomStock.symbol} ${change > 0 ? '↗' : '↘'} $${newPrice.toFixed(2)}`;

      // Generate different types of data points
      if (Math.abs(changePercent) > 3) {
        type = 'breakout';
        message = `${randomStock.symbol} ${changePercent > 0 ? 'BREAKOUT' : 'BREAKDOWN'} ${changePercent.toFixed(2)}%`;
      } else if (volumeMultiplier > 1.2 && volumeAlertsEnabled) {
        type = 'volume';
        message = `${randomStock.symbol} Volume Surge: ${(volumeMultiplier * 100 - 100).toFixed(0)}% above average`;
      } else if (Math.abs(changePercent) > 2.5 && alertsEnabled) {
        type = 'alert';
        message = `${randomStock.symbol} Price Alert: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
      }

      const newDataPoint: DataPoint = {
        id: `${randomStock.symbol}-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        symbol: randomStock.symbol,
        price: newPrice,
        change,
        changePercent,
        volume: newVolume,
        type: type as DataPoint['type'],
        message
      };

      setFeedData(prev => [newDataPoint, ...prev].slice(0, maxItems));
    }, 2000 + Math.random() * 3000); // Random interval 2-5 seconds

    return () => clearInterval(interval);
  }, [isActive, marketData, maxItems, alertsEnabled, volumeAlertsEnabled]);

  const getTypeIcon = (type: DataPoint['type']) => {
    switch (type) {
      case 'breakout':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'volume':
        return <Activity className="h-4 w-4 text-blue-400" />;
      default:
        return <TrendingUp className="h-4 w-4 text-green-400" />;
    }
  };

  const getTypeBadge = (type: DataPoint['type']) => {
    const colors = {
      price: 'bg-gray-600 hover:bg-gray-700',
      volume: 'bg-blue-600 hover:bg-blue-700',
      breakout: 'bg-yellow-600 hover:bg-yellow-700',
      alert: 'bg-red-600 hover:bg-red-700'
    };

    return (
      <Badge className={`text-xs ${colors[type]}`}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className={`h-5 w-5 ${isActive ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
            Real-Time Data Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-2"
            >
              {isActive ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
              id="alerts"
            />
            <label htmlFor="alerts" className="text-sm text-gray-300">Price Alerts</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={volumeAlertsEnabled}
              onCheckedChange={setVolumeAlertsEnabled}
              id="volume-alerts"
            />
            <label htmlFor="volume-alerts" className="text-sm text-gray-300">Volume Alerts</label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">
            {isActive ? `Live feed active • ${feedData.length} updates` : 'Feed paused'}
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-gray-300">Types:</span>
            <span className="text-green-400">PRICE</span>
            <span className="text-blue-400">VOLUME</span>
            <span className="text-yellow-400">BREAKOUT</span>
            <span className="text-red-400">ALERT</span>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-2">
            {feedData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {isActive ? "Waiting for data..." : "Feed is paused"}
              </div>
            ) : (
              feedData.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      {getTypeIcon(item.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{item.symbol}</span>
                          {getTypeBadge(item.type)}
                        </div>
                        <div className="text-sm text-gray-300">{item.message}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{formatTime(item.timestamp)}</div>
                      <div className={`text-sm font-medium ${
                        item.changePercent > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {index < feedData.length - 1 && <Separator className="bg-gray-700" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {feedData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Showing last {Math.min(feedData.length, maxItems)} updates
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFeedData([])}
                className="text-gray-400 hover:text-white"
              >
                Clear Feed
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}