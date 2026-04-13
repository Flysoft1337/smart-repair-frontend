import { useMemo } from 'react';
import type { DragEvent, MouseEvent, UIEvent } from 'react';
import { TicketCard } from '@/components/tickets/TicketCard';
import { PriorityFilter, StatusFilter, StatusKey, Ticket } from '@/components/home/types';

interface BoardStats {
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
}

interface TicketBoardColumnsProps {
  isDragging: boolean;
  isLoading: boolean;
  canManageStatus: boolean;
  canDelete: boolean;
  hasDoneTickets: boolean;
  stats: BoardStats;
  todoTickets: readonly Ticket[];
  inProgressTickets: readonly Ticket[];
  doneTickets: readonly Ticket[];
  selectedIds: number[];
  notesByTicketId: Record<number, string>;
  visibleCountByStatus: Record<StatusKey, number>;
  debouncedQuery: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  onDrop: (e: DragEvent, status: StatusKey) => void;
  onDragOver: (e: DragEvent) => void;
  onColumnScroll: (status: StatusKey, e: UIEvent<HTMLDivElement>) => void;
  onOpenTicket: (id: number) => void;
  onToggleSelect: (id: number) => void;
  onDelete: (e: MouseEvent, id: number) => void;
  onDragStart: (e: DragEvent, id: number) => void;
  onDragEnd: () => void;
  onClearDone: () => void;
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mx-1 mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-800/50 bg-zinc-900/30 py-10 text-zinc-500">
      <svg className="mb-3 h-12 w-12 text-zinc-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10h16M9 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M6 10h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" />
      </svg>
      <p className="text-xs font-medium">{hasFilters ? '未找到相关工单' : '暂无数据'}</p>
    </div>
  );
}

export function TicketBoardColumns({
  isDragging,
  isLoading,
  canManageStatus,
  canDelete,
  hasDoneTickets,
  stats,
  todoTickets,
  inProgressTickets,
  doneTickets,
  selectedIds,
  notesByTicketId,
  visibleCountByStatus,
  debouncedQuery,
  statusFilter,
  priorityFilter,
  onDrop,
  onDragOver,
  onColumnScroll,
  onOpenTicket,
  onToggleSelect,
  onDelete,
  onDragStart,
  onDragEnd,
  onClearDone,
}: TicketBoardColumnsProps) {
  const hasFilters = Boolean(debouncedQuery) || statusFilter !== 'all' || priorityFilter !== 'all';
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const renderTickets = (status: StatusKey, columnTickets: readonly Ticket[]) => {
    const visibleTickets = columnTickets.slice(0, visibleCountByStatus[status]);

    if (columnTickets.length === 0) {
      return <EmptyState hasFilters={hasFilters} />;
    }

    return (
      <>
        {visibleTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            canManageStatus={canManageStatus}
            canDelete={canDelete}
            isSelected={selectedIdSet.has(ticket.id)}
            note={notesByTicketId[ticket.id] ?? ''}
            onOpen={onOpenTicket}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {visibleTickets.length < columnTickets.length && (
          <p className="py-2 text-center text-[11px] text-zinc-500">向下滚动加载更多...</p>
        )}
      </>
    );
  };

  return (
    <section className="grid h-full min-h-0 w-full grid-cols-1 gap-6 pb-2 md:grid-cols-3 lg:w-3/4">
      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, 'todo')}
        className={`flex h-full max-h-[80vh] flex-col rounded-xl border bg-zinc-900/80 p-4 shadow-inner transition-colors ${isDragging ? 'border-zinc-700/80' : 'border-zinc-800/80'}`}
      >
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-transparent px-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"></span>
            待处理
          </h3>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">{stats.todoCount}</span>
        </div>
        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto pr-1 pb-2" onScroll={(e) => onColumnScroll('todo', e)}>
          {isLoading ? <p className="py-8 text-center text-xs text-zinc-500">正在加载...</p> : renderTickets('todo', todoTickets)}
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, 'in-progress')}
        className={`flex h-full max-h-[80vh] flex-col rounded-xl border bg-zinc-900/80 p-4 shadow-inner transition-colors ${isDragging ? 'border-blue-900/50' : 'border-zinc-800/80'}`}
      >
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-transparent px-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            维修中
          </h3>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">{stats.inProgressCount}</span>
        </div>
        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto pr-1 pb-2" onScroll={(e) => onColumnScroll('in-progress', e)}>
          {isLoading ? <p className="py-8 text-center text-xs text-zinc-500">正在加载...</p> : renderTickets('in-progress', inProgressTickets)}
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, 'done')}
        className={`flex h-full max-h-[80vh] flex-col rounded-xl border bg-zinc-900/80 p-4 shadow-inner transition-colors ${isDragging ? 'border-green-900/50' : 'border-zinc-800/80'}`}
      >
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-transparent px-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            已完成
          </h3>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">{stats.doneCount}</span>
            {canDelete && hasDoneTickets && (
              <button
                onClick={onClearDone}
                className="rounded p-1.5 text-xs text-zinc-500 opacity-70 transition-colors hover:bg-zinc-800 hover:text-red-400 hover:opacity-100"
                title="清空所有已完成工单"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto pr-1 pb-2" onScroll={(e) => onColumnScroll('done', e)}>
          {isLoading ? <p className="py-8 text-center text-xs text-zinc-500">正在加载...</p> : renderTickets('done', doneTickets)}
        </div>
      </div>
    </section>
  );
}

