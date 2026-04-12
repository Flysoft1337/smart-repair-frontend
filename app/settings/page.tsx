"use client";

import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { apiUrl } from '@/lib/api';
import { withAuthFetch } from '@/lib/auth';

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoPriorityEnabled, setAutoPriorityEnabled] = useState(false);
  const [savingMode, setSavingMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sr_notifications');
    if (!saved) return;

    let parsed = false;
    try {
      parsed = JSON.parse(saved);
    } catch {
      parsed = false;
    }

    const rafId = window.requestAnimationFrame(() => {
      setNotificationsEnabled(parsed);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const response = await fetch(apiUrl('/api/settings/priority-mode'), { credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();
        setAutoPriorityEnabled(Boolean(data.autoPriorityEnabled));
      } catch {
        setAutoPriorityEnabled(false);
      }
    };

    void fetchMode();
  }, []);

  const handleToggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('sr_notifications', JSON.stringify(newState));
  };

  const handleTogglePriorityMode = async () => {
    const nextValue = !autoPriorityEnabled;
    setSavingMode(true);

    try {
      const response = await fetch(apiUrl('/api/settings/priority-mode'), {
        method: 'PATCH',
        ...withAuthFetch,
        body: JSON.stringify({ autoPriorityEnabled: nextValue }),
      });

      if (!response.ok) return;
      setAutoPriorityEnabled(nextValue);
    } finally {
      setSavingMode(false);
    }
  };

  return (
    <AdminGuard>
      <div className="p-8 font-sans w-full max-w-4xl mx-auto h-full text-zinc-100 flex flex-col">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold mb-2">系统设置</h1>
          <p className="text-zinc-500 text-sm">参数维护与本地权限管理</p>
        </header>

        <section className="flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-zinc-300 mb-4 border-b border-zinc-800 pb-2">偏好设定</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">全局深色模式</p>
                  <p className="text-xs text-zinc-500">启用极客黑配色 (系统强制锁定)</p>
                </div>
                <div className="w-12 h-6 bg-indigo-600/50 rounded-full flex items-center p-1 cursor-not-allowed opacity-70">
                  <div className="bg-white w-4 h-4 rounded-full translate-x-6"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-200">邮件/弹窗通知提醒</p>
                  <p className="text-xs text-zinc-500">接收关于紧急工单分配与完成的消息</p>
                </div>
                <div
                  onClick={handleToggleNotifications}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${
                    notificationsEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-zinc-300 mb-4 border-b border-zinc-800 pb-2">工单优先级规则</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-200">自动优先级判定</p>
                <p className="text-xs text-zinc-500">开启后将根据故障关键词自动给出紧急/普通优先级</p>
              </div>
              <button
                type="button"
                onClick={handleTogglePriorityMode}
                disabled={savingMode}
                className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${
                  autoPriorityEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                } ${savingMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                title={autoPriorityEnabled ? '当前: 自动' : '当前: 手动'}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${
                    autoPriorityEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}
