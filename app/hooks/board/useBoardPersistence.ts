import { Dispatch, SetStateAction, useEffect } from 'react';
import { NOTE_STORAGE_KEY, VIEW_STORAGE_KEY } from '@/app/hooks/board/constants';
import { PriorityFilter, SortMode, StatusFilter } from '@/components/home/types';

interface UseBoardPersistenceParams {
  searchQuery: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  sortMode: SortMode;
  notesByTicketId: Record<number, string>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setDebouncedQuery: Dispatch<SetStateAction<string>>;
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
  setPriorityFilter: Dispatch<SetStateAction<PriorityFilter>>;
  setSortMode: Dispatch<SetStateAction<SortMode>>;
  setNotesByTicketId: Dispatch<SetStateAction<Record<number, string>>>;
}

export function useBoardPersistence({
  searchQuery,
  statusFilter,
  priorityFilter,
  sortMode,
  notesByTicketId,
  setSearchQuery,
  setDebouncedQuery,
  setStatusFilter,
  setPriorityFilter,
  setSortMode,
  setNotesByTicketId,
}: UseBoardPersistenceParams) {
  useEffect(() => {
    try {
      const rawViewState = localStorage.getItem(VIEW_STORAGE_KEY);
      if (rawViewState) {
        const parsed = JSON.parse(rawViewState) as {
          searchQuery?: string;
          statusFilter?: StatusFilter;
          priorityFilter?: PriorityFilter;
          sortMode?: SortMode;
        };
        setSearchQuery(parsed.searchQuery ?? '');
        setDebouncedQuery(parsed.searchQuery ?? '');
        setStatusFilter(parsed.statusFilter ?? 'all');
        setPriorityFilter(parsed.priorityFilter ?? 'all');
        setSortMode(parsed.sortMode ?? 'newest');
      }

      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const priorityFromUrl = params.get('priority');
      if (status === 'todo' || status === 'in-progress' || status === 'done') {
        setStatusFilter(status);
      }
      if (priorityFromUrl === 'urgent' || priorityFromUrl === 'normal') {
        setPriorityFilter(priorityFromUrl);
      }

      const rawNotes = localStorage.getItem(NOTE_STORAGE_KEY);
      if (rawNotes) {
        const parsedNotes = JSON.parse(rawNotes) as Record<string, string>;
        const normalized: Record<number, string> = {};
        Object.keys(parsedNotes).forEach((key) => {
          const numericId = Number(key);
          if (Number.isFinite(numericId)) normalized[numericId] = parsedNotes[key];
        });
        setNotesByTicketId(normalized);
      }
    } catch {
      // Ignore invalid local data and use defaults.
    }
  }, [setDebouncedQuery, setNotesByTicketId, setPriorityFilter, setSearchQuery, setSortMode, setStatusFilter]);

  useEffect(() => {
    localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ searchQuery, statusFilter, priorityFilter, sortMode })
    );
  }, [searchQuery, statusFilter, priorityFilter, sortMode]);

  useEffect(() => {
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(notesByTicketId));
  }, [notesByTicketId]);
}

