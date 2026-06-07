import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Loader2, Check, Save } from 'lucide-react';
import { saveShoppingList } from '../../hooks/useAdminMutations';
import { shoppingList as defaultShoppingList } from '../../data/shoppingList';
import type { ShoppingCategory, ShoppingItem } from '../../types/shoppingList';
import { supabase } from '../../lib/supabase';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function emptyItem(): ShoppingItem {
  return { name: '', checked: false };
}

export function ShoppingListEditor() {
  const [categories, setCategories] = useState<ShoppingCategory[]>(defaultShoppingList);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await saveShoppingList(categories);
      // 通知前台清除快取並重新 fetch
      window.dispatchEvent(new CustomEvent('supabase-cache-invalidate', {
        detail: { cacheKey: 'kyushu-shopping-list-data' },
      }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('儲存購物清單失敗:', err);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('shopping_categories')
          .select(`
            id, name, sort_order,
            shopping_items (id, name, store, sort_order,
              shopping_item_links (id, title, url, sort_order)
            )
          `)
          .order('sort_order');
        if (!error && data && data.length > 0) {
          const cats: ShoppingCategory[] = (data as any[]).map((cat) => ({
            category: cat.name as string,
            items: (cat.shopping_items ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((item: any) => ({
                name: item.name as string,
                store: item.store ?? undefined,
                checked: false,
                links: (item.shopping_item_links ?? [])
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((link: any) => ({ title: link.title as string, url: link.url as string })),
              })),
          }));
          setCategories(cats);
        }
      } catch (err) {
        console.error('載入購物清單失敗:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addCategory = () => {
    setCategories(prev => [...prev, { category: '新分類', items: [] }]);
  };

  const updateCategoryName = (idx: number, name: string) => {
    setCategories(prev => prev.map((c, i) => i === idx ? { ...c, category: name } : c));
  };

  const deleteCategory = (idx: number) => {
    setCategories(prev => prev.filter((_, i) => i !== idx));
  };

  const [pendingFocus, setPendingFocus] = useState<{ catIdx: number; itemIdx: number } | null>(null);

  useEffect(() => {
    if (pendingFocus) {
      const input = document.querySelector<HTMLInputElement>(
        `input[data-focus-key="${pendingFocus.catIdx}-${pendingFocus.itemIdx}"]`
      );
      input?.focus();
      setPendingFocus(null);
    }
  }, [pendingFocus, categories]);

  const addItem = (catIdx: number) => {
    const itemIdx = categories[catIdx].items.length;
    setCategories(prev => prev.map((c, i) =>
      i === catIdx ? { ...c, items: [...c.items, emptyItem()] } : c
    ));
    setPendingFocus({ catIdx, itemIdx });
  };

  const updateItemField = (catIdx: number, itemIdx: number, field: keyof ShoppingItem, value: string) => {
    setCategories(prev => prev.map((c, i) => {
      if (i !== catIdx) return c;
      const items = c.items.map((it, j) => {
        if (j !== itemIdx) return it;
        if (field === 'name' || field === 'store') return { ...it, [field]: value || undefined };
        return it;
      });
      return { ...c, items };
    }));
  };

  const deleteItem = (catIdx: number, itemIdx: number) => {
    setCategories(prev => prev.map((c, i) =>
      i === catIdx ? { ...c, items: c.items.filter((_, j) => j !== itemIdx) } : c
    ));
  };

  const addLink = (catIdx: number, itemIdx: number) => {
    setCategories(prev => prev.map((c, i) => {
      if (i !== catIdx) return c;
      const items = c.items.map((it, j) => {
        if (j !== itemIdx) return it;
        const links = [...(it.links ?? []), { title: '', url: '' }];
        return { ...it, links };
      });
      return { ...c, items };
    }));
  };

  const updateLink = (catIdx: number, itemIdx: number, linkIdx: number, field: 'title' | 'url', value: string) => {
    setCategories(prev => prev.map((c, i) => {
      if (i !== catIdx) return c;
      const items = c.items.map((it, j) => {
        if (j !== itemIdx || !it.links) return it;
        const links = it.links.map((l, k) => k === linkIdx ? { ...l, [field]: value } : l);
        return { ...it, links };
      });
      return { ...c, items };
    }));
  };

  const deleteLink = (catIdx: number, itemIdx: number, linkIdx: number) => {
    setCategories(prev => prev.map((c, i) => {
      if (i !== catIdx) return c;
      const items = c.items.map((it, j) => {
        if (j !== itemIdx || !it.links) return it;
        const links = it.links.filter((_, k) => k !== linkIdx);
        return { ...it, links: links.length > 0 ? links : undefined };
      });
      return { ...c, items };
    }));
  };

  if (loading) return <div className="p-8 text-[#8C8C8C]">載入中...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="sticky top-0 z-10 bg-[#FAF8F5]/95 backdrop-blur-sm flex items-center justify-between py-3 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-stone-100 mb-2">
        <h2 className="font-serif text-xl text-[#2C2C2C]">購物清單</h2>
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

      {categories.map((cat, catIdx) => (
        <div key={catIdx} className="border border-stone-200 rounded-lg overflow-hidden">
          {/* Category header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200">
            <input
              className="admin-input flex-1 font-semibold"
              value={cat.category}
              onChange={e => updateCategoryName(catIdx, e.target.value)}
              placeholder="分類名稱"
            />
            <button onClick={() => addItem(catIdx)} className="flex items-center gap-1 text-xs text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" />新增項目
            </button>
            <button onClick={() => deleteCategory(catIdx)} className="p-1 text-[#8C8C8C] hover:text-red-500 cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="divide-y divide-stone-100">
            {cat.items.length === 0 && (
              <p className="px-4 py-3 text-sm text-[#8C8C8C]">尚無項目</p>
            )}
            {cat.items.map((item, itemIdx) => (
              <div key={itemIdx} className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className="admin-input flex-1"
                    data-focus-key={`${catIdx}-${itemIdx}`}
                    value={item.name}
                    onChange={e => updateItemField(catIdx, itemIdx, 'name', e.target.value)}
                    placeholder="商品名稱"
                  />
                  <input
                    className="admin-input flex-shrink-0"
                    style={{ width: '7rem' }}
                    value={item.store ?? ''}
                    onChange={e => updateItemField(catIdx, itemIdx, 'store', e.target.value)}
                    placeholder="購買店家"
                  />
                  <button onClick={() => addLink(catIdx, itemIdx)} className="p-1.5 text-[#8C8C8C] hover:text-[#2C4F7C] cursor-pointer" title="新增連結">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteItem(catIdx, itemIdx)} className="p-1.5 text-[#8C8C8C] hover:text-red-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Links */}
                {item.links && item.links.map((link, linkIdx) => (
                  <div key={linkIdx} className="flex items-center gap-2 pl-4">
                    <input
                      className="admin-input flex-shrink-0"
                      style={{ width: '9rem' }}
                      value={link.title}
                      onChange={e => updateLink(catIdx, itemIdx, linkIdx, 'title', e.target.value)}
                      placeholder="連結標題"
                    />
                    <input
                      className="admin-input flex-1"
                      value={link.url}
                      onChange={e => updateLink(catIdx, itemIdx, linkIdx, 'url', e.target.value)}
                      placeholder="https://..."
                    />
                    <button onClick={() => deleteLink(catIdx, itemIdx, linkIdx)} className="p-1.5 text-[#8C8C8C] hover:text-red-500 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={addCategory} className="w-full py-3 border-2 border-dashed border-stone-300 rounded-lg text-sm text-[#8C8C8C] hover:text-[#2C2C2C] hover:border-stone-400 cursor-pointer transition-colors flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" />新增分類
      </button>
    </div>
  );
}
