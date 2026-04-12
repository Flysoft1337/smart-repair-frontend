"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthProfile, refreshAuthFromServer, Role } from '@/lib/auth';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const allowSet = useMemo(() => new Set(roles), [roles]);

  useEffect(() => {
    const validate = async () => {

      const remote = await refreshAuthFromServer();
      if (!remote.isAuthenticated || !remote.role || !allowSet.has(remote.role)) {
        clearAuthProfile();
        router.replace('/login');
        return;
      }

      setReady(true);
    };

    validate();
  }, [allowSet, router]);

  if (!ready) {
    return <div className="p-8 text-zinc-400">权限校验中...</div>;
  }

  return <>{children}</>;
}

