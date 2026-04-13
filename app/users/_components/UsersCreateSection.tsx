import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ManagedUserRole } from '@/lib/services';
import { ROLE_OPTIONS } from '@/app/users/user-role';

type DraftUser = {
  username: string;
  name: string;
  role: ManagedUserRole;
  password: string;
};

type UsersCreateSectionProps = {
  draft: DraftUser;
  creating: boolean;
  createDisabled: boolean;
  onDraftChange: (next: DraftUser) => void;
  onCreate: () => void;
};

export default function UsersCreateSection({
  draft,
  creating,
  createDisabled,
  onDraftChange,
  onCreate,
}: UsersCreateSectionProps) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-300">创建用户</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          placeholder="账号"
          value={draft.username}
          onChange={(e) => onDraftChange({ ...draft, username: e.target.value })}
          className="border-zinc-700 bg-zinc-950"
        />
        <Input
          placeholder="姓名"
          value={draft.name}
          onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
          className="border-zinc-700 bg-zinc-950"
        />
        <select
          value={draft.role}
          onChange={(e) => onDraftChange({ ...draft, role: e.target.value as ManagedUserRole })}
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          placeholder="初始密码"
          value={draft.password}
          onChange={(e) => onDraftChange({ ...draft, password: e.target.value })}
          className="border-zinc-700 bg-zinc-950"
        />
      </div>
      <div className="mt-3">
        <Button onClick={onCreate} disabled={createDisabled} className="bg-indigo-600 hover:bg-indigo-500">
          {creating ? '创建中...' : '创建用户'}
        </Button>
      </div>
    </section>
  );
}

