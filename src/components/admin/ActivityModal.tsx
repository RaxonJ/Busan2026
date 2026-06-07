import { useState, useEffect } from 'react';
import { X, Save, ExternalLink, Trash2, Plus } from 'lucide-react';
import { createActivity, updateActivity, createActivityLink, deleteActivityLink } from '../../hooks/useAdminMutations';
import { FileUploadButton } from './FileUploadButton';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from './ConfirmDialog';
import type { ActivityRow, ActivityLinkRow } from '../../types/database';

interface ActivityModalProps {
  activity: ActivityRow | null; // null = 新增模式
  dayNum: number;
  nextOrder: number;
  onSaved: () => void;
  onClose: () => void;
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: '',        label: '—',    emoji: '' },
  { value: 'spot',    label: '景點',  emoji: '📍' },
  { value: 'food',    label: '餐廳',  emoji: '🍽️' },
  { value: 'coffee',  label: '咖啡',  emoji: '☕' },
  { value: 'hotel',   label: '飯店',  emoji: '🏨' },
  { value: 'flight',  label: '航班',  emoji: '✈️' },
  { value: 'train',   label: '電車',  emoji: '🚆' },
  { value: 'car',     label: '乘車',  emoji: '🚗' },
  { value: 'bus',     label: '巴士',  emoji: '🚌' },
] as const;

type FormState = {
  time: string;
  title: string;
  description: string;
  map_query: string;
  map_url: string;
  photo_url: string;
  is_kid_friendly: boolean;
  is_senior_friendly: boolean;
  priority: 'must' | 'normal' | 'optional';
  activity_type: string;
};

type LinkFormState = {
  title: string;
  url: string;
};

