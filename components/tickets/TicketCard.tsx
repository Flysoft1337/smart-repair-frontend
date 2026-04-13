import { memo } from 'react';
import type { DragEvent, MouseEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Ticket = {
  id: number;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal';
  createdAt: string;
};

type TicketCardProps = {
  ticket: Ticket;
  canManageStatus: boolean;
  canDelete: boolean;
  isSelected: boolean;
  note: string;
  onOpen: (id: number) => void;
  onToggleSelect: (id: number) => void;
  onDelete: (e: MouseEvent, id: number) => void;
  onDragStart: (e: DragEvent, id: number) => void;
  onDragEnd: () => void;
};

function TicketCardComponent({
  ticket,
  canManageStatus,
  canDelete,
  isSelected,
  note,
  onOpen,
  onToggleSelect,
  onDelete,
  onDragStart,
  onDragEnd,
}: TicketCardProps) {
  return (
    <Card
      draggable={canManageStatus}
      onDragStart={(e) => canManageStatus && onDragStart(e, ticket.id)}
      onDragEnd={() => canManageStatus && onDragEnd()}
      onClick={() => onOpen(ticket.id)}
      className={`group relative mb-4 border bg-zinc-800 shadow-sm transition-colors ${
        canManageStatus ? 'cursor-grab active:cursor-grabbing hover:border-zinc-500' : 'cursor-pointer'
      } ${isSelected ? 'border-indigo-500/60 ring-1 ring-indigo-500/40' : 'border-zinc-700'}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            {canManageStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(ticket.id);
                }}
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                    : 'border-zinc-600 bg-zinc-900 text-transparent hover:border-zinc-500 hover:text-zinc-300'
                }`}
                title={isSelected ? '取消多选' : '加入批量操作'}
                aria-label={isSelected ? '取消多选' : '加入批量操作'}
              >
                ✓
              </button>
            )}
            <CardTitle className="min-w-0 flex-1 text-sm font-medium text-zinc-100">{ticket.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge
              variant={ticket.priority === 'urgent' ? 'destructive' : 'default'}
              className={
                ticket.priority === 'urgent'
                  ? 'border-transparent bg-red-600 text-white hover:bg-red-700'
                  : ticket.priority === 'high'
                    ? 'border-transparent bg-amber-500/90 text-zinc-950 hover:bg-amber-400'
                    : 'border-transparent bg-zinc-600 text-white hover:bg-zinc-700'
              }
            >
              {ticket.priority === 'urgent' ? '紧急' : ticket.priority === 'high' ? '较高' : '普通'}
            </Badge>

            {canDelete && (
              <button
                onClick={(e) => onDelete(e, ticket.id)}
                className="rounded-full p-1 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-700 hover:text-red-400"
                title="删除工单"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 line-clamp-2 text-xs text-zinc-400">{ticket.description}</p>
        <p className="mb-2 text-[10px] text-zinc-600">
          {new Date(ticket.createdAt).toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {note && <p className="line-clamp-1 text-[10px] text-indigo-300/80">备注: {note}</p>}
      </CardContent>
    </Card>
  );
}

export const TicketCard = memo(
  TicketCardComponent,
  (prev, next) =>
    prev.ticket.id === next.ticket.id &&
    prev.ticket.title === next.ticket.title &&
    prev.ticket.description === next.ticket.description &&
    prev.ticket.priority === next.ticket.priority &&
    prev.ticket.createdAt === next.ticket.createdAt &&
    prev.isSelected === next.isSelected &&
    prev.canManageStatus === next.canManageStatus &&
    prev.canDelete === next.canDelete &&
    prev.note === next.note
);

