"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Role, refreshAuthFromServer, saveAuthProfile } from '@/lib/auth';
import { apiJson } from '@/lib/api';
import { useEffect } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const autoEnter = async () => {
      const snapshot = await refreshAuthFromServer();
      if (snapshot.isAuthenticated && snapshot.role) {
        window.location.replace('/');
      }
    };
    void autoEnter();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码。');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await apiJson<{ role: Role; name: string }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      saveAuthProfile(data.role, data.name);
      window.location.replace('/');
    } catch (error) {
      setError(error instanceof Error ? error.message || '登录失败' : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 w-full h-dvh">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] mb-4 text-xl">
            SR
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-100">账号登录</h1>
          <p className="text-sm text-zinc-400 mt-2">学生 / 维修人员 / 系部管理 / 院部管理 / 总管理</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">账号</label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">密码</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-zinc-100"
            />
          </div>

          <p className="text-[11px] text-zinc-500">示例: student/student123, worker/worker123, department/department123, college/college123, admin/admin123</p>

          {error && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{error}</div>}

          <Button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
          >
            {loading ? '验证中...' : '登录系统'}
          </Button>
        </form>
      </div>
    </div>
  );
}
