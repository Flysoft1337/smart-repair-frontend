import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/components/home/types';

interface TicketActionPanelProps {
  title: string;
  description: string;
  priority: Ticket['priority'];
  autoPriorityEnabled: boolean;
  isSubmitting: boolean;
  canManageStatus: boolean;
  selectedCount: number;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: Ticket['priority']) => void;
  onSubmit: () => void;
  onBatchMove: (status: Ticket['status']) => void;
}

export function TicketActionPanel({
  title,
  description,
  priority,
  autoPriorityEnabled,
  isSubmitting,
  canManageStatus,
  selectedCount,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onSubmit,
  onBatchMove,
}: TicketActionPanelProps) {
  return (
    <section className="flex w-full flex-col gap-4 lg:w-1/4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-zinc-100 md:text-xl">一键报修</h2>

        <div className="mb-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">问题简述</label>
            <Input
              placeholder="例如：实训室电脑蓝屏"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="border-zinc-700 bg-zinc-950 text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">详细描述</label>
            <Textarea
              placeholder="请填写故障现象、地点和影响范围"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              className="h-24 resize-none border-zinc-700 bg-zinc-950 text-zinc-100"
            />
          </div>
          {!autoPriorityEnabled ? (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">优先级</label>
              <select
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value as Ticket['priority'])}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"
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
          onClick={onSubmit}
          disabled={isSubmitting || !title.trim() || !description.trim()}
          className="w-full bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '正在提交...' : '立即提交报修'}
        </Button>
        <p className="mt-2 text-[11px] text-zinc-500">快捷键: 在描述框按 Ctrl + Enter 快速提交</p>
      </div>

      {canManageStatus ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="mb-2 text-xs text-zinc-400">批量操作 ({selectedCount})</p>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800" onClick={() => onBatchMove('todo')} disabled={selectedCount === 0}>
              待处理
            </Button>
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800" onClick={() => onBatchMove('in-progress')} disabled={selectedCount === 0}>
              维修中
            </Button>
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800" onClick={() => onBatchMove('done')} disabled={selectedCount === 0}>
              已完成
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200">
          当前账号只有查看权限，不能批量流转工单。
        </div>
      )}
    </section>
  );
}

