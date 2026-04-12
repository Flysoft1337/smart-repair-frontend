"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SparklesIcon } from '@/components/icons';
import RoleGuard from '@/components/RoleGuard';
import { apiUrl } from '@/lib/api';

interface AnalyticsData {
  total: number;
  done: number;
  urgent: number;
  inProgress: number;
  completionRate: number;
  distribution: { name: string; value: number; fill: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData>({
    total: 0,
    done: 0,
    urgent: 0,
    inProgress: 0,
    completionRate: 0,
    distribution: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(apiUrl('/api/analytics'), { credentials: 'include' });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <RoleGuard roles={['admin', 'worker']}>
      <div className="p-8 font-sans w-full max-w-6xl mx-auto h-full text-zinc-100 flex flex-col gap-6">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold mb-2">数据大盘</h1>
          <p className="text-zinc-500 text-sm">校园智能报修中枢实时运转监测</p>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">正在实时加载数据...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-400">总工单量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-zinc-100">{data.total}</div>
                <p className="text-xs text-zinc-500 mt-2">累计发起的所有报修</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-400">紧急故障</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-500">{data.urgent}</div>
                <p className="text-xs text-zinc-500 mt-2">系统标记为紧急的故障项</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-400">维修中 (正在处理)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-500">{data.inProgress}</div>
                <p className="text-xs text-zinc-500 mt-2">工程师正在跟进中</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent z-0"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-zinc-400">总体完成率</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-emerald-400">{data.completionRate}%</div>
                <p className="text-xs text-zinc-500 mt-2">已完成的报修占比 ({data.done} 单)</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Visualizations Section */}
        {!loading && data.distribution.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="bg-zinc-900 border-zinc-800 shadow-md col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-zinc-300">工单状态分布</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 shadow-md col-span-1 flex flex-col justify-center items-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-2">系统运行良好</h3>
              <p className="text-sm text-zinc-400 max-w-sm">
                当前有 {data.urgent} 个紧急工单需要优处理。
                您的校园维修效率击败了全国 {Math.max(10, Math.min(99, data.completionRate + 15))}% 的学校！
              </p>
            </Card>
          </div>
        )}

        {!loading && data.total === 0 && (
          <div className="flex-1 min-h-[300px] mt-6 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center p-6 flex-col">
            <svg className="w-16 h-16 mb-4 opacity-30 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-zinc-300 font-medium">暂时没有产生任何工单数据</h3>
            <p className="text-zinc-600 text-sm mt-2 text-center max-w-md">
              前往看板发起您的第一个校园报修！
            </p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
