import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkerTicket } from '@/components/worker/types';

interface WorkerStatusColumnProps {
  title: string;
  emptyText: string;
  actionLabel: string;
  actionClassName: string;
  tickets: readonly WorkerTicket[];
  busyTicketId: number | null;
  onAction: (ticketId: number) => void;
  showPriority: boolean;
}

export function WorkerStatusColumn({
  title,
  emptyText,
  actionLabel,
  actionClassName,
  tickets,
  busyTicketId,
  onAction,
  showPriority,
}: WorkerStatusColumnProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-zinc-200">{title} ({tickets.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyText}</p>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <p className="font-medium">#{ticket.id} {ticket.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{ticket.description}</p>
              <div className="mt-3 flex items-center justify-between">
                {showPriority ? (
                  <span className="text-xs text-zinc-500">
                    优先级: {ticket.priority === 'urgent' ? '紧急' : ticket.priority === 'high' ? '较高' : '普通'}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                )}
                <Button
                  size="sm"
                  disabled={busyTicketId === ticket.id}
                  onClick={() => onAction(ticket.id)}
                  className={actionClassName}
                >
                  {actionLabel}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

