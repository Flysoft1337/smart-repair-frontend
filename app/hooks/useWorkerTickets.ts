import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearAuthProfile } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { WorkerTicket } from '@/components/worker/types';
import { fetchTickets, updateTicketStatus } from '@/lib/services';
import { redirectToLogin } from '@/lib/auth';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

export interface UseWorkerTicketsResult {
  searchInputRef: RefObject<HTMLInputElement | null>;
  tickets: WorkerTicket[];
  loading: boolean;
  query: string;
  busyTicketId: number | null;
  todoTickets: readonly WorkerTicket[];
  progressTickets: readonly WorkerTicket[];
  setQuery: (value: string) => void;
  fetchTickets: () => Promise<void>;
  updateStatus: (id: number, status: WorkerTicket['status']) => Promise<void>;
}

export function useWorkerTickets(): UseWorkerTicketsResult {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [tickets, setTickets] = useState<WorkerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyTicketId, setBusyTicketId] = useState<number | null>(null);

  const fetchTicketsAction = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTickets<WorkerTicket>({ q: query });
      setTickets(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthProfile();
        redirectToLogin();
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  const updateStatus = useCallback(async (id: number, status: WorkerTicket['status']) => {
    setBusyTicketId(id);
    try {
      await updateTicketStatus(id, status);
      await fetchTicketsAction();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthProfile();
        redirectToLogin();
      }
    } finally {
      setBusyTicketId(null);
    }
  }, [fetchTicketsAction]);

  useEffect(() => {
    void fetchTicketsAction();
  }, [fetchTicketsAction]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isEditableTarget(event.target)) return;

      if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        void fetchTicketsAction();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fetchTicketsAction]);

  const todoTickets = useMemo(() => tickets.filter((ticket) => ticket.status === 'todo'), [tickets]);
  const progressTickets = useMemo(() => tickets.filter((ticket) => ticket.status === 'in-progress'), [tickets]);

  return {
    searchInputRef,
    tickets,
    loading,
    query,
    busyTicketId,
    todoTickets,
    progressTickets,
    setQuery,
    fetchTickets: fetchTicketsAction,
    updateStatus,
  };
}

