"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { clearAuthProfile, redirectToLogin } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { AuditLog, fetchAuditLogs } from '@/lib/services';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [ticketIdInput, setTicketIdInput] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7d'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyingId, setCopyingId] = useState<number | null>(null);

  const actionOptions = useMemo(
    () => ['all', 'LOGIN', 'LOGOUT', 'CREATE_TICKET', 'UPDATE_STATUS', 'DELETE_TICKET', 'CLEAR_DONE', 'UPDATE_PRIORITY_MODE'],
    []
  );

  const visibleLoginCount = useMemo(() => logs.filter((log) => log.action === 'LOGIN').length, [logs]);
  const visibleMutationCount = useMemo(
    () => logs.filter((log) => ['CREATE_TICKET', 'UPDATE_STATUS', 'DELETE_TICKET', 'CLEAR_DONE', 'UPDATE_PRIORITY_MODE'].includes(log.action)).length,
    [logs]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const from =
        datePreset === 'today'
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
          : datePreset === '7d'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : null;

      const data = await fetchAuditLogs({
        page,
        limit,
        action: actionFilter,
        role: roleFilter,
        q: query,
        ticketId: ticketIdInput.trim() ? Number(ticketIdInput.trim()) : undefined,
        from: from ? from.toISOString() : undefined,
      });
      setLogs(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('网络异常，无法获取审计日志');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, datePreset, limit, page, query, roleFilter, ticketIdInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCopy = async (log: AuditLog) => {
    const text = `${new Date(log.createdAt).toLocaleString('zh-CN')} | ${log.action} | ${log.actor} | ${log.role} | ${log.ticketId ?? '-'} | ${log.details ?? '-'}`;
    await navigator.clipboard.writeText(text);
    setCopyingId(log.id);
    window.setTimeout(() => setCopyingId(null), 1200);
  };

  useEffect(() => {
    setPage(1);
  }, [actionFilter, roleFilter, query, ticketIdInput, datePreset]);

  const exportCurrentPageCsv = () => {
    const headers = ['id', 'time', 'action', 'actor', 'role', 'ticketId', 'details'];
    const rows = logs.map((log) => [
      String(log.id),
      new Date(log.createdAt).toISOString(),
      log.action,
      log.actor,
      log.role,
      log.ticketId ? String(log.ticketId) : '',
      (log.details ?? '').replaceAll('"', '""'),
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGuard roles={['college-admin', 'super-admin']}>
      <div className="p-8 w-full max-w-6xl mx-auto text-zinc-100">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">操作审计</h1>
          <p className="text-sm text-zinc-500 mt-2">记录登录、状态变更、删除等关键操作</p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-xs text-zinc-500">当前筛选命中</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{total}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-xs text-zinc-500">登录类操作</p>
            <p className="mt-1 text-2xl font-bold text-indigo-300">{visibleLoginCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-xs text-zinc-500">工单变更类操作</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{visibleMutationCount}</p>
          </div>
        </section>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200">审计日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="搜索操作/执行人/详情"
                className="bg-zinc-950 border-zinc-700 text-zinc-100"
              />
              <Input
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
                placeholder="工单ID (可选)"
                className="bg-zinc-950 border-zinc-700 text-zinc-100"
              />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-10 rounded-md bg-zinc-950 border border-zinc-700 px-3 text-sm text-zinc-200"
              >
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action === 'all' ? '全部操作' : action}
                  </option>
                ))}
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 rounded-md bg-zinc-950 border border-zinc-700 px-3 text-sm text-zinc-200"
              >
                <option value="all">全部角色</option>
                <option value="student">学生</option>
                <option value="maintainer">维修人员</option>
                <option value="department-admin">系部管理</option>
                <option value="college-admin">院部管理</option>
                <option value="super-admin">总管理</option>
              </select>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as 'all' | 'today' | '7d')}
                className="h-10 rounded-md bg-zinc-950 border border-zinc-700 px-3 text-sm text-zinc-200"
              >
                <option value="all">全部时间</option>
                <option value="today">仅今天</option>
                <option value="7d">近 7 天</option>
              </select>
            </div>

            <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
              <span>共 {total} 条 | 第 {page}/{totalPages} 页</span>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900 text-zinc-300"
                disabled={logs.length === 0 || loading}
                onClick={exportCurrentPageCsv}
              >
                导出本页 CSV
              </Button>
            </div>

            {loading ? (
              <p className="text-zinc-500 text-sm">加载中...</p>
            ) : error ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <span>{error}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-100 hover:bg-red-500/20" onClick={() => void load()}>
                    重试
                  </Button>
                </div>
            ) : logs.length === 0 ? (
              <p className="text-zinc-500 text-sm">暂无审计日志</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-400 border-b border-zinc-800">
                      <th className="py-2 pr-3">时间</th>
                      <th className="py-2 pr-3">操作</th>
                      <th className="py-2 pr-3">执行人</th>
                      <th className="py-2 pr-3">角色</th>
                      <th className="py-2 pr-3">工单ID</th>
                      <th className="py-2">详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-zinc-900/80 text-zinc-300">
                        <td className="py-2 pr-3 whitespace-nowrap text-zinc-500">
                          {new Date(log.createdAt).toLocaleString('zh-CN')}
                        </td>
                        <td className="py-2 pr-3 font-medium">
                          <span className={`rounded px-2 py-0.5 text-xs ${log.action === 'LOGIN' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-200'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{log.actor}</td>
                        <td className="py-2 pr-3 uppercase text-xs text-zinc-400">{log.role}</td>
                        <td className="py-2 pr-3">{log.ticketId ?? '-'}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="max-w-md truncate">{log.details ?? '-'}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                              onClick={() => void handleCopy(log)}
                            >
                              {copyingId === log.id ? '已复制' : '复制'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900 text-zinc-300"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900 text-zinc-300"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                下一页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

