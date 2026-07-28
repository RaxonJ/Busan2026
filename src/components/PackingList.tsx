import { useState, useEffect } from 'react';
import { ChevronLeft, CheckSquare, Square } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { packingList as hardcodedPackingList, type PackingItem } from '../data/packingList';
import { liveSnapshot } from '../data/liveSnapshot';

interface PackingListProps {
  onBack: () => void;
}

const STORAGE_KEY = 'kyushu-packing-checked';

export function PackingList({ onBack }: PackingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // 從 Supabase 載入打包清單資料（含 localStorage 快取 + fallback）
  const [packingList] = useSupabaseData<PackingItem[]>(
    'kyushu-packing-list-data',
    async () => {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('packing_categories')
        .select(`
          id, name, sort_order,
          packing_items (id, name, sort_order)
        `)
        .order('sort_order');

      if (error) {
        console.error('❌ Supabase fetch packing_categories 失敗:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const items: PackingItem[] = [];
      for (const cat of data as any[]) {
        const sorted = (cat.packing_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
        for (const item of sorted) {
          items.push({
            id: item.id as string,
            category: cat.name as PackingItem['category'],
            item: item.name as string,
          });
        }
      }
      return items.length > 0 ? items : null;
    },
    liveSnapshot.packing.length > 0 ? liveSnapshot.packing : hardcodedPackingList
  );

  // 從 localStorage 讀取勾選狀態
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCheckedItems(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Failed to load packing list state:', error);
    }
  }, []);

  // 儲存勾選狀態到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checkedItems]));
    } catch (error) {
      console.error('Failed to save packing list state:', error);
    }
  }, [checkedItems]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 按類別分組
  const groupedItems = packingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof packingList>);

  // 計算進度
  const totalItems = packingList.length;
  const checkedCount = checkedItems.size;
  const progress = Math.round((checkedCount / totalItems) * 100);

  // 類別順序（重要性排序）
  const categoryOrder = ['證件', '嬰幼兒', '長輩', '通用'];

  return (
    <div className="min-h-screen bg-washi pb-20">
      {/* 頂部導航 */}
      <div className="sticky top-0 z-50 bg-green-600 text-white px-4 py-4 shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="返回行程"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6" />
            打包清單
          </h1>
        </div>

        {/* 進度條 */}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm mt-2 text-white/90">
          已完成 {checkedCount} / {totalItems} 項 ({progress}%)
        </p>
      </div>

      {/* 清單內容 */}
      <div className="p-4 space-y-6">
        {categoryOrder.map((category) => {
          const items = groupedItems[category] || [];
          const categoryChecked = items.filter((item) => checkedItems.has(item.id)).length;
          const categoryTotal = items.length;

          return (
            <div key={category}>
              {/* 類別標題 */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-ink text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-600 rounded-full" />
                  {category}
                </h2>
                <span className="text-sm text-stone">
                  {categoryChecked}/{categoryTotal}
                </span>
              </div>

              {/* 項目列表 */}
              <div className="space-y-2">
                {items.map((item) => {
                  const isChecked = checkedItems.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`
                        w-full bg-washi-card border border-washi-border rounded-lg shadow-sm p-3
                        flex items-center gap-3 text-left transition-all duration-200
                        hover:shadow-md
                        ${isChecked ? 'opacity-60' : ''}
                      `}
                    >
                      {/* 勾選框圖示 */}
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-stone-400 flex-shrink-0" />
                      )}

                      {/* 項目文字 */}
                      <span
                        className={`
                          font-medium
                          ${isChecked ? 'line-through text-stone-400' : 'text-ink'}
                        `}
                      >
                        {item.item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 提示文字 */}
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">💡 使用提示</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>點擊項目即可勾選/取消勾選</li>
            <li>勾選狀態會自動儲存，下次開啟仍然保留</li>
            <li>建議出發前一天檢查一次，當天再檢查一次</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
