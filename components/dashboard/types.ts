export interface AnalyticsData {
  total: number;
  done: number;
  urgent: number;
  inProgress: number;
  completionRate: number;
  distribution: { name: string; value: number; fill: string }[];
}

export interface TicketLite {
  id: number;
  title: string;
  priority: 'urgent' | 'normal';
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
}

export type Trend = 'up' | 'down' | 'stable';