export function ActivityModal({ activity, dayNum, nextOrder, onSaved, onClose }: ActivityModalProps) {
  const [form, setForm] = useState<FormState>({
    time: activity?.time ?? '',
    title: activity?.title ?? '',
    description: activity?.description ?? '',
    map_query: activity?.map_query ?? '',
    map_url: activity?.map_url ?? '',
    photo_url: activity?.photo_url ?? '',
    is_kid_friendly: activity?.is_kid_friendly ?? true,
    is_senior_friendly: activity?.is_senior_friendly ?? true,
    priority: (activity?.priority as 'must' | 'normal' | 'optional') ?? 'normal',
    activity_type: activity?.activity_type ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Links 狀態
  const [links, setLinks] = useState<ActivityLinkRow[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState<LinkFormState>({ title: '', url: '' });
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 載入現有連結（僅在編輯模式且有 Supabase 時）
  useEffect(() => {
    if (!activity || !supabase) return;
    setLinksLoading(true);
    supabase
      .from('activity_links')
      .select('*')
      .eq('activity_id', activity.id)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data) setLinks(data);
        setLinksLoading(false);
      });
  }, [activity]);

  const handleTimeChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 4);
    let formatted = limited;
    if (limited.length >= 3) {
      formatted = limited.slice(0, 2) + ':' + limited.slice(2);
    }
    setForm({ ...form, time: formatted });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('景點名稱為必填');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // 智慧處理：如果 map_query 填了 URL，移到 map_url；map_query 用 title 替代
      let finalMapQuery = form.map_query.trim();
      let finalMapUrl = form.map_url.trim();

      if (finalMapQuery && /^https?:\/\//.test(finalMapQuery)) {
        // 使用者誤把 URL 貼到搜尋字串欄位 → 移到 map_url
        if (!finalMapUrl) finalMapUrl = finalMapQuery;
        finalMapQuery = '';
      }

      // 當有 Google Maps 連結但沒有搜尋字串時，自動用景點名稱
      if (!finalMapQuery && finalMapUrl) {
        finalMapQuery = form.title.trim();
      }

      const payload = {
        time: form.time,
        title: form.title,
        description: form.description || null,
        map_query: finalMapQuery || null,
        map_url: finalMapUrl || null,
        photo_url: form.photo_url || null,
        is_kid_friendly: form.is_kid_friendly,
        is_senior_friendly: form.is_senior_friendly,
        priority: form.priority === 'normal' ? null : form.priority,
        activity_type: form.activity_type || null,
      };
      if (activity) {
        await updateActivity(activity.id, payload);
      } else {
        await createActivity({ ...payload, day: dayNum, sort_order: nextOrder });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError('儲存失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkForm.title.trim()) { setLinkError('連結名稱為必填'); return; }
    if (!linkForm.url.trim()) { setLinkError('URL 為必填'); return; }
    if (!activity) return;
    setLinkSaving(true);
    setLinkError('');
    try {
      const row = await createActivityLink({
        activity_id: activity.id,
        sort_order: links.length,
        title: linkForm.title.trim(),
        url: linkForm.url.trim(),
      });
      setLinks(prev => [...prev, row]);
      setLinkForm({ title: '', url: '' });
      setShowLinkForm(false);
    } catch (err) {
      setLinkError('新增失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setLinkSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteActivityLink(id);
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('刪除連結失敗', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 flex flex-col max-h-[90vh]"
          style={{ animation: 'activityModalIn 0.2s ease-out' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <h2 className="font-serif text-lg text-[#2C2C2C]">
              {activity ? '編輯景點' : '新增景點'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#8C8C8C] hover:text-[#2C2C2C] hover:bg-stone-100 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="admin-label">時間</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="admin-input"
                  placeholder="0900"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="admin-label">景點名稱 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="admin-input"
                  placeholder="景點名稱"
                />
              </div>
            </div>

            <div>
              <label className="admin-label">備註說明</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="admin-input resize-none"
                placeholder="景點說明、注意事項..."
              />
            </div>

            <div>
              <label className="admin-label">Google Maps 連結</label>
              <input
                value={form.map_url}
                onChange={(e) => setForm({ ...form, map_url: e.target.value })}
                className="admin-input"
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-xs text-[#8C8C8C] mt-1">
                貼上連結即可顯示地圖並串進每日路線
              </p>
            </div>

            <div>
              <label className="admin-label">
                地圖搜尋字串
                <span className="text-[#8C8C8C] font-normal ml-1">（選填）</span>
              </label>
              <input
                value={form.map_query}
                onChange={(e) => setForm({ ...form, map_query: e.target.value })}
                className="admin-input"
                placeholder={form.map_url ? `留空將自動使用「${form.title || '景點名稱'}」` : '景點日文名或英文名（用於內嵌地圖）'}
              />
            </div>

            <div>
              <label className="admin-label">景點照片</label>
              <FileUploadButton
                folder="photos"
                accept="image/*"
                currentUrl={form.photo_url}
                onUploaded={(url) => setForm({ ...form, photo_url: url })}
                onRemoved={() => setForm({ ...form, photo_url: '' })}
                label="選擇照片上傳"
              />
            </div>

            {/* 優先度 */}
            <div>
              <label className="admin-label">優先度</label>
              <div className="flex rounded-lg overflow-hidden border border-stone-200">
                {(
                  [
                    { value: 'must', label: '⭐ 必去', activeClass: 'bg-amber-50 text-amber-700 border-amber-400' },
                    { value: 'normal', label: '一般', activeClass: 'bg-stone-100 text-[#2C2C2C]' },
                    { value: 'optional', label: '備選', activeClass: 'bg-stone-50 text-stone-400' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: opt.value })}
                    className={`flex-1 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-stone-200 ${
                      form.priority === opt.value
                        ? opt.activeClass
                        : 'text-[#8C8C8C] hover:bg-stone-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 活動類型 */}
            <div>
              <label className="admin-label">活動類型</label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, activity_type: opt.value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                      form.activity_type === opt.value
                        ? 'border-[#2C4F7C] bg-[#2C4F7C]/5 text-[#2C4F7C] font-medium'
                        : 'border-stone-200 text-[#8C8C8C] hover:border-stone-300'
                    }`}
                  >
                    {opt.emoji && <span>{opt.emoji}</span>}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_kid_friendly}
                  onChange={(e) => setForm({ ...form, is_kid_friendly: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#2C4F7C]"
                />
                <span className="text-[#2C2C2C]">親子友善</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_senior_friendly}
                  onChange={(e) => setForm({ ...form, is_senior_friendly: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#2C4F7C]"
                />
                <span className="text-[#2C2C2C]">長輩友善</span>
              </label>
            </div>

            {/* 參考連結（僅在編輯模式 + Supabase 可用時顯示） */}
            {activity && supabase && (
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#8C8C8C]" />
                    <label className="text-sm font-medium text-[#2C2C2C]">參考連結</label>
                    <span className="text-xs text-[#8C8C8C]">{links.length} 個</span>
                  </div>
                  {!showLinkForm && (
                    <button
                      type="button"
                      onClick={() => setShowLinkForm(true)}
                      className="flex items-center gap-1 text-xs text-[#2C4F7C] hover:text-[#1e3a5f] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      新增連結
                    </button>
                  )}
                </div>

                {/* 現有連結清單 */}
                {linksLoading ? (
                  <p className="text-xs text-[#8C8C8C] py-2">載入中...</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#8C8C8C] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#2C2C2C] truncate">{link.title}</p>
                          <p className="text-xs text-[#8C8C8C] truncate">{link.url}</p>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-[#8C8C8C] hover:text-[#2C4F7C] transition-colors flex-shrink-0"
                          title="開啟連結"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ id: link.id, title: link.title })}
                          className="p-1 text-[#8C8C8C] hover:text-red-500 transition-colors flex-shrink-0"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {links.length === 0 && !showLinkForm && (
                      <p className="text-xs text-[#8C8C8C] py-1">尚無參考連結</p>
                    )}
                  </div>
                )}

                {/* 新增連結表單 */}
                {showLinkForm && (
                  <div className="space-y-2 p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <div>
                      <label className="admin-label">連結名稱 *</label>
                      <input
                        value={linkForm.title}
                        onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                        className="admin-input"
                        placeholder="例：官方網站"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="admin-label">URL *</label>
                      <input
                        value={linkForm.url}
                        onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                        className="admin-input"
                        placeholder="https://..."
                      />
                    </div>
                    {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddLink}
                        disabled={linkSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C4F7C] text-white text-xs font-medium hover:bg-[#1e3a5f] disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {linkSaving ? '新增中...' : '新增'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowLinkForm(false); setLinkForm({ title: '', url: '' }); setLinkError(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#8C8C8C] hover:text-[#2C2C2C] hover:bg-stone-100 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#8C8C8C] hover:text-[#2C2C2C] hover:bg-stone-100 cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2C4F7C] text-white text-sm font-medium hover:bg-[#1e3a5f] disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
        <style>{`
          @keyframes activityModalIn {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>

      {/* 刪除確認對話框 */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="刪除參考連結"
          message={`確定要刪除「${deleteConfirm.title}」嗎？此操作無法復原。`}
          confirmLabel="確認刪除"
          onConfirm={() => handleDeleteLink(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
