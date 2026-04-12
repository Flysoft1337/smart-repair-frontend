"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveAuthProfile } from '@/lib/auth';
import { apiUrl } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('reporter');
  const [password, setPassword] = useState('reporter123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        saveAuthProfile(data.role, data.name);
        router.push('/');
      } else {
        const errData = await res.json();
        setError(errData.error || '登录失败');
      }
    } catch {
      setError('系统离线或网络错误');
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
          <p className="text-sm text-zinc-400 mt-2">admin / worker / reporter 三种角色</p>
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

          <p className="text-[11px] text-zinc-500">示例: admin/admin123, worker/worker123, reporter/reporter123</p>

          {error && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{error}</div>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
          >
            {loading ? '验证中...' : '登录系统'}
          </Button>
        </form>
      </div>
    </div>
  );
}
