"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AUTH_EVENT, Role, refreshAuthFromServer, withAuthFetch } from '@/lib/auth';
import { apiUrl } from '@/lib/api';

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: 'urgent' | 'normal';
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
  updatedAt: string;
}

export default function SmartRepairHub() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Ticket['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Ticket['priority']>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Ticket['priority']>('normal');
  const [autoPriorityEnabled, setAutoPriorityEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // 拖拽状态感知
  const [isSubmitting, setIsSubmitting] = useState(false); // 防止重复提交
  const [role, setRole] = useState<Role | null>(null);

  const canManageStatus = role === 'admin' || role === 'worker';
  const canDelete = role === 'admin';

  const checkAuth = async () => {
    const snapshot = await refreshAuthFromServer();
    setRole(snapshot.role);
  };

  const fetchPriorityMode = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/settings/priority-mode'), { credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      setAutoPriorityEnabled(Boolean(data.autoPriorityEnabled));
    } catch (error) {
      console.error('Error fetching priority mode:', error);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);

      const queryString = params.toString();
      const url = `${apiUrl('/api/tickets')}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  }, [debouncedQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const onAuthChanged = () => {
      void checkAuth();
      void fetchPriorityMode();
    };
    void checkAuth();
    void fetchPriorityMode();
    window.addEventListener(AUTH_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChanged);
  }, [fetchPriorityMode]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/tickets'), {
        method: 'POST',
        ...withAuthFetch,
        body: JSON.stringify({ title, description, priority }),
      });
      if (response.ok) {
        setTitle('');
        setDescription('');
        await fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理删除
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条报修记录吗？')) return;

    try {
      const response = await fetch(apiUrl(`/api/tickets/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setTickets(prev => prev.filter(t => t.id !== id));
      } else {
        alert('删除失败：未获得服务器授权');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert("删除失败：未获得服务器授权");
    }
  };

  // 处理清空已完成
  const handleClearDone = async () => {
    if (!confirm('确定要清空所有已完成的报修记录吗？')) return;

    try {
      const response = await fetch(apiUrl('/api/tickets/clear-done'), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setTickets(prev => prev.filter(t => t.status !== 'done'));
      } else {
        alert('操作失败：权限不足');
      }
    } catch (error) {
      console.error('Error clearing done tickets:', error);
      alert("操作失败：权限不足");
    }
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('ticketId', id.toString());
    setIsDragging(true);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 允许放置
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // 必须调用，否则不会触发 onDrop
  };

  // 处理放置
  const handleDrop = async (e: React.DragEvent, newStatus: Ticket['status']) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canManageStatus) return; // 鉴权：管理员/工程师能拖拽

    const ticketId = parseInt(e.dataTransfer.getData('ticketId'), 10);

    if (!ticketId) return;

    // 乐观更新 UI
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    // 发送 PATCH 请求更新后端状态
    try {
      const response = await fetch(apiUrl(`/api/tickets/${ticketId}`), {
        method: 'PATCH',
        ...withAuthFetch,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        alert('无权限或状态更新失败');
        await fetchTickets();
        return;
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      // 如果失败回滚：这里演示重新 fetch 同步真数据
      await fetchTickets();
      alert("无权限或网络出错，操作已被驳回");
    }
  };

  const renderTickets = (status: Ticket['status']) => {
    const columnTickets = tickets.filter((ticket) => ticket.status === status);

    if (columnTickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-500 border-2 border-dashed border-zinc-800/50 rounded-lg mx-1 mt-2 bg-zinc-900/30">
          <svg className="w-12 h-12 mb-3 opacity-60 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10h16M9 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M6 10h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" />
          </svg>
          <p className="text-xs font-medium">
            {debouncedQuery || statusFilter !== 'all' || priorityFilter !== 'all' ? '未找到相关工单' : '暂无数据'}
          </p>
        </div>
      );
    }

    return columnTickets.map((ticket) => (
      <Card 
        key={ticket.id} 
        draggable={canManageStatus}
        onDragStart={(e) => canManageStatus && handleDragStart(e, ticket.id)}
        onDragEnd={() => canManageStatus && handleDragEnd()}
        className={`bg-zinc-800 border-zinc-700 mb-4 transition-colors shadow-sm group relative ${canManageStatus ? 'cursor-grab active:cursor-grabbing hover:border-zinc-500' : 'cursor-default'}`}
      >
        {canDelete && (
          <button
            onClick={(e) => handleDelete(e, ticket.id)}
            className="absolute top-2 right-2 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-all z-10"
            title="删除工单"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium text-zinc-100 flex-1 pr-6">
              {ticket.title}
            </CardTitle>
            <Badge
              variant={ticket.priority === 'urgent' ? 'destructive' : 'default'}
              className={
                ticket.priority === 'urgent'
                  ? 'bg-red-600 hover:bg-red-700 text-white border-transparent'
                  : 'bg-zinc-600 hover:bg-zinc-700 text-white border-transparent'
              }
            >
              {ticket.priority === 'urgent' ? '紧急' : '普通'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-400 mb-2">{ticket.description}</p>
          <p className="text-[10px] text-zinc-600">
            {new Date(ticket.createdAt).toLocaleString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Smart Repair Hub
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="搜索报修工单..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 w-64 rounded-full h-9 text-xs focus-visible:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | Ticket['status'])}
            className="h-9 rounded-md bg-zinc-900 border border-zinc-700 px-2 text-xs text-zinc-200"
          >
            <option value="all">全部状态</option>
            <option value="todo">待处理</option>
            <option value="in-progress">维修中</option>
            <option value="done">已完成</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | Ticket['priority'])}
            className="h-9 rounded-md bg-zinc-900 border border-zinc-700 px-2 text-xs text-zinc-200"
          >
            <option value="all">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="normal">普通</option>
          </select>
          <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800" onClick={fetchTickets}>
            刷新
          </Button>
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 border border-zinc-700 shadow-inner hover:bg-zinc-700 transition-colors cursor-pointer">
            <span className="text-sm font-bold">{(role?.[0] ?? 'U').toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Main Content gap and structure */}
      <main className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Left Action Area */}
        <section className="w-full lg:w-1/4 flex flex-col gap-4">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-zinc-100">一键报修</h2>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">问题简述</label>
                <Input
                  placeholder="例如：实训室电脑蓝屏"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-zinc-100"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">详细描述</label>
                <Textarea
                  placeholder="请填写故障现象、地点和影响范围"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 resize-none h-24"
                />
              </div>
              {!autoPriorityEnabled ? (
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">优先级</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Ticket['priority'])}
                    className="h-10 w-full rounded-md bg-zinc-950 border border-zinc-700 px-3 text-sm text-zinc-200"
                  >
                    <option value="normal">普通</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">当前由系统自动判定优先级（可在系统设置中切换为手动）。</p>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '正在提交...' : '立即提交报修'}
            </Button>
          </div>
        </section>

        {/* Right Kanban Area */}
        <section className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px] pb-10">
          {/* To Do Column */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'todo')}
            className={`bg-zinc-900/80 rounded-xl p-4 border shadow-inner flex flex-col h-full max-h-[80vh] transition-colors ${isDragging ? 'border-zinc-700/80' : 'border-zinc-800/80'}`}
          >
            <div className="flex items-center justify-between mb-4 px-1 sticky top-0 bg-transparent z-10">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"></span>
                待处理
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {tickets.filter(t => t.status === 'todo').length}
              </span>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar">{renderTickets('todo')}</div>
          </div>

          {/* In Progress Column */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'in-progress')}
            className={`bg-zinc-900/80 rounded-xl p-4 border shadow-inner flex flex-col h-full max-h-[80vh] transition-colors ${isDragging ? 'border-blue-900/50' : 'border-zinc-800/80'}`}
          >
            <div className="flex items-center justify-between mb-4 px-1 sticky top-0 bg-transparent z-10">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                维修中
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {tickets.filter(t => t.status === 'in-progress').length}
              </span>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar">{renderTickets('in-progress')}</div>
          </div>

          {/* Done Column */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'done')}
            className={`bg-zinc-900/80 rounded-xl p-4 border shadow-inner flex flex-col h-full max-h-[80vh] transition-colors ${isDragging ? 'border-green-900/50' : 'border-zinc-800/80'}`}
          >
            <div className="flex items-center justify-between mb-4 px-1 sticky top-0 bg-transparent z-10">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                已完成
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {tickets.filter(t => t.status === 'done').length}
                </span>
                {canDelete && tickets.some(t => t.status === 'done') && (
                  <button
                    onClick={handleClearDone} 
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors p-1.5 hover:bg-zinc-800 rounded opacity-70 hover:opacity-100" 
                    title="清空所有已完成工单"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto pr-1 pb-2 custom-scrollbar">{renderTickets('done')}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
