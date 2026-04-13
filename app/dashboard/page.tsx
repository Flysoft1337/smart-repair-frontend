"use client";

import { useEffect, useMemo, useState } from 'react';
import { RoleGuard } from '@/components/guards';
import { clearAuthProfile, redirectToLogin } from '@/lib/auth';
import { ApiError, apiJson } from '@/lib/api';
import {
  DashboardEmptyState,
  DashboardHeader,
  KpiCards,
  RecentUrgentList,
  StatusDistributionChart,
} from '@/components/dashboard';
import type { AnalyticsData, TicketLite, Trend } from '@/components/dashboard';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData>({
    total: 0,
    done: 0,
    urgent: 0,
    inProgress: 0,
    completionRate: 0,
    distribution: [],
  });
  const [previousCompletionRate, setPreviousCompletionRate] = useState<number | null>(null);
  const [recentUrgent, setRecentUrgent] = useState<TicketLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analytics, tickets] = await Promise.all([
          apiJson<AnalyticsData>('/api/analytics'),
          apiJson<TicketLite[]>('/api/tickets?priority=urgent'),
        ]);

        setData((prev) => {
          setPreviousCompletionRate(prev.completionRate);
          return analytics;
        });

        const urgent = tickets
          .filter((ticket) => ticket.priority === 'urgent')
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 5);

        setRecentUrgent(urgent);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthProfile();
          redirectToLogin();
          return;
        }
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, []);

  const trend = useMemo<Trend>(() => {
    if (previousCompletionRate === null) return 'stable';
    if (data.completionRate > previousCompletionRate) return 'up';
    if (data.completionRate < previousCompletionRate) return 'down';
    return 'stable';
  }, [data.completionRate, previousCompletionRate]);

  const openUrgentBoard = () => {
    window.location.assign('/?priority=urgent');
  };

  return (
    <RoleGuard roles={['department-admin', 'college-admin', 'super-admin', 'maintainer']}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 p-8 font-sans text-zinc-100">
        <DashboardHeader onOpenUrgent={openUrgentBoard} />

        {loading ? (
          <div className="flex h-64 items-center justify-center text-zinc-500">正在实时加载数据...</div>
        ) : (
          <KpiCards data={data} trend={trend} />
        )}

        {!loading && data.distribution.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StatusDistributionChart data={data.distribution} />
            <RecentUrgentList tickets={recentUrgent} onOpenUrgent={openUrgentBoard} />
          </div>
        )}

        {!loading && data.total === 0 && <DashboardEmptyState />}
      </div>
    </RoleGuard>
  );
}
