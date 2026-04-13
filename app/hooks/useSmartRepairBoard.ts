import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, DragEvent, MouseEvent, RefObject, SetStateAction, UIEvent } from 'react';
import { AUTH_EVENT, Role, clearAuthProfile, refreshAuthFromServer, redirectToLogin } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { PriorityFilter, SortMode, StatusFilter, StatusKey, Ticket } from '@/components/home/types';
import { PAGE_SIZE } from '@/app/hooks/board/constants';
import { sortTickets } from '@/app/hooks/board/helpers';
import { useBoardPersistence } from '@/app/hooks/board/useBoardPersistence';
import { useBoardShortcuts } from '@/app/hooks/board/useBoardShortcuts';
import {
  clearDoneTickets,
  createTicket,
  deleteTicket,
  fetchTickets as fetchTicketsService,
  updateTicketStatus as updateTicketStatusService,
  fetchPriorityMode,
} from '@/lib/services';

export interface UseSmartRepairBoardResult {
  searchInputRef: RefObject<HTMLInputElement | null>;
  role: Role | null;
  tickets: Ticket[];
  searchQuery: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  sortMode: SortMode;
  title: string;
  description: string;
  priority: Ticket['priority'];
  autoPriorityEnabled: boolean;
  isDragging: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  autoRefreshEnabled: boolean;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  selectedIds: number[];
  selectedCount: number;
  lastSnapshot: Ticket[] | null;
  activeTicket: Ticket | null;
  notesByTicketId: Record<number, string>;
  visibleCountByStatus: Record<StatusKey, number>;
  canManageStatus: boolean;
  canDelete: boolean;
  hasDoneTickets: boolean;
  stats: {
    todoCount: number;
    inProgressCount: number;
    doneCount: number;
    urgentCount: number;
  };
  debouncedQuery: string;
  todoTickets: readonly Ticket[];
  inProgressTickets: readonly Ticket[];
  doneTickets: readonly Ticket[];
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
  setPriorityFilter: Dispatch<SetStateAction<PriorityFilter>>;
  setSortMode: Dispatch<SetStateAction<SortMode>>;
  setTitle: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setPriority: Dispatch<SetStateAction<Ticket['priority']>>;
  setActiveTicketId: Dispatch<SetStateAction<number | null>>;
  setNotesByTicketId: Dispatch<SetStateAction<Record<number, string>>>;
  fetchTickets: () => Promise<void>;
  onResetView: () => void;
  onQuickFilterStatus: (status: StatusFilter) => void;
  onQuickFilterPriority: (priority: PriorityFilter) => void;
  toggleAutoRefresh: () => void;
  handleSubmit: () => Promise<void>;
  handleBatchMove: (status: Ticket['status']) => Promise<void>;
  handleUndoBatch: () => Promise<void>;
  handleDelete: (e: MouseEvent, id: number) => Promise<void>;
  handleClearDone: () => Promise<void>;
  onDrop: (e: DragEvent, status: Ticket['status']) => Promise<void>;
  onDragOver: (e: DragEvent) => void;
  onColumnScroll: (status: StatusKey, e: UIEvent<HTMLDivElement>) => void;
  onToggleSelect: (ticketId: number) => void;
  onDragStart: (e: DragEvent, id: number) => void;
  onDragEnd: () => void;
}

