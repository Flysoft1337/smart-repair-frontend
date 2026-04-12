export function DashboardEmptyState() {
  return (
    <div className="mt-6 flex min-h-75 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6">
      <svg className="mb-4 h-16 w-16 text-zinc-500 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 className="font-medium text-zinc-300">暂时没有产生任何工单数据</h3>
      <p className="mt-2 max-w-md text-center text-sm text-zinc-600">前往看板发起您的第一个校园报修！</p>
    </div>
  );
}

