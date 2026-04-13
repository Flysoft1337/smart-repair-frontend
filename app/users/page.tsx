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
  fetchOrgTree,
  fetchUsers,
  importUsersCsv,
  ImportUsersResponse,
  ManagedUser,
  ManagedUserRole,
  OrgCollege,
  OrgDepartment,
  resetUserPassword,
  updateUser,
} from '@/lib/services';
import { ApiError } from '@/lib/api';
import { clearAuthProfile, getAuthSnapshot, redirectToLogin, refreshAuthFromServer, Role } from '@/lib/auth';
import { ROLE_LABEL, ROLE_OPTIONS } from '@/app/users/user-role';

type RoleFilter = 'all' | ManagedUserRole;
type OrgFilter = 'all' | number;

type DraftUser = {
  username: string;
  name: string;
  role: ManagedUserRole;
  password: string;
  collegeId: number | null;
  departmentId: number | null;
};

type EditDraft = {
  username: string;
  name: string;
  role: ManagedUserRole;
  collegeId: number | null;
  departmentId: number | null;
};

const ORG_TREE_EXPANDED_KEY = 'sr_users_org_tree_expanded';

const EMPTY_DRAFT: DraftUser = {
  username: '',
  name: '',
  role: 'student',
  password: '',
  collegeId: null,
  departmentId: null,
};

const requiresCollege = (role: ManagedUserRole) =>
  role === 'college-admin' || role === 'department-admin' || role === 'student';

