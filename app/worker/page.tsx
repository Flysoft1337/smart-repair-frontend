"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { withAuthFetch } from '@/lib/auth';
import { apiUrl } from '@/lib/api';

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'urgent' | 'normal';
  createdAt: string;
};

export default function WorkerPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyTicketId, setBusyTicketId] = useState<number | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      const url = `${apiUrl('/api/tickets')}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const updateStatus = async (id: number, status: Ticket['status']) => {
    setBusyTicketId(id);
    try {
      const response = await fetch(apiUrl(`/api/tickets/${id}`), {
        method: 'PATCH',
        ...withAuthFetch,
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await fetchTickets();
      }
    } finally {
      setBusyTicketId(null);
    }
  };

  const todoTickets = useMemo(() => tickets.filter((t) => t.status === 'todo'), [tickets]);
  const progressTickets = useMemo(() => tickets.filter((t) => t.status === 'in-progress'), [tickets]);

  return (
    <RoleGuard roles={['admin', 'worker']}>
      <div className="p-8 w-full max-w-6xl mx-auto text-zinc-100 flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-extrabold">维修工作台</h1>
          <p className="text-sm text-zinc-500 mt-2">仅展示待处理与维修中的工单，便于工程师快速流转</p>
        </header>

        <div className="flex gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="按标题/描述搜索工单"
            className="bg-zinc-900 border-zinc-700 text-zinc-100"
          />
          <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" onClick={fetchTickets}>
            刷新
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">加载中...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-200">待处理 ({todoTickets.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todoTickets.length === 0 ? (
                  <p className="text-sm text-zinc-500">暂无待处理工单</p>
                ) : (
                  todoTickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                      <p className="font-medium">#{ticket.id} {ticket.title}</p>
                      <p className="text-sm text-zinc-400 mt-1">{ticket.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-zinc-500">{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                        <Button
                          size="sm"
                          disabled={busyTicketId === ticket.id}
                          onClick={() => updateStatus(ticket.id, 'in-progress')}
                          className="bg-blue-600 hover:bg-blue-500"
                        >
                          开始处理
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-200">维修中 ({progressTickets.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progressTickets.length === 0 ? (
                  <p className="text-sm text-zinc-500">暂无维修中的工单</p>
                ) : (
                  progressTickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                      <p className="font-medium">#{ticket.id} {ticket.title}</p>
                      <p className="text-sm text-zinc-400 mt-1">{ticket.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-zinc-500">优先级: {ticket.priority === 'urgent' ? '紧急' : '普通'}</span>
                        <Button
                          size="sm"
                          disabled={busyTicketId === ticket.id}
                          onClick={() => updateStatus(ticket.id, 'done')}
                          className="bg-emerald-600 hover:bg-emerald-500"
                        >
                          标记完成
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

