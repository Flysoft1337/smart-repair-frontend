import { apiJson } from '@/lib/api';

export interface TicketQuery {
  q?: string;
  status?: 'todo' | 'in-progress' | 'done';
  priority?: 'urgent' | 'high' | 'normal';
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal';
}

export async function fetchTickets<TTicket>(query: TicketQuery = {}): Promise<TTicket[]> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.status) params.set('status', query.status);
  if (query.priority) params.set('priority', query.priority);
  const queryString = params.toString();
  return apiJson<TTicket[]>(`/api/tickets${queryString ? `?${queryString}` : ''}`);
}

export function createTicket(payload: CreateTicketPayload) {
  return apiJson('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicketStatus(ticketId: number, status: 'todo' | 'in-progress' | 'done') {
  return apiJson(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteTicket(ticketId: number) {
  return apiJson(`/api/tickets/${ticketId}`, {
    method: 'DELETE',
  });
}

export function clearDoneTickets() {
  return apiJson('/api/tickets/clear-done', {
    method: 'DELETE',
  });
}

