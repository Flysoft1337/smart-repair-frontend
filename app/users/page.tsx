"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UsersCreateSection from '@/app/users/_components/UsersCreateSection';
import UsersImportSection from '@/app/users/_components/UsersImportSection';
import {
  createUser,
  deleteUser,
  fetchUsers,
  importUsersCsv,
  ImportUsersResponse,
  ManagedUser,
  ManagedUserRole,
  resetUserPassword,
  updateUser,
} from '@/lib/services';
import { ApiError } from '@/lib/api';
import { clearAuthProfile, redirectToLogin } from '@/lib/auth';
import { ROLE_LABEL, ROLE_OPTIONS } from '@/app/users/user-role';

type RoleFilter = 'all' | ManagedUserRole;

type DraftUser = {
  username: string;
  name: string;
  role: ManagedUserRole;
  password: string;
};

const EMPTY_DRAFT: DraftUser = {
  username: '',
  name: '',
  role: 'student',
  password: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [draft, setDraft] = useState<DraftUser>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<{ username: string; name: string; role: ManagedUserRole }>({
    username: '',
    name: '',
    role: 'student',
  });

  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<Pick<ImportUsersResponse, 'totalRows' | 'errors' | 'failedRows' | 'failed'> | null>(null);
  const [importing, setImporting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchRole, setBatchRole] = useState<ManagedUserRole>('student');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers({ q: query, role: roleFilter, page, limit });
      setUsers(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('加载用户列表失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter, page]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [query, roleFilter]);

  const createDisabled = useMemo(
    () => !draft.username.trim() || !draft.name.trim() || !draft.password.trim() || creating,
    [draft, creating]
  );

  const handleCreate = async () => {
    if (createDisabled) return;

    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      await createUser({
        username: draft.username.trim(),
        name: draft.name.trim(),
        password: draft.password,
        role: draft.role,
      });
      setDraft(EMPTY_DRAFT);
      setMessage('用户创建成功。');
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('创建失败：用户名可能已存在。');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user: ManagedUser) => {
    setEditingId(user.id);
    setEditingDraft({ username: user.username, name: user.name, role: user.role });
  };

  const handleUpdate = async (userId: number) => {
    setError(null);
    setMessage(null);
    try {
      await updateUser(userId, {
        username: editingDraft.username.trim(),
        name: editingDraft.name.trim(),
        role: editingDraft.role,
      });
      setEditingId(null);
      setMessage('用户信息已更新。');
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('更新失败，请检查输入内容。');
    }
  };

  const handleResetPassword = async (userId: number) => {
    const password = window.prompt('请输入新密码（至少 3 位）：');
    if (!password) return;

    setError(null);
    setMessage(null);
    try {
      await resetUserPassword(userId, password);
      setMessage('密码已重置。');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('重置密码失败。');
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!window.confirm(`确认删除用户 ${user.username} ?`)) return;

    setError(null);
    setMessage(null);
    try {
      await deleteUser(user.id);
      setMessage('用户已删除。');
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('删除失败：默认管理员或当前账号不可删除。');
    }
  };

  const handlePickCsv = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setImportPreview(null);
  };

  const handleDownloadFailed = () => {
    if (!importPreview?.failedRows) return;
    const blob = new Blob([importPreview.failedRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `failed-rows-${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runImport = async (mode: 'dry-run' | 'commit') => {
    if (!csvText.trim()) return;

    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await importUsersCsv(csvText, mode);
      setImportPreview({
        totalRows: result.totalRows,
        errors: result.errors,
        failedRows: result.failedRows,
        failed: result.failed,
      });

      if (mode === 'dry-run') {
        setMessage(result.errors.length ? '预检完成，存在格式或数据问题。' : '预检通过，可以执行导入。');
        return;
      }

      setMessage(`导入完成：新增 ${result.created ?? 0}，更新 ${result.updated ?? 0}${(result.failed ?? 0) > 0 ? `，失败 ${result.failed}` : ''}。`);
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError(mode === 'dry-run' ? '预检失败，请检查 CSV 内容。' : '导入失败，请稍后重试。');
    } finally {
      setImporting(false);
    }
  };

  const handleImportDryRun = async () => {
    await runImport('dry-run');
  };

  const handleImportCommit = async () => {
    await runImport('commit');
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length && users.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确认删除选中的 ${selectedIds.size} 个用户？`)) return;

    setError(null);
    setMessage(null);
    setLoading(true);
    let errorCount = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        await deleteUser(id);
      } catch {
        errorCount++;
      }
    }
    setMessage(`批量删除完成${errorCount > 0 ? `，其中 ${errorCount} 个不可删除` : ''}。`);
    setSelectedIds(new Set());
    await loadUsers();
  };

  const handleBatchSetRole = async () => {
    if (selectedIds.size === 0) return;
    const roleName = ROLE_LABEL[batchRole];
    if (!window.confirm(`确认将选中的 ${selectedIds.size} 个用户角色全部设为“${roleName}”？`)) return;

    setError(null);
    setMessage(null);
    setLoading(true);
    for (const id of Array.from(selectedIds)) {
      try {
        await updateUser(id, { role: batchRole });
      } catch {
        // ignore individual update errors in batch
      }
    }
    setMessage(`批量修改角色为“${roleName}”完成。`);
    setSelectedIds(new Set());
    await loadUsers();
  };

  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-6xl p-8 text-zinc-100">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">用户管理</h1>
          <p className="mt-2 text-sm text-zinc-500">新增、编辑、删除用户，并支持 CSV 批量导入（学生/院部管理/系部管理/总管理/维修人员）。</p>
        </header>

        {error && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {message && <div className="mb-4 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div>}

        <UsersCreateSection
          draft={draft}
          creating={creating}
          createDisabled={createDisabled}
          onDraftChange={setDraft}
          onCreate={() => void handleCreate()}
        />

        <UsersImportSection
          csvText={csvText}
          importing={importing}
          importPreview={importPreview}
          onCsvChange={setCsvText}
          onPickCsv={(file) => void handlePickCsv(file)}
          onDryRun={() => void handleImportDryRun()}
          onCommit={() => void handleImportCommit()}
          onDownloadFailed={handleDownloadFailed}
        />

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <Input placeholder="搜索账号/姓名" value={query} onChange={(e) => setQuery(e.target.value)} className="w-48 bg-zinc-950 border-zinc-700" />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
                <option value="all">全部角色</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-zinc-500 mr-2">共 {total} 条</span>
              {selectedIds.size > 0 && (
                <>
                  <span className="text-xs text-indigo-400 mr-1">已选 {selectedIds.size} 项</span>
                  <select value={batchRole} onChange={(e) => setBatchRole(e.target.value as ManagedUserRole)} className="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200">
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300" onClick={handleBatchSetRole} disabled={loading || importing}>批量改角色</Button>
                  <Button size="sm" variant="outline" className="border-red-700/40 bg-red-900/10 text-red-300 hover:bg-red-900/20" onClick={handleBatchDelete} disabled={loading || importing}>批量删除</Button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="py-2 pr-3 w-8">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-900"
                      checked={users.length > 0 && selectedIds.size === users.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-2 pr-3">账号</th>
                  <th className="py-2 pr-3">姓名</th>
                  <th className="py-2 pr-3">角色</th>
                  <th className="py-2 pr-3">创建时间</th>
                  <th className="py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-4 text-center text-zinc-500">加载中...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="py-4 text-center text-zinc-500">暂无用户</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-zinc-900/80 text-zinc-200">
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-900"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        {editingId === user.id ? (
                          <Input value={editingDraft.username} onChange={(e) => setEditingDraft((p) => ({ ...p, username: e.target.value }))} className="h-8 bg-zinc-950 border-zinc-700" />
                        ) : user.username}
                      </td>
                      <td className="py-2 pr-3">
                        {editingId === user.id ? (
                          <Input value={editingDraft.name} onChange={(e) => setEditingDraft((p) => ({ ...p, name: e.target.value }))} className="h-8 bg-zinc-950 border-zinc-700" />
                        ) : user.name}
                      </td>
                      <td className="py-2 pr-3">
                        {editingId === user.id ? (
                          <select value={editingDraft.role} onChange={(e) => setEditingDraft((p) => ({ ...p, role: e.target.value as ManagedUserRole }))} className="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs">
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        ) : ROLE_LABEL[user.role]}
                      </td>
                      <td className="py-2 pr-3 text-zinc-500">{new Date(user.createdAt).toLocaleString('zh-CN')}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          {editingId === user.id ? (
                            <>
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500" onClick={() => void handleUpdate(user.id)}>保存</Button>
                              <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" onClick={() => setEditingId(null)}>取消</Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" onClick={() => startEdit(user)}>编辑</Button>
                          )}
                          <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" onClick={() => void handleResetPassword(user.id)}>
                            重置密码
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-700/40 bg-red-900/10 text-red-300 hover:bg-red-900/20" onClick={() => void handleDelete(user)}>
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
            <span className="text-xs text-zinc-500">{page}/{totalPages}</span>
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>下一页</Button>
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}

