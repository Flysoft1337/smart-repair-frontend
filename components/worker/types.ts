export type WorkerTicket = {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'urgent' | 'normal';
  createdAt: string;
};

