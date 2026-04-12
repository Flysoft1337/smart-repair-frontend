import { Ticket } from '@/components/home/types';

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

export function sortTickets(tickets: Ticket[], sortMode: 'newest' | 'oldest' | 'priority'): Ticket[] {
  const priorityWeight = (value: Ticket['priority']) => (value === 'urgent' ? 2 : 1);
  const next = [...tickets];

  next.sort((a, b) => {
    if (sortMode === 'priority') {
      const priorityDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    }
    if (sortMode === 'oldest') {
      return +new Date(a.createdAt) - +new Date(b.createdAt);
    }
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });

  return next;
}

