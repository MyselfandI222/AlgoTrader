import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y';

function usePortfolioPerformance(period: TimePeriod) {
  return useQuery({
    queryKey: ['/api/ai/portfolio-performance', period],
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

function usePortfolioSummary() {
  return useQuery({
    queryKey: ['/api/ai/portfolio-summary'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function PortfolioChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');
  const { data: chartData, isLoading } = usePortfolioPerformance(selectedPeriod);
  const { data: summary } = usePortfolioSummary();
  const totalGainLoss = summary?.totalGainLoss || 0;
  const totalGainLossPercent = summary?.totalGainLossPercent || 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <div className="trading-card rounded-xl p-6 border" data-testid="portfolio-chart">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">AI Investment Performance</h3>
          <div className="flex items-center space-x-4 mt-2">
            <div>
              <span className="text-sm text-gray-400">Total Value: </span>
              <span className="text-lg font-semibold">${(summary?.totalValue || 100000).toLocaleString()}</span>
            </div>
            <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-sm">P&L: </span>
              <span className="font-semibold">
                {isPositive ? '+' : ''}${totalGainLoss.toFixed(2)} ({totalGainLossPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {(['1D', '1W', '1M', '3M', '1Y'] as TimePeriod[]).map((period) => (
            <Button 
              key={period}
              size="sm" 
              className={selectedPeriod === period ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"} 
              variant={selectedPeriod === period ? "default" : "ghost"}
              onClick={() => setSelectedPeriod(period)}
              data-testid={`chart-${period.toLowerCase()}`}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-80">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-400 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading AI performance data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="time" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? "#10B981" : "#EF4444"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: isPositive ? "#10B981" : "#EF4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-300">
          🤖 AI automatically analyzes market data and makes investment decisions every minute
        </p>
      </div>
    </div>
  );
}
