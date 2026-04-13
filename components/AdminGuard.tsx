"use client";

import type { ReactNode } from 'react';
import RoleGuard from '@/components/RoleGuard';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  return <RoleGuard roles={["super-admin", "college-admin", "department-admin"]}>{children}</RoleGuard>;
}
