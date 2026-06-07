import { useState } from 'react';
import { Loader2, Check, X, CalendarDays } from 'lucide-react';
import { updateDay } from '../../hooks/useAdminMutations';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { DayPlanViewRow } from '../../types/database';

function parseDateInput(input: string): Date | null {
  // 去除已有的星期標記，如 "7/10（四）" → "7/10"
  const clean = input.trim().replace(/（.+?）/, '');
  const match = clean.match(/^(?:(\d{4})[/\-])?(\d{1,2})[/\-](\d{1,2})$/);
  if (!match) return null;

  const now = new Date();
  const year = match[1] ? parseInt(match[1]) : now.getFullYear();
  const month = parseInt(match[2]) - 1; // 0-indexed
  const day = parseInt(match[3]);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;

  // 未指定年份且超過 6 個月前 → 改用明年
  if (!match[1]) {
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (date < sixMonthsAgo) date.setFullYear(year + 1);
  }
  return date;
}

function formatDateWithWeekday(date: Date): string {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = weekdays[date.getDay()];
  return `${m}/${d}（${w}）`;
}

const THEME_COLORS = [
  { value: 'blue',   label: '靛藍', bg: 'bg-blue-500' },
  { value: 'purple', label: '紫色', bg: 'bg-purple-500' },
  { value: 'green',  label: '翠綠', bg: 'bg-green-500' },
  { value: 'amber',  label: '琥珀', bg: 'bg-amber-500' },
  { value: 'rose',   label: '玫瑰', bg: 'bg-rose-500' },
  { value: 'cyan',   label: '湖水', bg: 'bg-cyan-500' },
  { value: 'indigo', label: '靛紫', bg: 'bg-indigo-500' },
];

interface DayEditorProps {
  day: DayPlanViewRow;
  onSaved: () => void;
}

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' | 'filling' | 'filled' }) {
  if (status === 'idle') return null;
  return (
    <span className="flex items-center gap-1 text-xs text-stone-400">
      {status === 'saving'  && <><Loader2 className="w-3 h-3 animate-spin" />儲存中...</>}
      {status === 'saved'   && <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">已儲存</span></>}
      {status === 'error'   && <><X className="w-3 h-3 text-red-500" /><span className="text-red-500">儲存失敗</span></>}
      {status === 'filling' && <><Loader2 className="w-3 h-3 animate-spin" />帶入中...</>}
      {status === 'filled'  && <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">已帶入 Day 1-7</span></>}
    </span>
  );
}

export function DayEditor({ day, onSaved }: DayEditorProps) {
  const [form, setForm] = useState({
    date: day.date ?? '',
    title: day.title,
    theme_color: day.themeColor,
  });
  const [fillStatus, setFillStatus] = useState<'idle' | 'filling' | 'filled' | 'error'>('idle');

  const { status } = useAutoSave(form, async (v) => {
    await updateDay(day.day, v);
    onSaved();
  });

  const handleDateBlur = async () => {
    if (day.day !== 1) return;
    const parsed = parseDateInput(form.date);
    if (!parsed) return;

    setFillStatus('filling');
    try {
      const formatted = formatDateWithWeekday(parsed);
      setForm((f) => ({ ...f, date: formatted }));
      // 立即存 Day 1（不等 auto-save debounce）
      await updateDay(1, { date: formatted });
      // 帶入 Day 2-7
      for (let i = 1; i <= 6; i++) {
        const next = new Date(parsed);
        next.setDate(next.getDate() + i);
        await updateDay(i + 1, { date: formatDateWithWeekday(next) });
      }
      setFillStatus('filled');
      onSaved(); // 重新整理側邊欄
      setTimeout(() => setFillStatus('idle'), 3000);
    } catch {
      setFillStatus('error');
      setTimeout(() => setFillStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">基本資訊</h3>
        <SaveStatus status={status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-[#2C2C2C] mb-1.5">
            日期
            {day.day === 1 && (
              <CalendarDays className="w-3.5 h-3.5 text-[#2C4F7C]" aria-label="自動帶入 Day 2-7" />
            )}
          </label>
          <input
            type="text"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            onBlur={day.day === 1 ? handleDateBlur : undefined}
            placeholder={day.day === 1 ? '例：7/10（自動補星期並帶入 Day 2-7）' : '例：7/11（五）'}
            className="admin-input"
          />
          {day.day === 1 && (
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-[#8C8C8C]">
                輸入月/日後離開欄位，自動補星期並帶入 Day 2-7
              </p>
              <SaveStatus status={fillStatus} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2C2C2C] mb-1.5">當日標題</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例：初見熊本城下町"
            className="admin-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#2C2C2C] mb-2">主題色</label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm({ ...form, theme_color: c.value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all ${
                form.theme_color === c.value
                  ? 'border-[#2C4F7C] bg-[#2C4F7C]/5 text-[#2C4F7C] font-medium'
                  : 'border-stone-200 text-[#8C8C8C] hover:border-stone-300'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${c.bg}`} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
