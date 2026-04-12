"use client";

import { Button } from '@/components/ui/button';
import { HubHeaderControls, TicketActionPanel, TicketBoardColumns, TicketDetailModal } from '@/components/home';
import { useSmartRepairBoard } from '@/app/hooks/useSmartRepairBoard';

export default function SmartRepairHub() {
  const board = useSmartRepairBoard();

  return (
    <div className="h-full min-h-0 overflow-hidden bg-zinc-950 p-6 font-sans text-zinc-50">
      <HubHeaderControls
        searchInputRef={board.searchInputRef}
        searchQuery={board.searchQuery}
        statusFilter={board.statusFilter}
        priorityFilter={board.priorityFilter}
        sortMode={board.sortMode}
        role={board.role}
        onSearchChange={board.setSearchQuery}
        onStatusFilterChange={board.setStatusFilter}
        onPriorityFilterChange={board.setPriorityFilter}
        onSortModeChange={board.setSortMode}
        onRefresh={() => void board.fetchTickets()}
        onResetView={board.onResetView}
        isLoading={board.isLoading}
        autoRefreshEnabled={board.autoRefreshEnabled}
        lastSyncedAt={board.lastSyncedAt}
        onToggleAutoRefresh={board.toggleAutoRefresh}
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => board.onQuickFilterStatus('todo')}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
          <p className="text-xs text-zinc-500">待处理</p>
          <p className="text-lg font-semibold text-zinc-100">{board.stats.todoCount}</p>
        </button>
        <button
          type="button"
          onClick={() => board.onQuickFilterStatus('in-progress')}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
          <p className="text-xs text-zinc-500">维修中</p>
          <p className="text-lg font-semibold text-blue-300">{board.stats.inProgressCount}</p>
        </button>
        <button
          type="button"
          onClick={() => board.onQuickFilterStatus('done')}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
          <p className="text-xs text-zinc-500">已完成</p>
          <p className="text-lg font-semibold text-green-300">{board.stats.doneCount}</p>
        </button>
        <button
          type="button"
          onClick={() => board.onQuickFilterPriority('urgent')}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
          <p className="text-xs text-zinc-500">紧急工单</p>
          <p className="text-lg font-semibold text-red-300">{board.stats.urgentCount}</p>
        </button>
      </section>

      {board.errorMessage && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          <span>{board.errorMessage}</span>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-100 hover:bg-red-500/20" onClick={() => void board.fetchTickets()}>
            重试
          </Button>
        </div>
      )}

      {board.lastSnapshot && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
          <span>批量操作已完成。</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-indigo-100 hover:bg-indigo-500/20"
            onClick={() => void board.handleUndoBatch()}
          >
            撤销
          </Button>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        <TicketActionPanel
          title={board.title}
          description={board.description}
          priority={board.priority}
          autoPriorityEnabled={board.autoPriorityEnabled}
          isSubmitting={board.isSubmitting}
          canManageStatus={board.canManageStatus}
          selectedCount={board.selectedCount}
          onTitleChange={board.setTitle}
          onDescriptionChange={board.setDescription}
          onPriorityChange={board.setPriority}
          onSubmit={() => void board.handleSubmit()}
          onBatchMove={(status) => void board.handleBatchMove(status)}
        />

        <TicketBoardColumns
          isDragging={board.isDragging}
          isLoading={board.isLoading}
          canManageStatus={board.canManageStatus}
          canDelete={board.canDelete}
          hasDoneTickets={board.hasDoneTickets}
          stats={board.stats}
          todoTickets={board.todoTickets}
          inProgressTickets={board.inProgressTickets}
          doneTickets={board.doneTickets}
          selectedIds={board.selectedIds}
          notesByTicketId={board.notesByTicketId}
          visibleCountByStatus={board.visibleCountByStatus}
          debouncedQuery={board.debouncedQuery}
          statusFilter={board.statusFilter}
          priorityFilter={board.priorityFilter}
          onDrop={(e, status) => void board.onDrop(e, status)}
          onDragOver={board.onDragOver}
          onColumnScroll={board.onColumnScroll}
          onOpenTicket={board.setActiveTicketId}
          onToggleSelect={board.onToggleSelect}
          onDelete={(e, id) => {
            void board.handleDelete(e, id);
          }}
          onDragStart={board.onDragStart}
          onDragEnd={board.onDragEnd}
          onClearDone={() => void board.handleClearDone()}
        />
      </main>

      <TicketDetailModal
        ticket={board.activeTicket}
        notesByTicketId={board.notesByTicketId}
        onClose={() => board.setActiveTicketId(null)}
        onUpdateNote={(ticketId, note) =>
          board.setNotesByTicketId((prev) => ({ ...prev, [ticketId]: note }))
        }
      />
    </div>
  );
}
