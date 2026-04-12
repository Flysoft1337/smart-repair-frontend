"use client";

import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { fetchPriorityMode, updatePriorityMode } from '@/lib/services';

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoPriorityEnabled, setAutoPriorityEnabled] = useState(false);
  const [isPriorityLoading, setIsPriorityLoading] = useState(true);
  const [savingMode, setSavingMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPriorityMode = async () => {
    setIsPriorityLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchPriorityMode();
      setAutoPriorityEnabled(Boolean(data.autoPriorityEnabled));
    } catch {
      setAutoPriorityEnabled(false);
      setErrorMessage('加载优先级设置失败，请稍后重试。');
    } finally {
      setIsPriorityLoading(false);
    }
  };

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
    void loadPriorityMode();
  }, []);

  const handleToggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('sr_notifications', JSON.stringify(newState));
    setSuccessMessage(`通知提醒已${newState ? '开启' : '关闭'}。`);
  };

  const handleTogglePriorityMode = async () => {
    const previousValue = autoPriorityEnabled;
    const nextValue = !autoPriorityEnabled;
    setAutoPriorityEnabled(nextValue);
    setSavingMode(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await updatePriorityMode(nextValue);

      setAutoPriorityEnabled(Boolean(data.autoPriorityEnabled));
      setSuccessMessage(`自动优先级判定已${Boolean(data.autoPriorityEnabled) ? '开启' : '关闭'}。`);
    } catch {
      setAutoPriorityEnabled(previousValue);
      setErrorMessage('保存失败：自动优先级设置未生效。');
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
          {errorMessage && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
              <span>{errorMessage}</span>
              <button
                type="button"
                className="rounded border border-amber-400/30 px-2 py-1 text-xs hover:bg-amber-500/15"
                onClick={() => void loadPriorityMode()}
              >
                重试
              </button>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              {successMessage}
            </div>
          )}

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
                <button
                  type="button"
                  aria-pressed={notificationsEnabled}
                  onClick={handleToggleNotifications}
                  className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${
                    notificationsEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
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
                disabled={savingMode || isPriorityLoading}
                className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${
                  autoPriorityEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                } ${savingMode || isPriorityLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                title={autoPriorityEnabled ? '当前: 自动' : '当前: 手动'}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${
                    autoPriorityEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {isPriorityLoading && <p className="mt-3 text-xs text-zinc-500">正在加载当前优先级策略...</p>}
            {savingMode && <p className="mt-3 text-xs text-indigo-300">正在保存设置...</p>}
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}
