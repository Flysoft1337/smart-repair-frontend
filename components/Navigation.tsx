"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ClipboardIcon, ChartBarIcon, CogIcon, KeyIcon, MenuIcon, XIcon } from '@/components/icons';
import { AUTH_EVENT, clearAuthProfile, refreshAuthFromServer, Role } from '@/lib/auth';
import { apiUrl } from '@/lib/api';

const navItems: Array<{ href: string; icon: React.ComponentType<{ className?: string }>; label: string; roles: Role[] }> = [
  { href: '/', icon: ClipboardIcon, label: '工单看板', roles: ['admin', 'worker', 'reporter'] },
  { href: '/worker', icon: ClipboardIcon, label: '维修工作台', roles: ['admin', 'worker'] },
  { href: '/dashboard', icon: ChartBarIcon, label: '数据大盘', roles: ['admin', 'worker'] },
  { href: '/audit', icon: ChartBarIcon, label: '操作审计', roles: ['admin'] },
  { href: '/settings', icon: CogIcon, label: '系统设置', roles: ['admin'] }
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState<string>('访客');

  useEffect(() => {
    const syncAuth = async () => {
      const snapshot = await refreshAuthFromServer();
      setRole(snapshot.role);
      setName(snapshot.name ?? '访客');
    };

    syncAuth();
    window.addEventListener(AUTH_EVENT, syncAuth);
    return () => window.removeEventListener(AUTH_EVENT, syncAuth);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(apiUrl('/api/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearAuthProfile();
      setRole(null);
      setName('访客');
      router.push('/login');
    }
  };

  // 防止 body 在移动端菜单打开时滚动
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header (Hidden on md) */}
      <div className="md:hidden flex items-center justify-between bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-indigo-500/50 shadow-lg text-xs">SR</div>
          <h1 className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-500">
            Repair Hub
          </h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-300 p-1 focus:outline-none">
          {isOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar (Fixed on mobile, Sticky on md) */}
      <aside className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        fixed md:sticky top-0 left-0 h-dvh w-64 border-r border-zinc-800 bg-zinc-950/95 md:bg-zinc-950 px-4 py-8 flex flex-col shrink-0 shadow-2xl md:shadow-lg z-40 md:z-20 backdrop-blur-xl md:backdrop-blur-none
      `}>
        {/* Desktop Logo */}
        <div className="hidden md:flex items-center gap-3 mb-10 px-2 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.5)]">SR</div>
          <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-500">
            Repair Hub
          </h1>
        </div>

        <nav className="flex-1 flex flex-col gap-3 mt-8 md:mt-0">
          {navItems.map((item) => {
            if (!role || !item.roles.includes(role)) {
              return null;
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium group ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 border border-transparent'
                }`}
              >
                <span className={`transition-all ${isActive ? 'opacity-100 scale-110 drop-shadow-md' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-zinc-800/80 pt-4 flex items-center gap-3 px-2">
          {role ? (
            <>
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex shrink-0 items-center justify-center text-zinc-400 border border-zinc-700 shadow-inner">
                <span className="text-sm font-bold">{role[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-zinc-200 truncate">{name}</p>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 truncate shrink-0">
                  <button type="button" onClick={handleLogout} className="hover:text-red-400 transition-colors">退出登录</button>
                </div>
              </div>
            </>
          ) : (
            <Link href="/login" className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 rounded-lg p-2 transition-colors border border-indigo-600/30">
              <KeyIcon className="w-4 h-4" />
              <span className="text-sm">登录管理模式</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
