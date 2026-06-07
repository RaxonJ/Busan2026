import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Check, X, Save } from 'lucide-react';
import { savePackingList } from '../../hooks/useAdminMutations';
import { packingList as defaultPackingList } from '../../data/packingList';
import type { PackingItem } from '../../types/packingList';
import { supabase } from '../../lib/supabase';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const CATEGORIES: PackingItem['category'][] = ['證件', '汗蒸幕／溫泉', '衣物', '通用'];

function genId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function PackingListEditor() {
  const [items, setItems] = useState<PackingItem[]>(defaultPackingList);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('packing_categories')
          .select(`
            id, name, sort_order,
            packing_items (id, name, sort_order)
          `)
          .order('sort_order');
        if (!error && data && data.length > 0) {
          const loaded: PackingItem[] = [];
          for (const cat of data as any[]) {
            const sorted = (cat.packing_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
            for (const item of sorted) {
              loaded.push({
                id: item.id as string,
                category: cat.name as PackingItem['category'],
                item: item.name as string,
              });
            }
          }
          if (loaded.length > 0) setItems(loaded);
        }
      } catch (err) {
        console.error('載入打包清單失敗:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (pendingFocusId) {
      const input = document.querySelector<HTMLInputElement>(
        `input[data-item-id="${pendingFocusId}"]`
      );
      input?.focus();
      setPendingFocusId(null);
    }
  }, [pendingFocusId, items]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await savePackingList(items);
      // 通知前台清除快取並重新 fetch
      window.dispatchEvent(new CustomEvent('supabase-cache-invalidate', {
        detail: { cacheKey: 'kyushu-packing-list-data' },
      }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('儲存打包清單失敗:', err);
      setSaveStatus('error');
    }
  };

  const addItem = (category: PackingItem['category']) => {
    const newId = genId();
    setItems(prev => [...prev, { id: newId, category, item: '' }]);
    setPendingFocusId(newId);
  };

  const updateItem = (id: string, field: 'item' | 'category', value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="p-8 text-[#8C8C8C]">載入中...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="sticky top-0 z-10 bg-[#FAF8F5]/95 backdrop-blur-sm flex items-center justify-between py-3 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-stone-100 mb-2">
        <h2 className="font-serif text-xl text-[#2C2C2C]">打包清單</h2>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            saveStatus === 'saving'  ? 'bg-stone-100 text-stone-400 cursor-not-allowed' :
            saveStatus === 'saved'   ? 'bg-green-50 text-green-600 border border-green-300' :
            saveStatus === 'error'   ? 'bg-red-50 text-red-600 border border-red-300' :
            'bg-[#2C4F7C] text-white hover:bg-[#1e3a5f] cursor-pointer'
          }`}
        >
          {saveStatus === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" />儲存中...</>}
          {saveStatus === 'saved'  && <><Check className="w-3.5 h-3.5" />已儲存</>}
          {saveStatus === 'error'  && <><X className="w-3.5 h-3.5" />儲存失敗</>}
          {saveStatus === 'idle'   && <><Save className="w-3.5 h-3.5" />儲存</>}
        </button>
      </div>

      {CATEGORIES.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        return (
          <div key={cat} className="border border-stone-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200">
              <span className="text-sm font-semibold text-[#2C2C2C]">{cat}</span>
              <button
                onClick={() => addItem(cat)}
                className="flex items-center gap-1 text-xs text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />新增
              </button>
            </div>
            <div className="divide-y divide-stone-100">
              {catItems.length === 0 && (
                <p className="px-4 py-3 text-sm text-[#8C8C8C]">尚無項目</p>
              )}
              {catItems.map(it => (
                <div key={it.id} className="flex items-center gap-2 px-4 py-2">
                  <input
                    className="admin-input flex-1"
                    data-item-id={it.id}
                    value={it.item}
                    onChange={e => updateItem(it.id, 'item', e.target.value)}
                    placeholder="項目名稱"
                  />
                  <select
                    className="admin-input flex-shrink-0"
                    style={{ width: 'auto' }}
                    value={it.category}
                    onChange={e => updateItem(it.id, 'category', e.target.value as PackingItem['category'])}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    onClick={() => deleteItem(it.id)}
                    className="p-1.5 text-[#8C8C8C] hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
