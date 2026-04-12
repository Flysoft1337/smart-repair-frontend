import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WorkerToolbarProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
}

export function WorkerToolbar({ searchInputRef, query, onQueryChange, onRefresh }: WorkerToolbarProps) {
  return (
    <div className="flex gap-3">
      <Input
        ref={searchInputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="按标题/描述搜索工单"
        className="border-zinc-700 bg-zinc-900 text-zinc-100"
      />
      <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" onClick={onRefresh}>
        刷新
      </Button>
    </div>
  );
}

