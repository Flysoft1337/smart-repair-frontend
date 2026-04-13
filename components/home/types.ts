export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal';
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
  updatedAt: string;
}

export type StatusFilter = 'all' | Ticket['status'];
export type PriorityFilter = 'all' | Ticket['priority'];
export type SortMode = 'newest' | 'oldest' | 'priority';
export type StatusKey = Ticket['status'];

