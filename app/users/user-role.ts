import type { ManagedUserRole } from '@/lib/services';

export const ROLE_LABEL: Record<ManagedUserRole, string> = {
  student: '学生',
  'department-admin': '系部管理',
  'college-admin': '院部管理',
  'super-admin': '总管理',
  maintainer: '维修人员',
};

export const ROLE_OPTIONS: Array<{ value: ManagedUserRole; label: string }> = [
  { value: 'student', label: '学生' },
  { value: 'maintainer', label: '维修人员' },
  { value: 'department-admin', label: '系部管理' },
  { value: 'college-admin', label: '院部管理' },
  { value: 'super-admin', label: '总管理' },
];

