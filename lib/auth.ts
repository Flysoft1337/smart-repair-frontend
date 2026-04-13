import { apiJson } from '@/lib/api';

export const AUTH_EVENT = 'auth_changed';
const LOGIN_REDIRECT_KEY = 'sr_login_redirecting';

export type Role = 'student' | 'department-admin' | 'college-admin' | 'super-admin' | 'maintainer';

export interface AuthSnapshot {
  role: Role | null;
  name: string | null;
  collegeId: number | null;
  departmentId: number | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  isReporter: boolean;
}

const ROLE_KEY = 'sr_role';
const NAME_KEY = 'sr_name';
const COLLEGE_ID_KEY = 'sr_college_id';
const DEPARTMENT_ID_KEY = 'sr_department_id';

function writeAuthProfile(role: Role, name: string, collegeId: number | null = null, departmentId: number | null = null) {
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(NAME_KEY, name);
  if (collegeId === null) localStorage.removeItem(COLLEGE_ID_KEY);
  else localStorage.setItem(COLLEGE_ID_KEY, String(collegeId));
  if (departmentId === null) localStorage.removeItem(DEPARTMENT_ID_KEY);
  else localStorage.setItem(DEPARTMENT_ID_KEY, String(departmentId));
}

function clearAuthProfileLocal() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(COLLEGE_ID_KEY);
  localStorage.removeItem(DEPARTMENT_ID_KEY);
}

function clearLoginRedirectLock() {
  sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
}

export function getAuthSnapshot(): AuthSnapshot {
  if (typeof window === 'undefined') {
    return {
      role: null,
      name: null,
      collegeId: null,
      departmentId: null,
      isAuthenticated: false,
      isAdmin: false,
      isWorker: false,
      isReporter: false,
    };
  }

  const role = localStorage.getItem(ROLE_KEY) as Role | null;
  const name = localStorage.getItem(NAME_KEY);
  const collegeIdRaw = localStorage.getItem(COLLEGE_ID_KEY);
  const departmentIdRaw = localStorage.getItem(DEPARTMENT_ID_KEY);
  const collegeId = collegeIdRaw ? Number(collegeIdRaw) : null;
  const departmentId = departmentIdRaw ? Number(departmentIdRaw) : null;

  return {
    role,
    name,
    collegeId: Number.isFinite(collegeId) ? collegeId : null,
    departmentId: Number.isFinite(departmentId) ? departmentId : null,
    isAuthenticated: Boolean(role),
    isAdmin: role === 'super-admin' || role === 'college-admin',
    isWorker: role === 'maintainer',
    isReporter: role === 'student',
  };
}

export function saveAuthProfile(role: Role, name: string, collegeId: number | null = null, departmentId: number | null = null) {
  writeAuthProfile(role, name, collegeId, departmentId);
  clearLoginRedirectLock();
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthProfile() {
  clearAuthProfileLocal();
  clearLoginRedirectLock();
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function redirectToLogin(force = false) {
  if (typeof window === 'undefined') return;

  if (window.location.pathname === '/login') return;
  if (!force && sessionStorage.getItem(LOGIN_REDIRECT_KEY) === '1') return;

  sessionStorage.setItem(LOGIN_REDIRECT_KEY, '1');
  window.location.replace('/login');
}

export async function refreshAuthFromServer() {
  try {
    const data = await apiJson<{ role: Role; name: string; collegeId?: number | null; departmentId?: number | null }>('/api/me');
    // Refresh local snapshot without dispatch to avoid listener loops.
    writeAuthProfile(data.role, data.name, data.collegeId ?? null, data.departmentId ?? null);
    clearLoginRedirectLock();
    return getAuthSnapshot();
  } catch {
    clearAuthProfileLocal();
    return getAuthSnapshot();
  }
}

