"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false); // 拖拽状态感知

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      const response = await fetch('http://localhost:8080/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (response.ok) {
        setTitle('');
        setDescription('');
        await fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
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
    const ticketId = parseInt(e.dataTransfer.getData('ticketId'), 10);

    if (!ticketId) return;

    // 乐观更新 UI
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    // 发送 PATCH 请求更新后端状态
    try {
      await fetch(`http://localhost:8080/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      // 如果失败可以考虑回滚，这里为演示简单处理重新 fetch
      await fetchTickets();
    }
  };

  const renderTickets = (status: Ticket['status']) => {
    return tickets
      .filter((ticket) => ticket.status === status)
      .map((ticket) => (
        <Card 
          key={ticket.id} 
          draggable 
          onDragStart={(e) => handleDragStart(e, ticket.id)}
          onDragEnd={handleDragEnd}
          className="bg-zinc-800 border-zinc-700 mb-4 cursor-grab active:cursor-grabbing hover:border-zinc-500 transition-colors shadow-sm"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-zinc-100 flex-1 pr-2">
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
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700 shadow-inner">
          <span className="text-sm font-bold">U</span>
        </div>
      </header>

      {/* Main Content gap and structure */}
      <main className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Left Action Area */}
        <section className="w-full lg:w-1/4 flex flex-col gap-4">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-md">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-zinc-100">AI 智能一键报修</h2>

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
                <label className="text-xs text-zinc-400 mb-1 block">详细描述 (AI自动定级)</label>
                <Textarea
                  placeholder="详情描述：包含“不亮、坏、碎、冒烟”将会被AI识别为紧急故障"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 resize-none h-24"
                />
              </div>
            </div>

            <Button size="lg" onClick={handleSubmit} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all">
              立即提交报修
            </Button>
          </div>
        </section>

        {/* Right Kanban Area */}
        <section className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'todo')}
            className={`bg-zinc-900/80 rounded-xl p-4 border shadow-inner flex flex-col h-full min-h-[500px] transition-colors ${isDragging ? 'border-zinc-700/80' : 'border-zinc-800/80'}`}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block"></span>
                待处理
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {tickets.filter(t => t.status === 'todo').length}
              </span>
            </div>
            <div className="flex flex-col flex-1">{renderTickets('todo')}</div>
          </div>

          {/* In Progress Column */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'in-progress')}
            className={`bg-zinc-900/80 rounded-xl p-4 border shadow-inner flex flex-col h-full min-h-[500px] transition-colors ${isDragging ? 'border-blue-900/50' : 'border-zinc-800/80'}`}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                维修中
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {tickets.filter(t => t.status === 'in-progress').length}
              </span>
            </div>
            <div className="flex flex-col flex-1">{renderTickets('in-progress')}</div>
          </div>

          {/* Done Column */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'done')}
            className={`bg-zinc-900/80 rounded-xl p-4 border shadow-inner flex flex-col h-full min-h-[500px] transition-colors ${isDragging ? 'border-green-900/50' : 'border-zinc-800/80'}`}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                已完成
              </h3>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {tickets.filter(t => t.status === 'done').length}
              </span>
            </div>
            <div className="flex flex-col flex-1">{renderTickets('done')}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
