"use client";

import RoleGuard from '@/components/RoleGuard';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  return <RoleGuard roles={["admin"]}>{children}</RoleGuard>;
}
