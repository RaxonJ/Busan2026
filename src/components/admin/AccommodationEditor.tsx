import { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Loader2, Check, X, Paperclip, CornerDownLeft } from 'lucide-react';
import { upsertAccommodation, createAttachment, deleteAttachment, createAccommodationLink, deleteAccommodationLink } from '../../hooks/useAdminMutations';
import { useAutoSave } from '../../hooks/useAutoSave';
import { FileUploadButton } from './FileUploadButton';
import { ConfirmDialog } from './ConfirmDialog';
import { supabase } from '../../lib/supabase';
import type { DayPlanViewRow, AttachmentRow, AccommodationLinkRow } from '../../types/database';

interface AccommodationEditorProps {
  day: DayPlanViewRow;
  onSaved: () => void;
  prevDayAccommodation?: {
    name: string;
    description: string | null;
    mapQuery: string | null;
    photoUrl: string | null;
  } | null;
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

export function AccommodationEditor({ day, onSaved, prevDayAccommodation }: AccommodationEditorProps) {
  const acc = day.accommodation;
  const [form, setForm] = useState({
    name: acc?.name ?? '',
    description: acc?.description ?? '',
    map_query: acc?.mapQuery ?? '',
    photo_url: acc?.photoUrl ?? '',
  });
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [newAtt, setNewAtt] = useState({ type: 'pdf' as 'pdf' | 'image', label: '' });
  const [uploadedAttUrl, setUploadedAttUrl] = useState('');
  const [addingAtt, setAddingAtt] = useState(false);
  const [deleteAttTarget, setDeleteAttTarget] = useState<AttachmentRow | null>(null);

  const [links, setLinks] = useState<AccommodationLinkRow[]>([]);
  const [addingLink, setAddingLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [deleteLinkTarget, setDeleteLinkTarget] = useState<AccommodationLinkRow | null>(null);

  const { status } = useAutoSave(form, async (v) => {
    if (!v.name.trim()) return;
    await upsertAccommodation({
      day: day.day,
      ...v,
      description: v.description || null,
      map_query: v.map_query || null,
      photo_url: v.photo_url || null,
    });
    onSaved();
  });

  const loadAttachments = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('accommodation_day', day.day)
      .order('sort_order');
    setAttachments((data as AttachmentRow[]) ?? []);
  };

  const loadLinks = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('accommodation_links')
      .select('*')
      .eq('accommodation_day', day.day)
      .order('sort_order');
    setLinks((data as AccommodationLinkRow[]) ?? []);
  };

  useEffect(() => { loadAttachments(); loadLinks(); }, [day.day]);

  const handleAddAtt = async () => {
    if (!uploadedAttUrl.trim()) return;
    await createAttachment({
      ticket_id: null,
      accommodation_day: day.day,
      sort_order: attachments.length,
      type: newAtt.type,
      url: uploadedAttUrl,
      label: newAtt.label || null,
    });
    setNewAtt({ type: 'pdf', label: '' });
    setUploadedAttUrl('');
    setAddingAtt(false);
    await loadAttachments();
  };

