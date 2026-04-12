import { apiJson } from '@/lib/api';

export interface AuditLog {
  id: number;
  action: string;
  ticketId: number | null;
  actor: string;
  role: string;
  details: string | null;
  createdAt: string;
}

export interface AuditLogQuery {
  q?: string;
  action?: string;
  role?: string;
  ticketId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function fetchAuditLogs(query: AuditLogQuery = {}) {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.action && query.action !== 'all') params.set('action', query.action);
  if (query.role && query.role !== 'all') params.set('role', query.role);
  if (query.ticketId) params.set('ticketId', String(query.ticketId));
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  return apiJson<AuditLogsResponse>(`/api/audit-logs?${params.toString()}`);
}

export async function fetchTicketAuditLogs(ticketId: number, limit = 8): Promise<AuditLog[]> {
  const data = await fetchAuditLogs({ ticketId, page: 1, limit });
  return data.items;
}

