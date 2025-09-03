import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Shield, TrendingUp, TrendingDown, AlertTriangle, Settings, Target, Zap } from "lucide-react";

interface StopLossOrder {
  id: string;
  symbol: string;
  quantity: number;
  originalPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  trailingStop: boolean;
  trailingStopPercent?: number;
  currentHighWaterMark?: number;
  status: 'active' | 'triggered' | 'cancelled';
  triggerType?: 'stop_loss' | 'take_profit' | 'trailing_stop';
  createdAt: string;
  triggeredAt?: string;
  reason?: string;
}

interface StopLossSettings {
  enableStopLoss: boolean;
  defaultStopLossPercent: number;
  enableTakeProfit: boolean;
  defaultTakeProfitPercent: number;
  enableTrailingStop: boolean;
  defaultTrailingStopPercent: number;
  maxLossPerPosition: number;
  emergencyStopPercent: number;
  autoRebalanceAfterTrigger: boolean;
}

function useStopLossOrders() {
  return useQuery({
    queryKey: ['/api/stop-loss/orders'],
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

function useStopLossStats() {
  return useQuery({
    queryKey: ['/api/stop-loss/stats'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000,
  });
}

function useStopLossSettings() {
  return useQuery({
    queryKey: ['/api/stop-loss/settings'],
    staleTime: 300000, // 5 minutes
  });
}

function useUpdateStopLossSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<StopLossSettings>) => 
      fetch("/api/stop-loss/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stop-loss/settings"] });
    }
  });
}

function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => 
      fetch(`/api/stop-loss/orders/${orderId}/cancel`, { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stop-loss/orders"] });
    }
  });
}