export function useSmartRepairBoard(): UseSmartRepairBoardResult {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fetchSeqRef = useRef(0);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Ticket['priority']>('normal');
  const [autoPriorityEnabled, setAutoPriorityEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastSnapshot, setLastSnapshot] = useState<Ticket[] | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [notesByTicketId, setNotesByTicketId] = useState<Record<number, string>>({});
  const [visibleCountByStatus, setVisibleCountByStatus] = useState<Record<StatusKey, number>>({
    todo: PAGE_SIZE,
    'in-progress': PAGE_SIZE,
    done: PAGE_SIZE,
  });

  const canManageStatus = role === 'super-admin' || role === 'college-admin' || role === 'department-admin' || role === 'maintainer';
  const canDelete = role === 'super-admin' || role === 'college-admin';

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) ?? null,
    [activeTicketId, tickets]
  );

  const sortedTickets = useMemo(() => sortTickets(tickets, sortMode), [tickets, sortMode]);
  const todoTickets = useMemo(
    () => sortedTickets.filter((ticket) => ticket.status === 'todo'),
    [sortedTickets]
  );
  const inProgressTickets = useMemo(
    () => sortedTickets.filter((ticket) => ticket.status === 'in-progress'),
    [sortedTickets]
  );
  const doneTickets = useMemo(
    () => sortedTickets.filter((ticket) => ticket.status === 'done'),
    [sortedTickets]
  );

  const stats = useMemo(
    () => ({
      todoCount: todoTickets.length,
      inProgressCount: inProgressTickets.length,
      doneCount: doneTickets.length,
      urgentCount: tickets.filter((ticket) => ticket.priority === 'urgent').length,
    }),
    [todoTickets.length, inProgressTickets.length, doneTickets.length, tickets]
  );

  const selectedCount = selectedIds.length;
  const hasDoneTickets = useMemo(
    () => tickets.some((ticket) => ticket.status === 'done'),
    [tickets]
  );

  const handleUnauthorized = useCallback(() => {
    clearAuthProfile();
    redirectToLogin();
  }, []);

  const fetchTickets = useCallback(async () => {
    const fetchId = ++fetchSeqRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchTicketsService<Ticket>({
        q: debouncedQuery,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      });
      if (fetchSeqRef.current === fetchId) {
        setTickets(data);
        setSelectedIds((prev) => prev.filter((id) => data.some((ticket) => ticket.id === id)));
        setLastSyncedAt(Date.now());
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorized();
        return;
      }
      if (fetchSeqRef.current === fetchId) {
        setErrorMessage('加载工单失败，请检查网络或后端服务。');
      }
      console.error('Error fetching tickets:', error);
    } finally {
      if (fetchSeqRef.current === fetchId) {
        setIsLoading(false);
      }
    }
  }, [debouncedQuery, statusFilter, priorityFilter, handleUnauthorized]);

  const updateTicketStatus = useCallback(
    async (ticketId: number, newStatus: Ticket['status']) => {
      try {
        await updateTicketStatusService(ticketId, newStatus);
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          handleUnauthorized();
          return false;
        }
        console.error('Error updating ticket status:', error);
        return false;
      }
    },
    [handleUnauthorized]
  );

  const handleBatchMove = useCallback(
    async (targetStatus: Ticket['status']) => {
      if (!canManageStatus || selectedIds.length === 0) return;

      const snapshot = [...tickets];
      setLastSnapshot(snapshot);
      setErrorMessage(null);

      setTickets((prev) =>
        prev.map((ticket) =>
          selectedIds.includes(ticket.id) ? { ...ticket, status: targetStatus } : ticket
        )
      );

      const results = await Promise.all(selectedIds.map((id) => updateTicketStatus(id, targetStatus)));
      if (results.some((success) => !success)) {
        setErrorMessage('部分工单更新失败，已自动回滚。');
        setTickets(snapshot);
        return;
      }
      setSelectedIds([]);
    },
    [canManageStatus, selectedIds, tickets, updateTicketStatus]
  );

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await createTicket({ title, description, priority });
      setTitle('');
      setDescription('');
      setPriority('normal');
      await fetchTickets();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorized();
        return;
      }
      setErrorMessage('提交报修失败，请稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, priority, fetchTickets, handleUnauthorized]);

  const handleDelete = useCallback(
    async (e: MouseEvent, id: number) => {
      e.stopPropagation();
      if (!window.confirm('确定要删除这条报修记录吗？')) return;

      setErrorMessage(null);
      try {
        await deleteTicket(id);
        setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
        setSelectedIds((prev) => prev.filter((ticketId) => ticketId !== id));
        if (activeTicketId === id) setActiveTicketId(null);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          handleUnauthorized();
          return;
        }
        setErrorMessage('删除失败：当前账号没有权限或网络异常。');
      }
    },
    [activeTicketId, handleUnauthorized]
  );

  const handleUndoBatch = useCallback(async () => {
    if (!lastSnapshot) return;
    const current = [...tickets];
    setTickets(lastSnapshot);
    const currentMap = new Map(current.map((ticket) => [ticket.id, ticket]));

    const rollbackPairs = lastSnapshot
      .map((oldTicket) => {
        const currentTicket = currentMap.get(oldTicket.id);
        if (!currentTicket || currentTicket.status === oldTicket.status) return null;
        return { id: oldTicket.id, status: oldTicket.status };
      })
      .filter((item): item is { id: number; status: Ticket['status'] } => Boolean(item));

    const results = await Promise.all(rollbackPairs.map((item) => updateTicketStatus(item.id, item.status)));
    if (results.some((ok) => !ok)) {
      setErrorMessage('撤销未完全成功，已重新同步列表。');
      await fetchTickets();
    }
    setLastSnapshot(null);
  }, [lastSnapshot, tickets, updateTicketStatus, fetchTickets]);

  const handleClearDone = useCallback(async () => {
    if (!window.confirm('确定要清空所有已完成的报修记录吗？')) return;

    const doneIds = new Set(tickets.filter((ticket) => ticket.status === 'done').map((ticket) => ticket.id));
    setErrorMessage(null);
    try {
      await clearDoneTickets();
      setTickets((prev) => prev.filter((ticket) => ticket.status !== 'done'));
      setSelectedIds((prev) => prev.filter((id) => !doneIds.has(id)));
      if (activeTicket?.status === 'done') setActiveTicketId(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleUnauthorized();
        return;
      }
      setErrorMessage('清空失败：权限不足或网络异常。');
    }
  }, [tickets, activeTicket, handleUnauthorized]);

  const handleDrop = useCallback(async (e: DragEvent, newStatus: Ticket['status']) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canManageStatus) return;

    const ticketId = Number.parseInt(e.dataTransfer.getData('ticketId'), 10);
    if (!ticketId) return;

    const snapshot = [...tickets];
    setTickets((prev) =>
      prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket))
    );

    const ok = await updateTicketStatus(ticketId, newStatus);
    if (!ok) {
      setTickets(snapshot);
      setErrorMessage('状态更新失败，已恢复原状态。');
    }
  }, [canManageStatus, tickets, updateTicketStatus]);

  const onColumnScroll = useCallback((status: StatusKey, e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 160;
    if (!nearBottom) return;
    setVisibleCountByStatus((prev) => ({
      ...prev,
      [status]: prev[status] + PAGE_SIZE,
    }));
  }, []);

  const onToggleSelect = useCallback(
    (ticketId: number) => {
      if (!canManageStatus) return;
      setSelectedIds((prev) =>
        prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
      );
    },
    [canManageStatus]
  );

  const onDragStart = useCallback((e: DragEvent, id: number) => {
    e.dataTransfer.setData('ticketId', id.toString());
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const onResetView = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortMode('newest');
  }, []);

  const onQuickFilterStatus = useCallback((status: StatusFilter) => {
    setStatusFilter(status);
  }, []);

  const onQuickFilterPriority = useCallback((filterPriority: PriorityFilter) => {
    setPriorityFilter(filterPriority);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      void refreshAuthFromServer().then((snapshot) => setRole(snapshot.role));
      void (async () => {
        try {
          const data = await fetchPriorityMode();
          setAutoPriorityEnabled(Boolean(data.autoPriorityEnabled));
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            handleUnauthorized();
            return;
          }
          setErrorMessage('加载系统设置失败，请稍后重试。');
        }
      })();
    };

    onAuthChanged();
    window.addEventListener(AUTH_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChanged);
  }, [handleUnauthorized]);

  useBoardPersistence({
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
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(deferredSearchQuery);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [deferredSearchQuery]);

  useEffect(() => {
    setVisibleCountByStatus({ todo: PAGE_SIZE, 'in-progress': PAGE_SIZE, done: PAGE_SIZE });
  }, [debouncedQuery, statusFilter, priorityFilter, sortMode]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchTickets();
      }
    }, 30000);

    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, fetchTickets]);

  useBoardShortcuts({
    searchInputRef,
    activeTicketId,
    sortedTickets,
    setActiveTicketId,
    fetchTickets,
    handleBatchMove,
  });

  return {
    searchInputRef,
    role,
    tickets,
    searchQuery,
    statusFilter,
    priorityFilter,
    sortMode,
    title,
    description,
    priority,
    autoPriorityEnabled,
    isDragging,
    isSubmitting,
    isLoading,
    autoRefreshEnabled,
    lastSyncedAt,
    errorMessage,
    selectedIds,
    selectedCount,
    lastSnapshot,
    activeTicket,
    notesByTicketId,
    visibleCountByStatus,
    canManageStatus,
    canDelete,
    hasDoneTickets,
    stats,
    debouncedQuery,
    todoTickets,
    inProgressTickets,
    doneTickets,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setSortMode,
    setTitle,
    setDescription,
    setPriority,
    setActiveTicketId,
    setNotesByTicketId,
    fetchTickets,
    onResetView,
    onQuickFilterStatus,
    onQuickFilterPriority,
    toggleAutoRefresh,
    handleSubmit,
    handleBatchMove,
    handleUndoBatch,
    handleDelete,
    handleClearDone,
    onDrop: handleDrop,
    onDragOver,
    onColumnScroll,
    onToggleSelect,
    onDragStart,
    onDragEnd,
  };
}

