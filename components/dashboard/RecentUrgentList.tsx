import { Card } from '@/components/ui/card';
import { SparklesIcon } from '@/components/icons';
import { TicketLite } from '@/components/dashboard/types';

interface RecentUrgentListProps {
  tickets: TicketLite[];
  onOpenUrgent: () => void;
}

export function RecentUrgentList({ tickets, onOpenUrgent }: RecentUrgentListProps) {
  return (
    <Card className="col-span-1 border-zinc-800 bg-zinc-900 p-6 shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20">
          <SparklesIcon className="h-6 w-6 text-indigo-300" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-100">最近紧急工单</h3>
          <p className="text-xs text-zinc-500">按创建时间倒序，优先处理顶部项</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <p className="text-sm text-zinc-500">暂无紧急工单，系统运行平稳。</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={onOpenUrgent}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-200">#{ticket.id} {ticket.title}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {new Date(ticket.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
              </p>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

