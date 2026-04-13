import { apiJson } from '@/lib/api';

export type ManagedUserRole = 'student' | 'department-admin' | 'college-admin' | 'super-admin' | 'maintainer';

export interface OrgCollege {
  id: number;
  name: string;
  code: string;
  userCount?: number;
  departmentCount?: number;
}

export interface OrgDepartment {
  id: number;
  name: string;
  code: string;
  collegeId: number;
  userCount?: number;
}

export interface ManagedUser {
  id: number;
  username: string;
  name: string;
  role: ManagedUserRole;
  collegeId: number | null;
  departmentId: number | null;
  college: OrgCollege | null;
  department: OrgDepartment | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  items: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersQuery {
  q?: string;
  role?: 'all' | ManagedUserRole;
  collegeId?: number;
  departmentId?: number;
  page?: number;
  limit?: number;
}

export function fetchUsers(query: UsersQuery = {}) {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.role && query.role !== 'all') params.set('role', query.role);
  if (query.collegeId) params.set('collegeId', String(query.collegeId));
  if (query.departmentId) params.set('departmentId', String(query.departmentId));
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const suffix = params.toString();
  return apiJson<UsersListResponse>(`/api/users${suffix ? `?${suffix}` : ''}`);
}

export interface SaveUserPayload {
  username: string;
  password: string;
  name: string;
  role: ManagedUserRole;
  collegeId?: number;
  departmentId?: number;
}

export function createUser(payload: SaveUserPayload) {
  return apiJson<ManagedUser>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface UpdateUserPayload {
  username?: string;
  name?: string;
  role?: ManagedUserRole;
  collegeId?: number | null;
  departmentId?: number | null;
}

export function updateUser(userId: number, payload: UpdateUserPayload) {
  return apiJson<ManagedUser>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function resetUserPassword(userId: number, password: string) {
  return apiJson<{ success: boolean }>(`/api/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export function deleteUser(userId: number) {
  return apiJson<{ success: boolean }>(`/api/users/${userId}`, {
    method: 'DELETE',
  });
}

export interface ImportUsersResponse {
  success: boolean;
  mode: 'dry-run' | 'commit';
  totalRows: number;
  created?: number;
  updated?: number;
  failed?: number;
  rows?: Array<{
    username: string;
    name: string;
    role: ManagedUserRole;
    collegeCode: string | null;
    departmentCode: string | null;
    line: number;
  }>;
  errors: string[];
  failedRows?: string;
}

export function importUsersCsv(csv: string, mode: 'dry-run' | 'commit') {
  return apiJson<ImportUsersResponse>('/api/users/import-csv', {
    method: 'POST',
    body: JSON.stringify({ csv, mode }),
  });
}

export interface OrgTreeResponse {
  colleges: Array<OrgCollege & { departments: OrgDepartment[] }>;
}

export function fetchOrgTree(query: { q?: string } = {}) {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  const suffix = params.toString();
  return apiJson<OrgTreeResponse>(`/api/org/tree${suffix ? `?${suffix}` : ''}`);
}
