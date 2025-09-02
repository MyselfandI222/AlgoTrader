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
  const totalGainLoss = (summary as any)?.totalGainLoss || 0;
  const totalGainLossPercent = (summary as any)?.totalGainLossPercent || 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50" data-testid="portfolio-chart">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-3">Portfolio Performance</h3>
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-sm text-gray-400">Total Value</span>
              <div className="text-2xl font-bold text-white">${((summary as any)?.totalValue || 100000).toLocaleString()}</div>
            </div>
            <div className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-sm text-gray-400">P&L</span>
              <div className="text-2xl font-bold">
                {isPositive ? '+' : ''}${totalGainLoss.toFixed(2)}
              </div>
              <div className="text-sm font-medium">
                ({totalGainLossPercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-1 bg-gray-700/50 rounded-xl p-1">
          {(['1D', '1W', '1M', '3M', '1Y'] as TimePeriod[]).map((period) => (
            <Button 
              key={period}
              size="sm" 
              className={`${selectedPeriod === period 
                ? "bg-blue-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white hover:bg-gray-600"
              } transition-all`} 
              variant="ghost"
              onClick={() => setSelectedPeriod(period)}
              data-testid={`chart-${period.toLowerCase()}`}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="h-96 mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-3 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading performance data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData as any}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  color: '#F9FAFB',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? "#10B981" : "#EF4444"}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: isPositive ? "#10B981" : "#EF4444", strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
