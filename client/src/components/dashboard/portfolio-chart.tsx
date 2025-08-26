import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";

const chartData = [
  { time: '9:30', value: 125000 },
  { time: '10:00', value: 125234 },
  { time: '10:30', value: 126543 },
  { time: '11:00', value: 126234 },
  { time: '11:30', value: 127543 },
  { time: '12:00', value: 127234 },
  { time: '12:30', value: 127876 },
  { time: '1:00', value: 127543 },
  { time: '1:30', value: 128234 },
  { time: '2:00', value: 127890 },
  { time: '2:30', value: 128456 },
  { time: '3:00', value: 127999 },
  { time: '3:30', value: 127543 },
];

export function PortfolioChart() {
  return (
    <div className="trading-card rounded-xl p-6 border" data-testid="portfolio-chart">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">AI Investment Performance</h3>
        <div className="flex space-x-2">
          <Button size="sm" className="bg-blue-600 text-white" data-testid="chart-1d">1D</Button>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" data-testid="chart-1w">1W</Button>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" data-testid="chart-1m">1M</Button>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" data-testid="chart-3m">3M</Button>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" data-testid="chart-1y">1Y</Button>
        </div>
      </div>
      <div className="h-80">
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
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#10B981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
