import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DataPoint } from '@shared/schema';

interface DataChartProps {
  data: DataPoint[];
  maxDataPoints?: number;
}

export default function DataChart({ data, maxDataPoints = 100 }: DataChartProps) {
  const displayData = data.slice(-maxDataPoints);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-popover-border rounded-md p-3 shadow-md">
          <p className="font-mono text-sm text-muted-foreground mb-1">{payload[0].payload.timestamp}</p>
          <p className="font-mono text-sm" style={{ color: 'hsl(var(--chart-1))' }}>
            Thrust: {payload[0].value.toFixed(2)} g
          </p>
          <p className="font-mono text-sm" style={{ color: 'hsl(var(--chart-2))' }}>
            Pressure: {payload[1].value.toFixed(2)} bar
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Real-Time Data Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="timestamp" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--chart-1))"
              tick={{ fill: 'hsl(var(--chart-1))', fontSize: 12 }}
              label={{ value: 'Thrust (g)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--chart-1))' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--chart-2))"
              tick={{ fill: 'hsl(var(--chart-2))', fontSize: 12 }}
              label={{ value: 'Pressure (bar)', angle: 90, position: 'insideRight', fill: 'hsl(var(--chart-2))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="thrust" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={false}
              name="Thrust (g)"
              isAnimationActive={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="pressure" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={false}
              name="Pressure (bar)"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
