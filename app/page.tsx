"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Ticket {
  id: string;
  title: string;
  diagnosis: string;
  priority: '紧急' | '高' | '中' | '低';
  status: 'todo' | 'in-progress' | 'done';
}

export default function SmartRepairHub() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/tickets');
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        } else {
          console.error('Failed to fetch tickets');
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, []);

  const renderTickets = (status: Ticket['status']) => {
    return tickets
      .filter((ticket) => ticket.status === status)
      .map((ticket) => (
        <Card key={ticket.id} className="bg-zinc-800 border-zinc-700 mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-zinc-100 flex-1 pr-2">
                {ticket.title}
              </CardTitle>
              <Badge
                variant={ticket.priority === '紧急' ? 'destructive' : 'default'}
                className={
                  ticket.priority === '高'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white border-transparent'
                    : ticket.priority === '中'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
                    : ticket.priority === '低'
                    ? 'bg-green-600 hover:bg-green-700 text-white border-transparent'
                    : ''
                }
              >
                {ticket.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-400">{ticket.diagnosis}</p>
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
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-10 flex flex-col items-center justify-center text-center mb-6 bg-zinc-950/30 hover:bg-zinc-800/50 hover:border-zinc-500 transition-all cursor-pointer group">
              <span className="text-4xl mb-3 text-zinc-600 group-hover:text-zinc-400 transition-colors">📸</span>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed group-hover:text-zinc-300 transition-colors">
                拖入设备故障照片<br/>AI 自动定级
              </p>
            </div>
            <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all">
              立即智能诊断
            </Button>
          </div>
        </section>

        {/* Right Kanban Area */}
        <section className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800/80 shadow-inner flex flex-col h-full min-h-[500px]">
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
          <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800/80 shadow-inner flex flex-col h-full min-h-[500px]">
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
          <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800/80 shadow-inner flex flex-col h-full min-h-[500px]">
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
