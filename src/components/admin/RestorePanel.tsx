import { useEffect, useState } from 'react';
import { History, Loader2, RotateCcw, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import {
  listRestorePoints,
  fetchSnapshot,
  restoreSnapshot,
  type RestorePoint,
  type Snapshot,
} from '../../lib/restoreClient';
import { INSERT_ORDER } from '../../lib/backupSchema';
import { triggerSnapshot } from '../../lib/snapshotTrigger';
import { ConfirmDialog } from './ConfirmDialog';

interface RestorePanelProps {
  onRestored: () => void;
}

export function RestorePanel({ onRestored }: RestorePanelProps) {
  const [points, setPoints] = useState<RestorePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<RestorePoint | null>(null);
  const [preview, setPreview] = useState<Snapshot | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPoints(await listRestorePoints());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelect = async (p: RestorePoint) => {
    setSelected(p);
    setPreview(null);
    setDone(null);
    setError(null);
    setPreviewLoading(true);
    try {
      setPreview(await fetchSnapshot(p.downloadUrl));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!preview) return;
    setConfirmOpen(false);
    setRestoring(true);
    setError(null);
    setDone(null);
    try {
      // best-effort：先把「當前狀態」備份一版（/api/snapshot 未設定時自動忽略）
      triggerSnapshot(0);
      await restoreSnapshot(preview, setProgress);
      setDone(selected?.label ?? '');
      onRestored();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoring(false);
      setProgress('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#2C4F7C]" />
          <h2 className="text-base font-semibold text-[#2C2C2C]">備份還原</h2>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#8C8C8C] hover:text-[#2C2C2C] hover:bg-stone-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
      </div>

      <p className="text-sm text-[#8C8C8C] leading-relaxed">
        以下為每次資料有異動時保存的版本（新 → 舊），選一個即可還原到當時的狀態。
        還原會覆寫目前資料；還原前會自動先備份當前狀態，各版本也都保存在 GitHub，隨時可切換。
      </p>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {done && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          已還原到 {done}。前台重新整理後即會顯示此版本。
        </div>
      )}

      {/* 版本清單 */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#8C8C8C] py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          載入還原點…
        </div>
      ) : points.length === 0 ? (
        <div className="text-center text-sm text-[#8C8C8C] py-8 border border-dashed border-stone-300 rounded-lg">
          尚無備份版本。資料一有異動、每日備份執行後就會出現還原點。
        </div>
      ) : (
        <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
          {points.map((p) => {
            const isSel = selected?.name === p.name;
            return (
              <button
                key={p.name}
                onClick={() => handleSelect(p)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isSel ? 'bg-[#2C4F7C]/8' : 'hover:bg-stone-50'
                }`}
              >
                <History className={`w-4 h-4 flex-shrink-0 ${isSel ? 'text-[#2C4F7C]' : 'text-stone-400'}`} />
                <span className={`flex-1 text-sm ${isSel ? 'text-[#2C4F7C] font-medium' : 'text-[#2C2C2C]'}`}>
                  {p.label}
                </span>
                {isSel && previewLoading && <Loader2 className="w-4 h-4 animate-spin text-[#2C4F7C]" />}
              </button>
            );
          })}
        </div>
      )}

      {/* 選定版本的預覽 + 還原按鈕 */}
      {selected && preview && (
        <div className="border border-stone-200 rounded-lg p-4 space-y-3 bg-stone-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2C2C2C]">{selected.label}</h3>
            <span className="text-xs text-[#8C8C8C]">
              來源：{preview.meta?.source ?? '?'} · 共 {preview.meta?.total_rows ?? '?'} 筆
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-[#8C8C8C]">
            {INSERT_ORDER.map((t) => (
              <div key={t} className="flex justify-between">
                <span className="truncate">{t}</span>
                <span className="tabular-nums">{preview.tables[t]?.length ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#8C8C8C]">
              {restoring ? progress || '還原中…' : '確認後將覆寫目前資料'}
            </span>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={restoring}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#2C4F7C] hover:bg-[#1e3a5f] text-white disabled:opacity-50 transition-colors"
            >
              {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {restoring ? '還原中…' : '還原到此版本'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title={`還原到 ${selected?.label ?? ''}？`}
        message="此操作會清空目前資料庫並寫回所選版本。還原前會自動先備份當前狀態，且所有版本都保存在 GitHub，可再切換回來。"
        confirmLabel="確認還原"
        onConfirm={handleRestore}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
