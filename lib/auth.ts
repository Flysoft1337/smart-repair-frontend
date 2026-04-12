import { apiUrl } from '@/lib/api';

export const AUTH_EVENT = 'auth_changed';

export type Role = 'admin' | 'worker' | 'reporter';

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
    isAdmin: role === 'admin',
    isWorker: role === 'worker',
    isReporter: role === 'reporter',
  };
}

export function saveAuthProfile(role: Role, name: string) {
  writeAuthProfile(role, name);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthProfile() {
  clearAuthProfileLocal();
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function refreshAuthFromServer() {
  try {
    const response = await fetch(apiUrl('/api/me'), {
      credentials: 'include',
    });

    if (!response.ok) {
      clearAuthProfileLocal();
      return getAuthSnapshot();
    }

    const data = await response.json();
    // Refresh local snapshot without dispatch to avoid listener loops.
    writeAuthProfile(data.role, data.name);
    return getAuthSnapshot();
  } catch {
    clearAuthProfileLocal();
    return getAuthSnapshot();
  }
}

export const withAuthFetch: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};
