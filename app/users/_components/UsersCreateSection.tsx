import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ManagedUserRole, OrgCollege, OrgDepartment } from '@/lib/services';
import { ROLE_OPTIONS } from '@/app/users/user-role';

type DraftUser = {
  username: string;
  name: string;
  role: ManagedUserRole;
  password: string;
  collegeId: number | null;
  departmentId: number | null;
};

type UsersCreateSectionProps = {
  draft: DraftUser;
  creating: boolean;
  createDisabled: boolean;
  colleges: OrgCollege[];
  departments: OrgDepartment[];
  roleOptions: Array<{ value: ManagedUserRole; label: string }>;
  onDraftChange: (next: DraftUser) => void;
  onCreate: () => void;
};

export default function UsersCreateSection({
  draft,
  creating,
  createDisabled,
  colleges,
  departments,
  roleOptions,
  onDraftChange,
  onCreate,
}: UsersCreateSectionProps) {
  const selectedCollegeId = draft.collegeId;
  const scopedDepartments = selectedCollegeId
    ? departments.filter((department) => department.collegeId === selectedCollegeId)
    : departments;

  const requiresCollege = draft.role === 'college-admin' || draft.role === 'department-admin' || draft.role === 'student';
  const requiresDepartment = draft.role === 'department-admin' || draft.role === 'student';

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-300">创建用户</h2>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
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
          {(roleOptions.length > 0 ? roleOptions : ROLE_OPTIONS).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={draft.collegeId ?? ''}
          onChange={(e) => {
            const collegeId = e.target.value ? Number(e.target.value) : null;
            onDraftChange({ ...draft, collegeId, departmentId: null });
          }}
          disabled={!requiresCollege}
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200 disabled:opacity-40"
        >
          <option value="">{requiresCollege ? '选择院部' : '该角色无需院部'}</option>
          {colleges.map((college) => (
            <option key={college.id} value={college.id}>{college.name}</option>
          ))}
        </select>
        <select
          value={draft.departmentId ?? ''}
          onChange={(e) => onDraftChange({ ...draft, departmentId: e.target.value ? Number(e.target.value) : null })}
          disabled={!requiresDepartment}
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200 disabled:opacity-40"
        >
          <option value="">{requiresDepartment ? '选择系部' : '该角色无需系部'}</option>
          {scopedDepartments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
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
