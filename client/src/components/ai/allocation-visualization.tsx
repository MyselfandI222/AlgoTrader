import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, AlertTriangle, Zap } from "lucide-react";

interface AllocationData {
  symbol: string;
  targetWeight: number;
  currentWeight: number;
  value: number;
  expectedReturn: number;
  riskScore: number;
  sector: string;
  priority: string;
  strategy: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function useAIAllocation() {
  return useQuery({
    queryKey: ['/api/ai/allocation'],
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

interface SummaryData {
  totalValue: number;
  averageReturn: number;
  averageRisk: number;
}

export function AllocationVisualization() {
  const { data: allocationData, isLoading } = useAIAllocation();

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-400 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading AI allocation analysis...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = (allocationData as AllocationData[])?.map((item: AllocationData, index: number) => ({
    name: item.symbol,
    value: item.targetWeight * 100,
    fill: COLORS[index % COLORS.length],
    sector: item.sector
  })) || [];

  const barData = (allocationData as AllocationData[])?.map((item: AllocationData) => ({
    symbol: item.symbol,
    expectedReturn: item.expectedReturn,
    riskScore: item.riskScore,
    allocation: item.targetWeight * 100
  })) || [];

  const summaryData: SummaryData = {
    totalValue: (allocationData as AllocationData[])?.reduce((sum: number, item: AllocationData) => sum + item.value, 0) || 0,
    averageReturn: (allocationData as AllocationData[])?.reduce((sum: number, item: AllocationData) => sum + (item.expectedReturn * item.targetWeight), 0) || 0,
    averageRisk: (allocationData as AllocationData[])?.reduce((sum: number, item: AllocationData) => sum + (item.riskScore * item.targetWeight), 0) || 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Portfolio Value</p>
                <p className="text-xl font-bold">${summaryData.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Expected Return</p>
                <p className="text-xl font-bold text-green-400">{summaryData.averageReturn.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Risk Score</p>
                <p className="text-xl font-bold text-yellow-400">{summaryData.averageRisk.toFixed(1)}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      <Tabs defaultValue="allocation" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="risk-return">Risk vs Return</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span>AI Portfolio Allocation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Allocation']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-return" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Risk vs Expected Return Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="symbol" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="expectedReturn" fill="#10B981" name="Expected Return %" />
                    <Bar dataKey="riskScore" fill="#EF4444" name="Risk Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Detailed Allocation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(allocationData as AllocationData[])?.map((item: AllocationData) => (
                  <div key={item.symbol} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{item.symbol}</h4>
                        <p className="text-sm text-gray-400">{item.sector}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-400">
                          {(item.targetWeight * 100).toFixed(1)}%
                        </div>
                        <Badge 
                          variant={item.priority === 'high' ? 'default' : item.priority === 'medium' ? 'secondary' : 'outline'}
                          className={`text-xs ${
                            item.priority === 'high' ? 'bg-green-600' : 
                            item.priority === 'medium' ? 'bg-yellow-600' : 
                            'bg-gray-600'
                          }`}
                        >
                          {item.priority} priority
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400 block">Value</span>
                        <span className="text-white font-semibold">${item.value.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Expected Return</span>
                        <span className="text-green-400 font-semibold">{item.expectedReturn.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Risk Score</span>
                        <span className="text-yellow-400 font-semibold">{item.riskScore.toFixed(1)}/10</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Strategy</span>
                        <span className="text-blue-400 font-semibold text-xs">{item.strategy}</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-400 py-8">
                    <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p>No allocation data available</p>
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