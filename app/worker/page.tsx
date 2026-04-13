"use client";

import RoleGuard from '@/components/RoleGuard';
import { WorkerPageHeader, WorkerStatusColumn, WorkerToolbar } from '@/components/worker';
import { useWorkerTickets } from '@/app/hooks/useWorkerTickets';

export default function WorkerPage() {
  const worker = useWorkerTickets();

  return (
    <RoleGuard roles={['department-admin', 'college-admin', 'super-admin', 'maintainer']}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-8 text-zinc-100">
        <WorkerPageHeader />

        <WorkerToolbar
          searchInputRef={worker.searchInputRef}
          query={worker.query}
          onQueryChange={worker.setQuery}
          onRefresh={() => void worker.fetchTickets()}
        />

        {worker.loading ? (
          <p className="text-sm text-zinc-500">加载中...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WorkerStatusColumn
              title="待处理"
              emptyText="暂无待处理工单"
              actionLabel="开始处理"
              actionClassName="bg-blue-600 hover:bg-blue-500"
              tickets={worker.todoTickets}
              busyTicketId={worker.busyTicketId}
              onAction={(ticketId) => void worker.updateStatus(ticketId, 'in-progress')}
              showPriority={false}
            />

            <WorkerStatusColumn
              title="维修中"
              emptyText="暂无维修中的工单"
              actionLabel="标记完成"
              actionClassName="bg-emerald-600 hover:bg-emerald-500"
              tickets={worker.progressTickets}
              busyTicketId={worker.busyTicketId}
              onAction={(ticketId) => void worker.updateStatus(ticketId, 'done')}
              showPriority={true}
            />
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