export function StopLossDashboard() {
  const [showSettings, setShowSettings] = useState(false);
  
  const { data: orders } = useStopLossOrders();
  const { data: stats } = useStopLossStats();
  const { data: settings } = useStopLossSettings();
  const updateSettings = useUpdateStopLossSettings();
  const cancelOrder = useCancelOrder();

  const activeOrders = (orders as StopLossOrder[])?.filter(o => o.status === 'active') || [];
  const triggeredOrders = (orders as StopLossOrder[])?.filter(o => o.status === 'triggered') || [];
  const currentStats = stats as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'triggered': return 'bg-blue-600';
      case 'cancelled': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getTriggerIcon = (triggerType?: string) => {
    switch (triggerType) {
      case 'stop_loss': return <Shield className="w-4 h-4 text-red-400" />;
      case 'take_profit': return <Target className="w-4 h-4 text-green-400" />;
      case 'trailing_stop': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default: return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleSettingsUpdate = (newSettings: Partial<StopLossSettings>) => {
    updateSettings.mutate(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Stop-Loss & Take-Profit Manager</h2>
          <p className="text-gray-400">Automated protection for your investments</p>
        </div>
        <Button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Statistics Cards */}
      {currentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Active Orders</p>
                  <p className="text-2xl font-bold text-green-400">{currentStats.totalActiveOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Take Profits</p>
                  <p className="text-2xl font-bold text-blue-400">{currentStats.successfulTakeProfits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">Stop Losses</p>
                  <p className="text-2xl font-bold text-red-400">{currentStats.triggeredStopLosses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Protected Value</p>
                  <p className="text-2xl font-bold text-purple-400">${currentStats.totalProtectedValue?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && settings && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Stop-Loss Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stop-Loss Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={(settings as StopLossSettings).enableStopLoss}
                    onCheckedChange={(checked) => handleSettingsUpdate({ enableStopLoss: checked })}
                  />
                  <Label>Enable Stop-Loss</Label>
                </div>
                <div>
                  <Label>Default Stop-Loss %</Label>
                  <Input
                    type="number"
                    value={(settings as StopLossSettings).defaultStopLossPercent}
                    onChange={(e) => handleSettingsUpdate({ defaultStopLossPercent: parseFloat(e.target.value) })}
                    className="bg-gray-700 border-gray-600"
                    min="1"
                    max="25"
                  />
                </div>
              </div>

              {/* Take-Profit Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={(settings as StopLossSettings).enableTakeProfit}
                    onCheckedChange={(checked) => handleSettingsUpdate({ enableTakeProfit: checked })}
                  />
                  <Label>Enable Take-Profit</Label>
                </div>
                <div>
                  <Label>Default Take-Profit %</Label>
                  <Input
                    type="number"
                    value={(settings as StopLossSettings).defaultTakeProfitPercent}
                    onChange={(e) => handleSettingsUpdate({ defaultTakeProfitPercent: parseFloat(e.target.value) })}
                    className="bg-gray-700 border-gray-600"
                    min="5"
                    max="50"
                  />
                </div>
              </div>

              {/* Trailing Stop Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={(settings as StopLossSettings).enableTrailingStop}
                    onCheckedChange={(checked) => handleSettingsUpdate({ enableTrailingStop: checked })}
                  />
                  <Label>Enable Trailing Stop</Label>
                </div>
                <div>
                  <Label>Trailing Stop %</Label>
                  <Input
                    type="number"
                    value={(settings as StopLossSettings).defaultTrailingStopPercent}
                    onChange={(e) => handleSettingsUpdate({ defaultTrailingStopPercent: parseFloat(e.target.value) })}
                    className="bg-gray-700 border-gray-600"
                    min="3"
                    max="20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Emergency Stop %</Label>
                <Input
                  type="number"
                  value={(settings as StopLossSettings).emergencyStopPercent}
                  onChange={(e) => handleSettingsUpdate({ emergencyStopPercent: parseFloat(e.target.value) })}
                  className="bg-gray-700 border-gray-600"
                  min="10"
                  max="30"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={(settings as StopLossSettings).autoRebalanceAfterTrigger}
                  onCheckedChange={(checked) => handleSettingsUpdate({ autoRebalanceAfterTrigger: checked })}
                />
                <Label>Auto-rebalance after trigger</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Order History ({triggeredOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Active Stop-Loss Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-bold text-white">{order.symbol}</h4>
                        <Badge className={`text-white text-xs ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </Badge>
                        {order.trailingStop && (
                          <Badge className="bg-purple-600 text-white text-xs">
                            TRAILING
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => cancelOrder.mutate(order.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400 block">Quantity</span>
                        <span className="text-white font-semibold">{order.quantity} shares</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Original Price</span>
                        <span className="text-white font-semibold">${order.originalPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Stop-Loss</span>
                        <span className="text-red-400 font-semibold">${order.stopLossPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Take-Profit</span>
                        <span className="text-green-400 font-semibold">
                          {order.takeProfitPrice ? `$${order.takeProfitPrice.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {order.trailingStop && order.currentHighWaterMark && (
                      <div className="mt-3 p-2 bg-purple-900/20 rounded">
                        <div className="text-xs text-purple-300">
                          High Water Mark: ${order.currentHighWaterMark.toFixed(2)} | 
                          Trailing: {order.trailingStopPercent}%
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-400">
                      Created: {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}

                {activeOrders.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No active stop-loss orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Triggered Orders History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggeredOrders.map((order) => (
                  <div key={order.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getTriggerIcon(order.triggerType)}
                        <h4 className="text-lg font-bold text-white">{order.symbol}</h4>
                        <Badge className={`text-white text-xs ${getStatusColor(order.status)}`}>
                          {order.triggerType?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        {order.triggeredAt && new Date(order.triggeredAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-400 block">Quantity</span>
                        <span className="text-white font-semibold">{order.quantity} shares</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Original Price</span>
                        <span className="text-white font-semibold">${order.originalPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Trigger Price</span>
                        <span className="text-yellow-400 font-semibold">
                          ${order.triggerType === 'take_profit' ? order.takeProfitPrice?.toFixed(2) : order.stopLossPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {order.reason && (
                      <div className="p-2 bg-blue-900/20 rounded text-sm text-blue-300">
                        {order.reason}
                      </div>
                    )}
                  </div>
                ))}

                {triggeredOrders.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No triggered orders yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}