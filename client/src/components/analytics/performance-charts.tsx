import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const performanceData = [
  { date: "Jan", portfolio: 100000, benchmark: 100000, strategies: 15000 },
  { date: "Feb", portfolio: 102340, benchmark: 101200, strategies: 16200 },
  { date: "Mar", portfolio: 105670, benchmark: 102800, strategies: 17500 },
  { date: "Apr", portfolio: 108920, benchmark: 104100, strategies: 18900 },
  { date: "May", portfolio: 112450, benchmark: 105600, strategies: 20400 },
  { date: "Jun", portfolio: 115230, benchmark: 106800, strategies: 21200 },
  { date: "Jul", portfolio: 118900, benchmark: 108200, strategies: 22800 },
  { date: "Aug", portfolio: 122340, benchmark: 109500, strategies: 24100 },
  { date: "Sep", portfolio: 125670, benchmark: 110800, strategies: 25600 },
  { date: "Oct", portfolio: 128450, benchmark: 112000, strategies: 26900 },
  { date: "Nov", portfolio: 131200, benchmark: 113400, strategies: 28200 },
  { date: "Dec", portfolio: 134560, benchmark: 114700, strategies: 29800 }
];

const monthlyReturns = [
  { month: "Jan", return: 2.3 },
  { month: "Feb", return: 3.1 },
  { month: "Mar", return: 4.2 },
  { month: "Apr", return: 2.8 },
  { month: "May", return: 3.6 },
  { month: "Jun", return: 2.4 },
  { month: "Jul", return: 4.1 },
  { month: "Aug", return: 3.8 },
  { month: "Sep", return: 2.9 },
  { month: "Oct", return: 3.4 },
  { month: "Nov", return: 2.7 },
  { month: "Dec", return: 3.9 }
];

const sectorAllocation = [
  { name: "Technology", value: 35, color: "#3B82F6" },
  { name: "Healthcare", value: 20, color: "#10B981" },
  { name: "Financials", value: 15, color: "#F59E0B" },
  { name: "Energy", value: 12, color: "#EF4444" },
  { name: "Consumer", value: 10, color: "#8B5CF6" },
  { name: "Other", value: 8, color: "#6B7280" }
];

const riskMetrics = [
  { metric: "Portfolio Beta", value: 0.92, target: 1.0 },
  { metric: "Value at Risk (95%)", value: 2.4, target: 3.0 },
  { metric: "Volatility", value: 12.3, target: 15.0 },
  { metric: "Correlation to S&P500", value: 0.78, target: 0.80 }
];

export function PerformanceCharts() {
  const [activeChart, setActiveChart] = useState<"performance" | "returns" | "allocation" | "risk">("performance");

  const chartTabs = [
    { id: "performance" as const, label: "Portfolio Performance" },
    { id: "returns" as const, label: "Monthly Returns" },
    { id: "allocation" as const, label: "Sector Allocation" },
    { id: "risk" as const, label: "Risk Metrics" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Performance Analysis</h2>
        <div className="flex space-x-1 trading-accent rounded-lg p-1">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                activeChart === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              data-testid={`chart-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="trading-card border">
        <CardHeader>
          <CardTitle>
            {chartTabs.find(tab => tab.id === activeChart)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeChart === "performance" && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94A3B8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="portfolio" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="AI Portfolio"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="#6B7280" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="S&P 500"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="strategies" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="AI Strategies Only"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === "returns" && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94A3B8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Bar 
                    dataKey="return" 
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === "allocation" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorAllocation}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {sectorAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Sector Breakdown</h4>
                {sectorAllocation.map((sector) => (
                  <div key={sector.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: sector.color }}
                      ></div>
                      <span className="text-sm">{sector.name}</span>
                    </div>
                    <span className="font-semibold">{sector.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChart === "risk" && (
            <div className="space-y-6">
              {riskMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{metric.value}</span>
                      <span className="text-xs text-gray-400">Target: {metric.target}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.value <= metric.target ? 'bg-green-400' : 'bg-orange-400'
                      }`}
                      style={{ 
                        width: `${Math.min((metric.value / metric.target) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}