const requiresDepartment = (role: ManagedUserRole) =>
  role === 'department-admin' || role === 'student';

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [collegeFilter, setCollegeFilter] = useState<OrgFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState<OrgFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [myRole, setMyRole] = useState<Role | null>(null);
  const [myCollegeId, setMyCollegeId] = useState<number | null>(null);
  const [myDepartmentId, setMyDepartmentId] = useState<number | null>(null);
  const [colleges, setColleges] = useState<OrgCollege[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [orgTreeQueryInput, setOrgTreeQueryInput] = useState('');
  const [orgTreeQuery, setOrgTreeQuery] = useState('');
  const [expandedCollegeIds, setExpandedCollegeIds] = useState<Set<number>>(new Set());

  const [draft, setDraft] = useState<DraftUser>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<EditDraft>({
    username: '',
    name: '',
    role: 'student',
    collegeId: null,
    departmentId: null,
  });

  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<Pick<ImportUsersResponse, 'totalRows' | 'errors' | 'failedRows' | 'failed'> | null>(null);
  const [importing, setImporting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchRole, setBatchRole] = useState<ManagedUserRole>('student');

  const roleOptions = useMemo(() => {
    if (myRole === 'super-admin') return ROLE_OPTIONS;
    if (myRole === 'college-admin') return ROLE_OPTIONS.filter((item) => item.value === 'department-admin' || item.value === 'student' || item.value === 'maintainer');
    if (myRole === 'department-admin') return ROLE_OPTIONS.filter((item) => item.value === 'student');
    return [];
  }, [myRole]);

  const scopedDepartmentsForFilter = useMemo(() => {
    if (collegeFilter === 'all') return departments;
    return departments.filter((department) => department.collegeId === collegeFilter);
  }, [collegeFilter, departments]);

  const loadMeta = useCallback(async () => {
    try {
      await refreshAuthFromServer();
      const snapshot = getAuthSnapshot();
      setMyRole(snapshot.role);
      setMyCollegeId(snapshot.collegeId);
      setMyDepartmentId(snapshot.departmentId);

      const org = await fetchOrgTree({ q: orgTreeQuery });
      const flatDepartments = org.colleges.flatMap((college) =>
        college.departments.map((department) => ({
          id: department.id,
          name: department.name,
          code: department.code,
          collegeId: department.collegeId,
          userCount: department.userCount,
        }))
      );
      setColleges(
        org.colleges.map((college) => ({
          id: college.id,
          name: college.name,
          code: college.code,
          userCount: college.userCount,
          departmentCount: college.departmentCount,
        }))
      );
      setDepartments(flatDepartments);
      setExpandedCollegeIds((prev) => {
        if (prev.size > 0) return prev;
        return new Set(org.colleges.slice(0, 2).map((college) => college.id));
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('加载组织信息失败，请刷新重试。');
    }
  }, [orgTreeQuery]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORG_TREE_EXPANDED_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as number[];
      if (!Array.isArray(parsed)) return;
      setExpandedCollegeIds(new Set(parsed.filter((item) => Number.isFinite(item))));
    } catch {
      // Ignore invalid local cache.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ORG_TREE_EXPANDED_KEY, JSON.stringify(Array.from(expandedCollegeIds)));
  }, [expandedCollegeIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => setOrgTreeQuery(orgTreeQueryInput.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [orgTreeQueryInput]);

  useEffect(() => {
    setDraft((prev) => {
      const next = { ...prev };
      if ((myRole === 'college-admin' || myRole === 'department-admin') && myCollegeId) next.collegeId = myCollegeId;
      if (myRole === 'department-admin' && myDepartmentId) next.departmentId = myDepartmentId;
      if (roleOptions.length > 0 && !roleOptions.some((option) => option.value === next.role)) {
        next.role = roleOptions[0].value;
      }
      return next;
    });
  }, [myRole, myCollegeId, myDepartmentId, roleOptions]);

  useEffect(() => {
    if (roleOptions.length === 0) return;
    if (!roleOptions.some((option) => option.value === batchRole)) {
      setBatchRole(roleOptions[0].value);
    }
  }, [roleOptions, batchRole]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers({
        q: query,
        role: roleFilter,
        collegeId: collegeFilter === 'all' ? undefined : collegeFilter,
        departmentId: departmentFilter === 'all' ? undefined : departmentFilter,
        page,
        limit,
      });
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
  }, [query, roleFilter, collegeFilter, departmentFilter, page]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [query, roleFilter, collegeFilter, departmentFilter]);

  useEffect(() => {
    if (collegeFilter === 'all') return;
    const currentDepartmentValid = departmentFilter !== 'all' && scopedDepartmentsForFilter.some((item) => item.id === departmentFilter);
    if (!currentDepartmentValid) setDepartmentFilter('all');
  }, [collegeFilter, departmentFilter, scopedDepartmentsForFilter]);

  const createDisabled = useMemo(() => {
    if (!draft.username.trim() || !draft.name.trim() || !draft.password.trim() || creating) return true;
    if (requiresCollege(draft.role) && !draft.collegeId) return true;
    return requiresDepartment(draft.role) && !draft.departmentId;
  }, [draft, creating]);

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
        ...(draft.collegeId ? { collegeId: draft.collegeId } : {}),
        ...(draft.departmentId ? { departmentId: draft.departmentId } : {}),
      });
      setDraft({
        ...EMPTY_DRAFT,
        role: roleOptions[0]?.value ?? 'student',
        collegeId: myRole === 'college-admin' || myRole === 'department-admin' ? myCollegeId : null,
        departmentId: myRole === 'department-admin' ? myDepartmentId : null,
      });
      setMessage('用户创建成功。');
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthProfile();
        redirectToLogin();
        return;
      }
      setError('创建失败：请检查角色与院系归属是否符合权限范围。');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user: ManagedUser) => {
    setEditingId(user.id);
    setEditingDraft({
      username: user.username,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId,
      departmentId: user.departmentId,
    });
  };

  const handleUpdate = async (userId: number) => {
    setError(null);
    setMessage(null);
    try {
      await updateUser(userId, {
        username: editingDraft.username.trim(),
        name: editingDraft.name.trim(),
        role: editingDraft.role,
        collegeId: requiresCollege(editingDraft.role) ? editingDraft.collegeId : null,
        departmentId: requiresDepartment(editingDraft.role) ? editingDraft.departmentId : null,
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
      setError('更新失败，请检查院系归属和角色权限。');
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
      setError('删除失败：无权限或目标账号不可删除。');
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
        setMessage(result.errors.length ? '预检完成，存在格式或权限问题。' : '预检通过，可以执行导入。');
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

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length && users.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map((user) => user.id)));
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
        errorCount += 1;
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
        // Ignore row-level failures, backend validates scope.
      }
    }
    setMessage(`批量修改角色为“${roleName}”完成。`);
    setSelectedIds(new Set());
    await loadUsers();
  };

  const usersByCollege = useMemo(() => {
    const map = new Map<number, ManagedUser[]>();
    for (const user of users) {
      if (user.collegeId == null) continue;
      const list = map.get(user.collegeId) ?? [];
      list.push(user);
      map.set(user.collegeId, list);
    }
    return map;
  }, [users]);

  const usersByDepartment = useMemo(() => {
    const map = new Map<number, ManagedUser[]>();
    for (const user of users) {
      if (user.departmentId == null) continue;
      const list = map.get(user.departmentId) ?? [];
      list.push(user);
      map.set(user.departmentId, list);
    }
    return map;
  }, [users]);

  const maintainerUsers = useMemo(() => users.filter((user) => user.role === 'maintainer'), [users]);

  const applyCollegeFilter = (collegeId: number | 'all') => {
    setCollegeFilter(collegeId === 'all' ? 'all' : collegeId);
    setDepartmentFilter('all');
    setPage(1);
  };

  const applyDepartmentFilter = (collegeId: number, departmentId: number) => {
    setCollegeFilter(collegeId);
    setDepartmentFilter(departmentId);
    setPage(1);
  };

  const toggleCollegeExpand = (collegeId: number) => {
    setExpandedCollegeIds((prev) => {
      const next = new Set(prev);
      if (next.has(collegeId)) next.delete(collegeId);
      else next.add(collegeId);
      return next;
    });
  };

  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-7xl p-8 text-zinc-100">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold">用户管理</h1>
          <p className="mt-2 text-sm text-zinc-500">支持院部/系部层级管理、院系归属、CSV 批量导入。</p>
        </header>

        {error && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {message && <div className="mb-4 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div>}

        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">组织树</h2>
              <p className="mt-1 text-xs text-zinc-500">院部 {'>'} 系部 {'>'} 用户 的文件夹式浏览方式</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={orgTreeQueryInput}
                onChange={(e) => setOrgTreeQueryInput(e.target.value)}
                placeholder="搜索院部/系部"
                className="h-8 w-44 border-zinc-700 bg-zinc-950 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-300"
                onClick={() => {
                  applyCollegeFilter('all');
                  setRoleFilter('all');
                }}
              >
                查看全部
              </Button>
            </div>
          </div>

          <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-500">
            当前筛选：
            <span className="ml-2 text-zinc-300">
              {collegeFilter === 'all' ? '全部院部' : colleges.find((college) => college.id === collegeFilter)?.name ?? '未知院部'}
            </span>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-zinc-300">
              {departmentFilter === 'all' ? '全部系部' : departments.find((department) => department.id === departmentFilter)?.name ?? '未知系部'}
            </span>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-zinc-300">
              {roleFilter === 'all' ? '全部角色' : ROLE_LABEL[roleFilter]}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {colleges.map((college) => {
              const collegeUsers = usersByCollege.get(college.id) ?? [];
              const collegeDepartments = departments.filter((department) => department.collegeId === college.id);
              const activeCollege = collegeFilter === college.id;
              const isExpanded = expandedCollegeIds.has(college.id) || activeCollege;
              const collegeUserCount = college.userCount ?? collegeUsers.length;
              const collegeDepartmentCount = college.departmentCount ?? collegeDepartments.length;
              return (
                <div
                  key={college.id}
                  className={`group rounded-lg border bg-zinc-950/70 p-3 transition-colors ${
                    activeCollege ? 'border-indigo-500/40 ring-1 ring-indigo-500/15' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className={`flex-1 rounded-md px-1 py-0.5 text-left transition-colors ${
                        activeCollege ? 'bg-indigo-500/10' : 'hover:bg-zinc-900'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        applyCollegeFilter(college.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100">{college.name}</span>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{college.code}</span>
                        {activeCollege && <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-200">已选中</span>}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{collegeUserCount} 名用户，{collegeDepartmentCount} 个系部</p>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                        onClick={() => toggleCollegeExpand(college.id)}
                      >
                        {isExpanded ? '收起' : '展开'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                        onClick={() => applyCollegeFilter(college.id)}
                      >
                        聚焦
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-l border-zinc-800 pl-3">
                      {collegeDepartments.length > 0 ? (
                        collegeDepartments.map((department) => {
                          const departmentUsers = usersByDepartment.get(department.id) ?? [];
                          const activeDepartment = collegeFilter === college.id && departmentFilter === department.id;
                          const departmentUserCount = department.userCount ?? departmentUsers.length;
                          return (
                            <div
                              key={department.id}
                              className={`rounded-md border p-2 transition-colors ${
                                activeDepartment ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-zinc-800/70 bg-zinc-900/60'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  className={`flex-1 rounded-md px-1 py-0.5 text-left transition-colors ${
                                    activeDepartment ? 'bg-emerald-500/10' : 'hover:bg-zinc-800/60'
                                  }`}
                                  onClick={() => applyDepartmentFilter(college.id, department.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-zinc-200">{department.name}</p>
                                    {activeDepartment && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">已选中</span>}
                                  </div>
                                  <p className="mt-0.5 text-[11px] text-zinc-500">{departmentUserCount} 名用户</p>
                                </button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                  onClick={() => applyDepartmentFilter(college.id, department.id)}
                                >
                                  进入
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-zinc-500">暂无系部</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setCollegeFilter('all');
                  setDepartmentFilter('all');
                  setRoleFilter('maintainer');
                  setPage(1);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100">维修人员</span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{maintainerUsers.length}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">独立列表，不归属院系树层级</p>
              </button>
            </div>
          </div>
        </section>

        <UsersCreateSection
          draft={draft}
          creating={creating}
          createDisabled={createDisabled}
          colleges={colleges}
          departments={departments}
          roleOptions={roleOptions}
          onDraftChange={setDraft}
          onCreate={() => void handleCreate()}
        />

        <UsersImportSection
          csvText={csvText}
          importing={importing}
          importPreview={importPreview}
          onCsvChange={setCsvText}
          onPickCsv={(file) => void handlePickCsv(file)}
          onDryRun={() => void runImport('dry-run')}
          onCommit={() => void runImport('commit')}
          onDownloadFailed={handleDownloadFailed}
        />

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="搜索账号/姓名"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-52 border-zinc-700 bg-zinc-950"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"
              >
                <option value="all">全部角色</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={collegeFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setCollegeFilter(value === 'all' ? 'all' : Number(value));
                  setDepartmentFilter('all');
                }}
                className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"
              >
                <option value="all">全部院部</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>{college.name}</option>
                ))}
              </select>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setDepartmentFilter(value === 'all' ? 'all' : Number(value));
                }}
                className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"
              >
                <option value="all">全部系部</option>
                {scopedDepartmentsForFilter.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-xs text-zinc-500">共 {total} 条</span>
              {selectedIds.size > 0 && (
                <>
                  <span className="mr-1 text-xs text-indigo-400">已选 {selectedIds.size} 项</span>
                  <select
                    value={batchRole}
                    onChange={(e) => setBatchRole(e.target.value as ManagedUserRole)}
                    className="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200"
                  >
                    {roleOptions.map((option) => (
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
                  <th className="w-8 py-2 pr-3">
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
                  <th className="py-2 pr-3">院部</th>
                  <th className="py-2 pr-3">系部</th>
                  <th className="py-2 pr-3">创建时间</th>
                  <th className="py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-4 text-center text-zinc-500">加载中...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={8} className="py-4 text-center text-zinc-500">暂无用户</td></tr>
                ) : (
                  users.map((user) => {
                    const editDepartments = editingDraft.collegeId
                      ? departments.filter((department) => department.collegeId === editingDraft.collegeId)
                      : departments;

                    return (
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
                            <Input value={editingDraft.username} onChange={(e) => setEditingDraft((prev) => ({ ...prev, username: e.target.value }))} className="h-8 border-zinc-700 bg-zinc-950" />
                          ) : user.username}
                        </td>
                        <td className="py-2 pr-3">
                          {editingId === user.id ? (
                            <Input value={editingDraft.name} onChange={(e) => setEditingDraft((prev) => ({ ...prev, name: e.target.value }))} className="h-8 border-zinc-700 bg-zinc-950" />
                          ) : user.name}
                        </td>
                        <td className="py-2 pr-3">
                          {editingId === user.id ? (
                            <select
                              value={editingDraft.role}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, role: e.target.value as ManagedUserRole }))}
                              className="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs"
                            >
                              {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          ) : ROLE_LABEL[user.role]}
                        </td>
                        <td className="py-2 pr-3">
                          {editingId === user.id ? (
                            <select
                              value={editingDraft.collegeId ?? ''}
                              onChange={(e) => {
                                const value = e.target.value ? Number(e.target.value) : null;
                                setEditingDraft((prev) => ({ ...prev, collegeId: value, departmentId: null }));
                              }}
                              className="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs"
                            >
                              <option value="">未设置</option>
                              {colleges.map((college) => (
                                <option key={college.id} value={college.id}>{college.name}</option>
                              ))}
                            </select>
                          ) : (user.college?.name ?? '-')}
                        </td>
                        <td className="py-2 pr-3">
                          {editingId === user.id ? (
                            <select
                              value={editingDraft.departmentId ?? ''}
                              onChange={(e) => setEditingDraft((prev) => ({ ...prev, departmentId: e.target.value ? Number(e.target.value) : null }))}
                              className="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs"
                            >
                              <option value="">未设置</option>
                              {editDepartments.map((department) => (
                                <option key={department.id} value={department.id}>{department.name}</option>
                              ))}
                            </select>
                          ) : (user.department?.name ?? '-')}
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
                            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" onClick={() => void handleResetPassword(user.id)}>重置密码</Button>
                            <Button size="sm" variant="outline" className="border-red-700/40 bg-red-900/10 text-red-300 hover:bg-red-900/20" onClick={() => void handleDelete(user)}>删除</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" disabled={page <= 1 || loading} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>上一页</Button>
            <span className="text-xs text-zinc-500">{page}/{totalPages}</span>
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300" disabled={page >= totalPages || loading} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>下一页</Button>
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}

