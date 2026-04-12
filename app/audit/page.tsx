"use client";

import { useEffect, useMemo, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/api';

type AuditLog = {
  id: number;
  action: string;
  ticketId: number | null;
  actor: string;
  role: string;
  details: string | null;
  createdAt: string;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const actionOptions = useMemo(
    () => ['all', 'LOGIN', 'LOGOUT', 'CREATE_TICKET', 'UPDATE_STATUS', 'DELETE_TICKET', 'CLEAR_DONE', 'UPDATE_PRIORITY_MODE'],
    []
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (actionFilter !== 'all') params.set('action', actionFilter);
        if (roleFilter !== 'all') params.set('role', roleFilter);
        if (query) params.set('q', query);

        const res = await fetch(`${apiUrl('/api/audit-logs')}?${params.toString()}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.items ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        } else {
          setError('加载失败，请稍后重试');
        }
      } catch {
        setError('网络异常，无法获取审计日志');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [actionFilter, limit, page, query, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, roleFilter, query]);

  return (
    <RoleGuard roles={['admin']}>
      <div className="p-8 w-full max-w-6xl mx-auto text-zinc-100">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">操作审计</h1>
          <p className="text-sm text-zinc-500 mt-2">记录登录、状态变更、删除等关键操作</p>
        </header>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-200">审计日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="搜索操作/执行人/详情"
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
                <option value="admin">ADMIN</option>
                <option value="worker">WORKER</option>
                <option value="reporter">REPORTER</option>
              </select>
              <div className="text-sm text-zinc-500 flex items-center justify-start md:justify-end">
                共 {total} 条 | 第 {page}/{totalPages} 页
              </div>
            </div>

            {loading ? (
              <p className="text-zinc-500 text-sm">加载中...</p>
            ) : error ? (
              <p className="text-red-400 text-sm">{error}</p>
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
                        <td className="py-2 pr-3 font-medium">{log.action}</td>
                        <td className="py-2 pr-3">{log.actor}</td>
                        <td className="py-2 pr-3 uppercase text-xs text-zinc-400">{log.role}</td>
                        <td className="py-2 pr-3">{log.ticketId ?? '-'}</td>
                        <td className="py-2">{log.details ?? '-'}</td>
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

