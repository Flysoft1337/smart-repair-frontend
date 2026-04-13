import { apiJson } from '@/lib/api';

export type ManagedUserRole = 'student' | 'department-admin' | 'college-admin' | 'super-admin' | 'maintainer';

export interface ManagedUser {
  id: number;
  username: string;
  name: string;
  role: ManagedUserRole;
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
  page?: number;
  limit?: number;
}

export function fetchUsers(query: UsersQuery = {}) {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.role && query.role !== 'all') params.set('role', query.role);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const suffix = params.toString();
  return apiJson<UsersListResponse>(`/api/users${suffix ? `?${suffix}` : ''}`);
}

export function createUser(payload: { username: string; password: string; name: string; role: ManagedUserRole }) {
  return apiJson<ManagedUser>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: number, payload: { username?: string; name?: string; role?: ManagedUserRole }) {
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
    rows?: Array<{ username: string; name: string; role: ManagedUserRole; line: number }>;
    errors: string[];
    failedRows?: string;
  }

export function importUsersCsv(csv: string, mode: 'dry-run' | 'commit') {
  return apiJson<ImportUsersResponse>('/api/users/import-csv', {
    method: 'POST',
    body: JSON.stringify({ csv, mode }),
  });
}

