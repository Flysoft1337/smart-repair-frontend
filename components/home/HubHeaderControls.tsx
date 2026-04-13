import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriorityFilter, SortMode, StatusFilter } from '@/components/home/types';

interface HubHeaderControlsProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  sortMode: SortMode;
  role: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  onSortModeChange: (value: SortMode) => void;
  onRefresh: () => void;
  onResetView: () => void;
  isLoading: boolean;
  autoRefreshEnabled: boolean;
  lastSyncedAt: number | null;
  onToggleAutoRefresh: () => void;
}

export function HubHeaderControls({
  searchInputRef,
  searchQuery,
  statusFilter,
  priorityFilter,
  sortMode,
  role,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSortModeChange,
  onRefresh,
  onResetView,
  isLoading,
  autoRefreshEnabled,
  lastSyncedAt,
  onToggleAutoRefresh,
}: HubHeaderControlsProps) {
  return (
    <header className="mb-6 border-b border-zinc-800 pb-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Smart Repair Hub
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            快捷键: / 搜索, R 刷新, J/K 切换工单, Ctrl+Shift+1/2/3 批量改状态
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            {lastSyncedAt ? `上次同步: ${new Date(lastSyncedAt).toLocaleTimeString('zh-CN')}` : '尚未同步'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative hidden sm:block">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              ref={searchInputRef}
              placeholder="搜索报修工单..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-60 rounded-full border-zinc-700 bg-zinc-900 pl-8 text-xs text-zinc-100 focus-visible:ring-indigo-500"
            />
          </div>

          <Input
            placeholder="搜索报修工单..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border-zinc-700 bg-zinc-900 text-xs text-zinc-100 sm:hidden"
          />

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
          >
            <option value="all">全部状态</option>
            <option value="todo">待处理</option>
            <option value="in-progress">维修中</option>
            <option value="done">已完成</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as PriorityFilter)}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
          >
            <option value="all">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="normal">普通</option>
          </select>

          <select
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value as SortMode)}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
          >
            <option value="newest">最新优先</option>
            <option value="oldest">最早优先</option>
            <option value="priority">紧急优先</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? '刷新中...' : '刷新'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            onClick={onResetView}
          >
            重置视图
          </Button>

          <Button
            size="sm"
            variant={autoRefreshEnabled ? 'default' : 'outline'}
            className={autoRefreshEnabled ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'}
            onClick={onToggleAutoRefresh}
          >
            {autoRefreshEnabled ? '自动刷新: 开' : '自动刷新: 关'}
          </Button>

          <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 shadow-inner transition-colors hover:bg-zinc-700">
            <span className="text-sm font-bold">{(role?.[0] ?? 'U').toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
