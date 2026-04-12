"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ClipboardIcon, ChartBarIcon, CogIcon, KeyIcon, MenuIcon, XIcon } from '@/components/icons';
import { AUTH_EVENT, clearAuthProfile, redirectToLogin, refreshAuthFromServer, Role } from '@/lib/auth';
import { apiJson } from '@/lib/api';

const navItems: Array<{ href: string; icon: React.ComponentType<{ className?: string }>; label: string; roles: Role[] }> = [
  { href: '/', icon: ClipboardIcon, label: '工单看板', roles: ['admin', 'worker', 'reporter'] },
  { href: '/worker', icon: ClipboardIcon, label: '维修工作台', roles: ['admin', 'worker'] },
  { href: '/dashboard', icon: ChartBarIcon, label: '数据大盘', roles: ['admin', 'worker'] },
  { href: '/audit', icon: ChartBarIcon, label: '操作审计', roles: ['admin'] },
  { href: '/settings', icon: CogIcon, label: '系统设置', roles: ['admin'] },
];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

function NavigationContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('访客');
  const [pendingGo, setPendingGo] = useState(false);
  const [shortcutHint, setShortcutHint] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  const showShortcutHint = (message: string) => {
    setShortcutHint(message);
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
    }
    hintTimerRef.current = window.setTimeout(() => setShortcutHint(null), 1400);
  };

  useEffect(() => {
    const syncAuth = async () => {
      const snapshot = await refreshAuthFromServer();
      setRole(snapshot.role);
      setName(snapshot.name ?? '访客');
    };

    void syncAuth();
    window.addEventListener(AUTH_EVENT, syncAuth);
    return () => window.removeEventListener(AUTH_EVENT, syncAuth);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        setPendingGo(false);
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'g') {
        setPendingGo(true);
        window.setTimeout(() => setPendingGo(false), 900);
        return;
      }

      if (!pendingGo) return;

      const targetHref =
        key === 'd' ? '/dashboard' :
        key === 'w' ? '/worker' :
        key === 's' ? '/settings' :
        null;

      if (targetHref) {
        const target = navItems.find((item) => item.href === targetHref);
        if (target && role && target.roles.includes(role)) {
          event.preventDefault();
          router.push(targetHref);
        } else if (target) {
          event.preventDefault();
          showShortcutHint(`当前账号无权限访问: ${target.label}`);
        }
      }
      setPendingGo(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, [pendingGo, role, router]);

  const handleLogout = async () => {
    try {
      await apiJson('/api/logout', { method: 'POST' });
    } finally {
      clearAuthProfile();
      setRole(null);
      setName('访客');
      redirectToLogin(true);
    }
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/50">SR</div>
          <h1 className="bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">Repair Hub</h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 text-zinc-300 focus:outline-none">
          {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      <aside
        className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed top-0 left-0 z-40 flex h-dvh w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/95 px-4 py-8 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out md:sticky md:z-20 md:translate-x-0 md:bg-zinc-950 md:shadow-lg md:backdrop-blur-none
        `}
      >
        <div className="mb-10 hidden cursor-default items-center gap-3 px-2 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] shadow-indigo-500/50">SR</div>
          <h1 className="bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">Repair Hub</h1>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-3 md:mt-0">
          {navItems.map((item) => {
            if (!role || !item.roles.includes(role)) return null;

            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 font-medium transition-colors ${
                  isActive
                    ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                }`}
              >
                <span className={`transition-all ${isActive ? 'scale-110 opacity-100 drop-shadow-md' : 'opacity-70 group-hover:scale-110 group-hover:opacity-100'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
              </Link>
            );
          })}
        </nav>

        <p className="mb-4 mt-2 px-2 text-[10px] text-zinc-600">导航快捷键: g+d / g+w / g+s</p>

        <div className="mt-auto flex items-center gap-3 border-t border-zinc-800/80 px-2 pt-4">
          {role ? (
            <>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 shadow-inner">
                <span className="text-sm font-bold">{role[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-zinc-200">{name}</p>
                <div className="mt-0.5 shrink-0 truncate text-[10px] uppercase tracking-widest text-zinc-500">
                  <button type="button" onClick={handleLogout} className="transition-colors hover:text-red-400">退出登录</button>
                </div>
              </div>
            </>
          ) : (
            <Link href="/login" className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-600/30 bg-indigo-600/20 p-2 text-indigo-400 transition-colors hover:bg-indigo-600/40">
              <KeyIcon className="h-4 w-4" />
              <span className="text-sm">登录管理模式</span>
            </Link>
          )}
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {shortcutHint && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 shadow-lg backdrop-blur-sm">
          {shortcutHint}
        </div>
      )}
    </>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return <NavigationContent />;
}

