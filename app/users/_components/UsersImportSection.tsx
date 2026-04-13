import { Button } from '@/components/ui/button';
import type { ImportUsersResponse } from '@/lib/services';

type UsersImportSectionProps = {
  csvText: string;
  importing: boolean;
  importPreview: Pick<ImportUsersResponse, 'totalRows' | 'errors' | 'failedRows' | 'failed'> | null;
  onCsvChange: (value: string) => void;
  onPickCsv: (file: File | null) => void;
  onDryRun: () => void;
  onCommit: () => void;
  onDownloadFailed: () => void;
};

export default function UsersImportSection({
  csvText,
  importing,
  importPreview,
  onCsvChange,
  onPickCsv,
  onDryRun,
  onCommit,
  onDownloadFailed,
}: UsersImportSectionProps) {
  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-300">批量导入（CSV）</h2>
      <p className="mb-2 text-xs text-zinc-500">
        表头必须为: username,name,role,password。role 可填: student,department-admin,college-admin,super-admin,maintainer
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => onPickCsv(e.target.files?.[0] ?? null)}
        className="mb-3 block text-xs text-zinc-400"
      />
      <textarea
        value={csvText}
        onChange={(e) => onCsvChange(e.target.value)}
        placeholder="也可直接粘贴 CSV 内容"
        className="h-32 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"
      />
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          className="border-zinc-700 bg-zinc-900 text-zinc-200"
          onClick={onDryRun}
          disabled={importing || !csvText.trim()}
        >
          预检
        </Button>
        <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={onCommit} disabled={importing || !csvText.trim()}>
          {importing ? '导入中...' : '导入'}
        </Button>
      </div>
      {importPreview && (
        <div className="mt-3 rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
          <p>预览行数: {importPreview.totalRows}</p>
          {importPreview.errors.length > 0 ? (
            <div className="mt-1 text-amber-300">错误: {importPreview.errors.join('；')}</div>
          ) : (
            <p className="mt-1 text-emerald-300">无格式错误</p>
          )}
          {typeof importPreview.failed === 'number' && importPreview.failed > 0 && importPreview.failedRows && (
            <div className="mt-2">
              <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-500" onClick={onDownloadFailed}>
                下载导入失败的行 (CSV)
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

