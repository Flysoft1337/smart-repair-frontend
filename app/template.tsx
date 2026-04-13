import type { ReactNode } from 'react';

export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-transition h-full min-h-0">{children}</div>;
}

