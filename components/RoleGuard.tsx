"use client";

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { clearAuthProfile, refreshAuthFromServer, redirectToLogin, Role } from '@/lib/auth';
import { useEffect, useMemo, useState } from 'react';

interface RoleGuardProps {
  roles: Role[];
  children: ReactNode;
}

type GuardState =
  | { status: 'checking' }
  | { status: 'unauthenticated' }
  | { status: 'forbidden'; role: Role }
  | { status: 'allowed' };

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const [state, setState] = useState<GuardState>({ status: 'checking' });

  const allowSet = useMemo(() => new Set(roles), [roles]);

  useEffect(() => {
    const validate = async () => {
      const remote = await refreshAuthFromServer();

      if (!remote.isAuthenticated || !remote.role) {
        clearAuthProfile();
        setState({ status: 'unauthenticated' });
        return;
      }

      if (!allowSet.has(remote.role)) {
        setState({ status: 'forbidden', role: remote.role });
        return;
      }

      setState({ status: 'allowed' });
    };

    void validate();
  }, [allowSet]);

  if (state.status === 'checking') {
    return <div className="p-8 text-zinc-400">权限校验中...</div>;
  }

  if (state.status === 'unauthenticated') {
    return (
      <div className="p-8">
        <div className="max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-medium">当前未登录，无法访问该页面。</p>
          <p className="mt-1 text-xs text-amber-200/90">请先登录后再继续操作。</p>
          <Button size="sm" className="mt-3 bg-indigo-600 hover:bg-indigo-500" onClick={() => redirectToLogin(true)}>
            去登录
          </Button>
        </div>
      </div>
    );
  }

  if (state.status === 'forbidden') {
    return (
      <div className="p-8">
        <div className="max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          <p className="font-medium">权限不足，无法访问该页面。</p>
          <p className="mt-1 text-xs text-red-200/90">
            当前角色: {state.role}，允许角色: {roles.join(' / ')}。
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-200" onClick={() => window.location.replace('/')}>
              返回看板
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500" onClick={() => redirectToLogin(true)}>
              切换账号
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
