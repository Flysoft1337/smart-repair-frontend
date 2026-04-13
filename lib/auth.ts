import { apiJson } from '@/lib/api';

export const AUTH_EVENT = 'auth_changed';
const LOGIN_REDIRECT_KEY = 'sr_login_redirecting';

export type Role = 'student' | 'department-admin' | 'college-admin' | 'super-admin' | 'maintainer';

export interface AuthSnapshot {
  role: Role | null;
  name: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  isReporter: boolean;
}

const ROLE_KEY = 'sr_role';
const NAME_KEY = 'sr_name';

function writeAuthProfile(role: Role, name: string) {
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(NAME_KEY, name);
}

function clearAuthProfileLocal() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
}

function clearLoginRedirectLock() {
  sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
}

export function getAuthSnapshot(): AuthSnapshot {
  if (typeof window === 'undefined') {
    return {
      role: null,
      name: null,
      isAuthenticated: false,
      isAdmin: false,
      isWorker: false,
      isReporter: false,
    };
  }

  const role = localStorage.getItem(ROLE_KEY) as Role | null;
  const name = localStorage.getItem(NAME_KEY);

  return {
    role,
    name,
    isAuthenticated: Boolean(role),
    isAdmin: role === 'super-admin' || role === 'college-admin',
    isWorker: role === 'maintainer',
    isReporter: role === 'student',
  };
}

export function saveAuthProfile(role: Role, name: string) {
  writeAuthProfile(role, name);
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
    const data = await apiJson<{ role: Role; name: string }>('/api/me');
    // Refresh local snapshot without dispatch to avoid listener loops.
    writeAuthProfile(data.role, data.name);
    clearLoginRedirectLock();
    return getAuthSnapshot();
  } catch {
    clearAuthProfileLocal();
    return getAuthSnapshot();
  }
}

