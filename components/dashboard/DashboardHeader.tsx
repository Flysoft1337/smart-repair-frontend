import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  onOpenUrgent: () => void;
}

export function DashboardHeader({ onOpenUrgent }: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-extrabold">数据大盘</h1>
        <p className="text-sm text-zinc-500">校园智能报修中枢实时运转监测</p>
      </div>
      <Button
        variant="outline"
        className="border-zinc-700 bg-zinc-900 text-zinc-300"
        onClick={onOpenUrgent}
      >
        查看紧急工单
      </Button>
    </header>
  );
}

