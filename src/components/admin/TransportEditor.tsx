import { useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { upsertTransport } from '../../hooks/useAdminMutations';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { DayPlanViewRow } from '../../types/database';

const MODES = [
  { value: 'taxi',   label: '計程車',   icon: 'Car' },
  { value: 'car',    label: '自駕',     icon: 'Car' },
  { value: 'train',  label: '電車',     icon: 'Train' },
  { value: 'bus',    label: '公車',     icon: 'Bus' },
  { value: 'walk',   label: '步行',     icon: 'Footprints' },
  { value: 'public', label: '大眾運輸', icon: 'Bus' },
];

interface TransportEditorProps {
  day: DayPlanViewRow;
  onSaved: () => void;
}

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  return (
    <span className="flex items-center gap-1 text-xs text-stone-400">
      {status === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" />儲存中...</>}
      {status === 'saved'  && <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">已儲存</span></>}
      {status === 'error'  && <><X className="w-3 h-3 text-red-500" /><span className="text-red-500">儲存失敗</span></>}
    </span>
  );
}

export function TransportEditor({ day, onSaved }: TransportEditorProps) {
  const [form, setForm] = useState({
    mode: day.transport?.mode ?? 'public',
    description: day.transport?.description ?? '',
    icon: day.transport?.icon ?? 'Bus',
  });

  const { status } = useAutoSave(form, async (v) => {
    await upsertTransport({ day: day.day, ...v });
    onSaved();
  });

  const selectMode = (m: typeof MODES[0]) => {
    setForm({ ...form, mode: m.value, icon: m.icon });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">當日交通</h3>
        <SaveStatus status={status} />
      </div>

      <div>
        <label className="admin-label">交通方式</label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => selectMode(m)}
              className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all ${
                form.mode === m.value
                  ? 'border-[#2C4F7C] bg-[#2C4F7C]/5 text-[#2C4F7C] font-medium'
                  : 'border-stone-200 text-[#8C8C8C] hover:border-stone-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="admin-label">說明文字</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="例：自駕約 40 分鐘"
          className="admin-input"
        />
      </div>
    </div>
  );
}
