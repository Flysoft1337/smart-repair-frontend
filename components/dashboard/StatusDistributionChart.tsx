import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AnalyticsData } from '@/components/dashboard/types';

interface StatusDistributionChartProps {
  data: AnalyticsData['distribution'];
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <Card className="col-span-1 border-zinc-800 bg-zinc-900 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-zinc-300">工单状态分布</CardTitle>
      </CardHeader>
      <CardContent className="flex h-75 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              stroke="none"
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

