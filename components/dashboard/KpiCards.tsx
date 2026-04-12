import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsData, Trend } from '@/components/dashboard/types';

interface KpiCardsProps {
  data: AnalyticsData;
  trend: Trend;
}

export function KpiCards({ data, trend }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-zinc-800 bg-zinc-900 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-400">总工单量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-zinc-100">{data.total}</div>
          <p className="mt-2 text-xs text-zinc-500">累计发起的所有报修</p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-400">紧急故障</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-red-500">{data.urgent}</div>
          <p className="mt-2 text-xs text-zinc-500">系统标记为紧急的故障项</p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-400">维修中 (正在处理)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-500">{data.inProgress}</div>
          <p className="mt-2 text-xs text-zinc-500">工程师正在跟进中</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900 shadow-md">
        <div className="absolute inset-0 z-0 bg-linear-to-br from-green-500/10 to-transparent"></div>
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-400">总体完成率</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-4xl font-bold text-emerald-400">{data.completionRate}%</div>
          <p className="mt-2 text-xs text-zinc-500">已完成的报修占比 ({data.done} 单)</p>
          <p className={`mt-1 text-xs ${trend === 'up' ? 'text-emerald-300' : trend === 'down' ? 'text-amber-300' : 'text-zinc-500'}`}>
            {trend === 'up' && '较上次加载提升'}
            {trend === 'down' && '较上次加载下降'}
            {trend === 'stable' && '较上次加载持平'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

