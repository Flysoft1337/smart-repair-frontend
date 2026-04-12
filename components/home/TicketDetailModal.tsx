"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/components/home/types';
import { AuditLog, fetchTicketAuditLogs } from '@/lib/services';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  notesByTicketId: Record<number, string>;
  onClose: () => void;
  onUpdateNote: (ticketId: number, note: string) => void;
}

export function TicketDetailModal({ ticket, notesByTicketId, onClose, onUpdateNote }: TicketDetailModalProps) {
  const [timeline, setTimeline] = useState<AuditLog[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket) return;

    const loadTimeline = async () => {
      setLoadingTimeline(true);
      setTimelineError(null);
      try {
        const items = await fetchTicketAuditLogs(ticket.id, 8);
        setTimeline(items);
      } catch {
        setTimelineError('日志加载失败');
      } finally {
        setLoadingTimeline(false);
      }
    };

    void loadTimeline();
  }, [ticket]);

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{ticket.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">工单 #{ticket.id}</p>
          </div>
          <Button size="sm" variant="ghost" className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-400">状态: {ticket.status}</div>
          <div className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-400">优先级: {ticket.priority}</div>
          <div className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-400">更新时间: {new Date(ticket.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
        </div>

        <p className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">{ticket.description}</p>

        <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <p className="mb-2 text-xs text-zinc-400">最近操作时间线</p>
          {loadingTimeline ? (
            <p className="text-xs text-zinc-500">加载中...</p>
          ) : timelineError ? (
            <p className="text-xs text-amber-300">{timelineError}</p>
          ) : timeline.length === 0 ? (
            <p className="text-xs text-zinc-500">暂无相关日志</p>
          ) : (
            <div className="space-y-2">
              {timeline.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-2 rounded border border-zinc-800 px-2 py-1.5 text-[11px]">
                  <span className="truncate text-zinc-300">{log.action} · {log.actor}</span>
                  <span className="shrink-0 text-zinc-500">{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="mb-1 block text-xs text-zinc-400">个人备注 (仅本地保存)</label>
        <Textarea
          value={notesByTicketId[ticket.id] ?? ''}
          onChange={(e) => onUpdateNote(ticket.id, e.target.value)}
          placeholder="例如：已联系机房管理员，等待配件到货"
          className="h-24 resize-none border-zinc-700 bg-zinc-950 text-zinc-100"
        />
      </div>
    </div>
  );
}

