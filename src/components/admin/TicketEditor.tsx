import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ExternalLink, Ticket, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  createTicket,
  updateTicket,
  deleteTicket,
  createAttachment,
  deleteAttachment,
} from '../../hooks/useAdminMutations';
import { FileUploadButton } from './FileUploadButton';
import { ConfirmDialog } from './ConfirmDialog';
import type { TicketRow, AttachmentRow } from '../../types/database';

interface TicketEditorProps {
  dayNum: number;
  onChanged: () => void;
}

const TICKET_TYPES = [
  { value: 'flight',      label: '機票' },
  { value: 'train',       label: '電車' },
  { value: 'metro',       label: '地鐵' },
  { value: 'bus',         label: '巴士' },
  { value: 'restaurant',  label: '餐廳訂位' },
];

export function TicketEditor({ dayNum, onChanged }: TicketEditorProps) {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', type: 'train', datetime: '', notes: '' });
  const [addingAtt, setAddingAtt] = useState<string | null>(null);
  const [newAtt, setNewAtt] = useState({ type: 'pdf' as 'pdf' | 'image', url: '', label: '' });
  const [uploadedAttUrl, setUploadedAttUrl] = useState('');
  const [deleteTicketTarget, setDeleteTicketTarget] = useState<TicketRow | null>(null);
  const [deleteAttTarget, setDeleteAttTarget] = useState<AttachmentRow | null>(null);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const [tkRes, attRes] = await Promise.all([
      supabase.from('tickets').select('*').eq('day', dayNum).order('sort_order'),
      supabase.from('attachments').select('*').not('ticket_id', 'is', null).order('sort_order'),
    ]);
    const tks = (tkRes.data as TicketRow[]) ?? [];
    setTickets(tks);
    const ticketIds = new Set(tks.map((t) => t.id));
    setAttachments(((attRes.data as AttachmentRow[]) ?? []).filter((a) => a.ticket_id && ticketIds.has(a.ticket_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [dayNum]);

  const handleAdd = async () => {
    if (!newForm.name.trim()) return;
    await createTicket({
      day: dayNum,
      sort_order: tickets.length,
      name: newForm.name,
      type: newForm.type,
      datetime: newForm.datetime || null,
      notes: newForm.notes || null,
    });
    setNewForm({ name: '', type: 'train', datetime: '', notes: '' });
    setAddingNew(false);
    await load();
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleteTicketTarget) return;
    await deleteTicket(deleteTicketTarget.id);
    setDeleteTicketTarget(null);
    await load();
    onChanged();
  };

  const handleUpdate = async (id: string, field: string, value: string | null) => {
    await updateTicket(id, { [field]: value || null });
    await load();
    onChanged();
  };

  const handleAddAtt = async (ticketId: string) => {
    const url = uploadedAttUrl || newAtt.url;
    if (!url.trim()) return;
    try {
      await createAttachment({
        ticket_id: ticketId,
        accommodation_day: null,
        sort_order: attachments.filter((a) => a.ticket_id === ticketId).length,
        type: newAtt.type,
        url,
        label: newAtt.label || null,
      });
      setNewAtt({ type: 'pdf', url: '', label: '' });
      setUploadedAttUrl('');
      setAddingAtt(null);
      await load();
    } catch (err) {
      console.error('[createAttachment] INSERT 失敗:', err);
      alert(`附件寫入失敗：${err instanceof Error ? err.message : JSON.stringify(err)}`);
    }
  };

  const handleDeleteAtt = async () => {
    if (!deleteAttTarget) return;
    await deleteAttachment(deleteAttTarget.id, deleteAttTarget.url);
    setDeleteAttTarget(null);
    await load();
  };

  if (loading) return <div className="py-8 text-center text-sm text-[#8C8C8C]">載入中...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">交通票券</h3>
        <button onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 text-sm text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer transition-colors">
          <Plus className="w-4 h-4" />
          新增票券
        </button>
      </div>

      {/* 空狀態 */}
      {tickets.length === 0 && !addingNew && (
        <div className="flex flex-col items-center gap-3 py-12 text-stone-400">
          <Ticket className="w-10 h-10 opacity-30" />
          <p className="text-sm">尚無票券，點擊「新增票券」加入</p>
        </div>
      )}

      {tickets.map((tk) => {
        const isExpanded = expandedId === tk.id;
        const tkAtts = attachments.filter((a) => a.ticket_id === tk.id);
        return (
          <div key={tk.id} className="border border-stone-200 rounded-lg bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-[#8C8C8C]">
                {TICKET_TYPES.find((t) => t.value === tk.type)?.label ?? tk.type}
              </span>
              <button className="flex-1 text-left text-sm font-medium text-[#2C2C2C] cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : tk.id)}>
                {tk.name}
              </button>
              <button onClick={() => setExpandedId(isExpanded ? null : tk.id)} className="text-[#8C8C8C] cursor-pointer">
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => setDeleteTicketTarget(tk)} className="p-1.5 text-[#C4C4C4] hover:text-red-500 hover:bg-red-50 rounded cursor-pointer transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 border-t border-stone-100 pt-3 bg-stone-50/50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-label">名稱</label>
                    <input defaultValue={tk.name} onBlur={(e) => handleUpdate(tk.id, 'name', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">類型</label>
                    <select defaultValue={tk.type} onChange={(e) => handleUpdate(tk.id, 'type', e.target.value)} className="admin-input">
                      {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="admin-label">日期時間</label>
                  <input defaultValue={tk.datetime ?? ''} onBlur={(e) => handleUpdate(tk.id, 'datetime', e.target.value)} placeholder="例：08:37 熊本站 → 10:33 阿蘇站" className="admin-input" />
                </div>
                <div>
                  <label className="admin-label">備註</label>
                  <textarea defaultValue={tk.notes ?? ''} onBlur={(e) => handleUpdate(tk.id, 'notes', e.target.value)} rows={2} className="admin-input resize-none" />
                </div>

                {/* 附件 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#8C8C8C]">附件</span>
                    <button onClick={() => setAddingAtt(tk.id)} className="text-xs text-[#2C4F7C] cursor-pointer hover:underline">+ 新增附件</button>
                  </div>

                  {/* 附件空狀態 */}
                  {tkAtts.length === 0 && addingAtt !== tk.id && (
                    <div className="flex flex-col items-center gap-2 py-4 text-stone-300">
                      <Paperclip className="w-6 h-6" />
                      <p className="text-xs">尚無附件</p>
                    </div>
                  )}

                  {tkAtts.map((att) => (
                    <div key={att.id} className="flex items-center gap-2 py-1.5 border-b border-stone-100 last:border-0">
                      <span className="text-xs uppercase text-[#8C8C8C] bg-stone-100 px-1.5 py-0.5 rounded">{att.type}</span>
                      <span className="flex-1 text-xs text-[#2C2C2C] truncate">{att.label || att.url}</span>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[#2C4F7C] cursor-pointer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button onClick={() => setDeleteAttTarget(att)} className="text-[#C4C4C4] hover:text-red-500 cursor-pointer transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {addingAtt === tk.id && (
                    <div className="mt-2 p-2 bg-white rounded border border-stone-200 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newAtt.type} onChange={(e) => setNewAtt({ ...newAtt, type: e.target.value as 'pdf' | 'image' })} className="admin-input">
                          <option value="pdf">PDF</option>
                          <option value="image">圖片</option>
                        </select>
                        <input value={newAtt.label} onChange={(e) => setNewAtt({ ...newAtt, label: e.target.value })} placeholder="標籤" className="admin-input" />
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
                        <button onClick={() => handleAddAtt(tk.id)} disabled={!uploadedAttUrl.trim()} className="admin-save-btn text-xs">
                          <Plus className="w-3 h-3" />新增
                        </button>
                        <button onClick={() => { setAddingAtt(null); setUploadedAttUrl(''); }} className="text-xs text-[#8C8C8C] cursor-pointer">取消</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 新增票券 */}
      {addingNew && (
        <div className="border border-[#2C4F7C]/30 rounded-lg bg-[#2C4F7C]/5 p-3 space-y-3">
          <h4 className="text-sm font-medium text-[#2C4F7C]">新增票券</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">名稱 *</label>
              <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="admin-input" autoFocus />
            </div>
            <div>
              <label className="admin-label">類型</label>
              <select value={newForm.type} onChange={(e) => setNewForm({ ...newForm, type: e.target.value })} className="admin-input">
                {TICKET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="admin-label">日期時間</label>
            <input value={newForm.datetime} onChange={(e) => setNewForm({ ...newForm, datetime: e.target.value })} className="admin-input" />
          </div>
          <div>
            <label className="admin-label">備註</label>
            <input value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} className="admin-input" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newForm.name.trim()} className="admin-save-btn">
              <Plus className="w-3.5 h-3.5" />新增
            </button>
            <button onClick={() => setAddingNew(false)} className="text-sm text-[#8C8C8C] hover:text-[#2C2C2C] cursor-pointer">取消</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTicketTarget}
        title="刪除票券"
        message={`確定要刪除「${deleteTicketTarget?.name ?? ''}」嗎？此動作無法復原。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTicketTarget(null)}
      />

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