  const handleDeleteAtt = async () => {
    if (!deleteAttTarget) return;
    await deleteAttachment(deleteAttTarget.id, deleteAttTarget.url);
    setDeleteAttTarget(null);
    await loadAttachments();
  };

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    await createAccommodationLink({
      accommodation_day: day.day,
      sort_order: links.length,
      title: newLink.title,
      url: newLink.url,
    });
    setNewLink({ title: '', url: '' });
    setAddingLink(false);
    await loadLinks();
  };

  const handleDeleteLink = async () => {
    if (!deleteLinkTarget) return;
    await deleteAccommodationLink(deleteLinkTarget.id);
    setDeleteLinkTarget(null);
    await loadLinks();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">住宿資訊</h3>
        <SaveStatus status={status} />
      </div>

      {prevDayAccommodation && (
        <button
          type="button"
          onClick={() =>
            setForm({
              name: prevDayAccommodation.name,
              description: prevDayAccommodation.description ?? '',
              map_query: prevDayAccommodation.mapQuery ?? '',
              photo_url: prevDayAccommodation.photoUrl ?? '',
            })
          }
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2C4F7C]/20 bg-[#2C4F7C]/5 text-sm text-[#2C4F7C] hover:bg-[#2C4F7C]/10 cursor-pointer transition-colors text-left"
        >
          <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
          <span>帶入前一天住宿：</span>
          <span className="font-medium truncate">{prevDayAccommodation.name}</span>
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="admin-label">住宿名稱 *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" placeholder="飯店名稱（日文）" />
        </div>
        <div>
          <label className="admin-label">地圖搜尋字串</label>
          <input value={form.map_query} onChange={(e) => setForm({ ...form, map_query: e.target.value })} className="admin-input" placeholder="Google Maps 搜尋字串" />
        </div>
      </div>

      <div>
        <label className="admin-label">備註說明</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="admin-input resize-none" />
      </div>

      <div>
        <label className="admin-label">住宿照片</label>
        <FileUploadButton
          folder="photos"
          accept="image/*"
          currentUrl={form.photo_url}
          onUploaded={(url) => setForm({ ...form, photo_url: url })}
          label="選擇照片上傳"
        />
      </div>

      {/* 參考連結管理 */}
      <div className="pt-2 border-t border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-[#2C2C2C]">參考連結</h4>
          <button
            onClick={() => setAddingLink(true)}
            className="flex items-center gap-1 text-sm text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新增連結
          </button>
        </div>

        {links.length === 0 && !addingLink && (
          <div className="flex flex-col items-center gap-2 py-6 text-stone-400">
            <ExternalLink className="w-7 h-7 opacity-30" />
            <p className="text-sm">尚無參考連結</p>
          </div>
        )}

        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-2 py-2 border-b border-stone-100 last:border-0">
            <span className="flex-1 text-sm text-[#2C2C2C] truncate">{link.title}</span>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setDeleteLinkTarget(link)}
              className="text-[#C4C4C4] hover:text-red-500 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {addingLink && (
          <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
            <input
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="連結標題（例：Agoda 訂房確認）"
              className="admin-input w-full"
            />
            <input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="連結網址（https://...）"
              className="admin-input w-full"
              type="url"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddLink}
                disabled={!newLink.title.trim() || !newLink.url.trim()}
                className="admin-save-btn text-xs"
              >
                <Plus className="w-3 h-3" />
                新增
              </button>
              <button
                onClick={() => { setAddingLink(false); setNewLink({ title: '', url: '' }); }}
                className="text-sm text-[#8C8C8C] hover:text-[#2C2C2C] cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteLinkTarget}
        title="刪除連結"
        message={`確定要刪除「${deleteLinkTarget?.title || '此連結'}」嗎？`}
        onConfirm={handleDeleteLink}
        onCancel={() => setDeleteLinkTarget(null)}
      />

      {/* 附件管理 */}
      <div className="pt-2 border-t border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-[#2C2C2C]">附件</h4>
          <button onClick={() => setAddingAtt(true)} className="flex items-center gap-1 text-sm text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            新增附件
          </button>
        </div>

        {/* 空狀態 */}
        {attachments.length === 0 && !addingAtt && (
          <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
            <Paperclip className="w-8 h-8 opacity-30" />
            <p className="text-sm">尚無附件，點擊「新增附件」上傳</p>
          </div>
        )}

        {attachments.map((att) => (
          <div key={att.id} className="flex items-center gap-2 py-2 border-b border-stone-100 last:border-0">
            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-[#8C8C8C] uppercase">{att.type}</span>
            <span className="flex-1 text-sm text-[#2C2C2C] truncate">{att.label || att.url}</span>
            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button onClick={() => setDeleteAttTarget(att)} className="text-[#C4C4C4] hover:text-red-500 cursor-pointer transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {addingAtt && (
          <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={newAtt.type} onChange={(e) => setNewAtt({ ...newAtt, type: e.target.value as 'pdf' | 'image' })} className="admin-input">
                <option value="pdf">PDF</option>
                <option value="image">圖片</option>
              </select>
              <input value={newAtt.label} onChange={(e) => setNewAtt({ ...newAtt, label: e.target.value })} placeholder="標籤（選填）" className="admin-input" />
            </div>
            <FileUploadButton
              folder="attachments"
              accept="image/*,.pdf"
              currentUrl={uploadedAttUrl}
              onUploaded={(url) => {
                setUploadedAttUrl(url);
                setNewAtt((prev) => ({
                  ...prev,
                  type: url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
                }));
              }}
              label="選擇 PDF 或圖片上傳"
            />
            <div className="flex gap-2">
              <button onClick={handleAddAtt} disabled={!uploadedAttUrl.trim()} className="admin-save-btn text-xs">
                <Plus className="w-3 h-3" />
                新增
              </button>
              <button onClick={() => { setAddingAtt(false); setUploadedAttUrl(''); }} className="text-sm text-[#8C8C8C] hover:text-[#2C2C2C] cursor-pointer">取消</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteAttTarget}
        title="刪除附件"
        message={`確定要刪除「${deleteAttTarget?.label || deleteAttTarget?.url || '此附件'}」嗎？`}
        onConfirm={handleDeleteAtt}
        onCancel={() => setDeleteAttTarget(null)}
      />
    </div>
  );
}
