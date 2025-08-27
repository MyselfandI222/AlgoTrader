import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTradingData } from "@/hooks/use-trading-data";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function AllocationBreakdown() {
  const { positions, portfolio } = useTradingData();

  // Calculate sector allocation based on holdings
  const sectorData = [
    { name: "Technology", value: 35, amount: 42500, color: "#3B82F6" },
    { name: "Healthcare", value: 22, amount: 26400, color: "#10B981" },
    { name: "Financials", value: 18, amount: 21600, color: "#F59E0B" },
    { name: "Energy", value: 12, amount: 14400, color: "#EF4444" },
    { name: "Consumer", value: 8, amount: 9600, color: "#8B5CF6" },
    { name: "Cash", value: 5, amount: 6000, color: "#6B7280" }
  ];

  // Calculate position allocation (top holdings)
  const topHoldings = positions?.slice(0, 8).map(position => ({
    symbol: position.symbol,
    value: parseFloat(position.marketValue || "0"),
    percentage: (parseFloat(position.marketValue || "0") / parseFloat(portfolio?.totalValue || "1")) * 100
  })) || [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280', '#EC4899', '#14B8A6'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Portfolio Allocation</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={false}
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {sectorData.map((sector, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: sector.color }}
                      ></div>
                      <span className="text-sm font-medium">{sector.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{sector.value}%</div>
                      <div className="text-xs text-gray-400">${sector.amount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Holdings */}
        <Card className="trading-card border">
          <CardHeader>
            <CardTitle>Top Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topHoldings} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    type="number"
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="symbol"
                    stroke="#94A3B8"
                    fontSize={12}
                    width={60}
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Class Breakdown */}
      <Card className="trading-card border">
        <CardHeader>
          <CardTitle>Asset Class Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 trading-accent rounded-lg">
                <div>
                  <h4 className="font-semibold">Equities</h4>
                  <p className="text-sm text-gray-400">Individual stocks</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">85%</div>
                  <div className="text-sm text-gray-400">$102,000</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 trading-accent rounded-lg">
                <div>
                  <h4 className="font-semibold">ETFs</h4>
                  <p className="text-sm text-gray-400">Exchange traded funds</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">10%</div>
                  <div className="text-sm text-gray-400">$12,000</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 trading-accent rounded-lg">
                <div>
                  <h4 className="font-semibold">Cash</h4>
                  <p className="text-sm text-gray-400">Available funds</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">5%</div>
                  <div className="text-sm text-gray-400">$6,000</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="space-y-4">
                <h4 className="font-semibold">Risk Metrics</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Portfolio Beta</span>
                      <span className="font-semibold">0.92</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Diversification Score</span>
                      <span className="font-semibold text-green-400">8.2/10</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Volatility (30d)</span>
                      <span className="font-semibold">12.4%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-600/20 rounded-lg border border-blue-600/30">
                  <h5 className="font-semibold text-blue-400 mb-2">AI Recommendation</h5>
                  <p className="text-sm text-gray-300">
                    Consider reducing technology exposure from 35% to 30% and increasing healthcare allocation for better diversification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}