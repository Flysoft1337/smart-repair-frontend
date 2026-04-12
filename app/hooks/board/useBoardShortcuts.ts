import { Dispatch, RefObject, SetStateAction, useEffect } from 'react';
import { isEditableTarget } from '@/app/hooks/board/helpers';
import { Ticket } from '@/components/home/types';

interface UseBoardShortcutsParams {
  searchInputRef: RefObject<HTMLInputElement | null>;
  activeTicketId: number | null;
  sortedTickets: Ticket[];
  setActiveTicketId: Dispatch<SetStateAction<number | null>>;
  fetchTickets: () => Promise<void>;
  handleBatchMove: (status: Ticket['status']) => Promise<void>;
}

export function useBoardShortcuts({
  searchInputRef,
  activeTicketId,
  sortedTickets,
  setActiveTicketId,
  fetchTickets,
  handleBatchMove,
}: UseBoardShortcutsParams) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !isEditableTarget(event.target)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === 'Escape') {
        setActiveTicketId(null);
        return;
      }

      if (isEditableTarget(event.target)) return;

      if (event.key.toLowerCase() === 'r' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        void fetchTickets();
        return;
      }

      if (event.ctrlKey && event.shiftKey) {
        if (event.key === '1') {
          event.preventDefault();
          void handleBatchMove('todo');
        }
        if (event.key === '2') {
          event.preventDefault();
          void handleBatchMove('in-progress');
        }
        if (event.key === '3') {
          event.preventDefault();
          void handleBatchMove('done');
        }
        return;
      }

      if (event.key.toLowerCase() === 'j' || event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const ids = sortedTickets.map((ticket) => ticket.id);
        if (ids.length === 0) return;
        const currentIndex = activeTicketId ? ids.indexOf(activeTicketId) : -1;
        const nextIndex =
          event.key.toLowerCase() === 'j'
            ? currentIndex < ids.length - 1
              ? currentIndex + 1
              : 0
            : currentIndex > 0
              ? currentIndex - 1
              : ids.length - 1;
        setActiveTicketId(ids[nextIndex]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTicketId, fetchTickets, handleBatchMove, searchInputRef, setActiveTicketId, sortedTickets]);
}

