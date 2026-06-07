import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, ExternalLink, X } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { shoppingList as hardcodedShoppingList } from '../data/shoppingList';
import type { ShoppingCategory } from '../data/shoppingList';

interface ShoppingListProps {
  onBack: () => void;
}

const STORAGE_KEY = 'kyushu-shopping-checked';

export function ShoppingList({ onBack }: ShoppingListProps) {
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openLinksFor, setOpenLinksFor] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 從 Supabase 載入購物清單資料（含 localStorage 快取 + fallback）
  const [shoppingListData] = useSupabaseData<ShoppingCategory[]>(
    'kyushu-shopping-list-data',
    async () => {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('shopping_categories')
        .select(`
          id, name, sort_order,
          shopping_items (id, name, store, sort_order,
            shopping_item_links (id, title, url, sort_order)
          )
        `)
        .order('sort_order');

      if (error) {
        console.error('❌ Supabase fetch shopping_categories 失敗:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      return data.map((cat: any) => ({
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
      })) as ShoppingCategory[];
    },
    hardcodedShoppingList
  );

  // 初始化：從 localStorage 讀取勾選狀態
  useEffect(() => {
    const savedChecked = localStorage.getItem(STORAGE_KEY);
    const checkedMap: Record<string, boolean> = savedChecked ? JSON.parse(savedChecked) : {};

    const loadedCategories = shoppingListData.map(cat => ({
      ...cat,
      items: cat.items.map(item => ({
        ...item,
        checked: checkedMap[item.name] ?? item.checked,
      })),
    }));

    setCategories(loadedCategories);
    setIsLoading(false);
  }, [shoppingListData]);

  // 點擊視窗外部關閉 popover 的邏輯已移至 backdrop onClick

  // 切換勾選狀態
  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const newCategories = [...categories];
    const item = newCategories[categoryIndex].items[itemIndex];
    item.checked = !item.checked;
    setCategories(newCategories);

    // 儲存到 localStorage
    const checkedMap: Record<string, boolean> = {};
    newCategories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.checked) {
          checkedMap[item.name] = true;
        }
      });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedMap));
  };

  // 計算進度
  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedItems = categories.reduce(
    (sum, cat) => sum + cat.items.filter(item => item.checked).length,
    0
  );
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-washi flex items-center justify-center">
        <p className="text-stone text-sm tracking-wider">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-washi pb-24">
      {/* Backdrop - 點擊關閉 popover */}
      {openLinksFor !== null && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setOpenLinksFor(null)}
          aria-hidden="true"
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-washi/95 backdrop-blur-sm border-b border-washi-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-11 h-11 text-ink hover:text-stone transition-colors rounded-full hover:bg-washi-card"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <h1 className="text-2xl font-serif font-bold text-ink tracking-wide">
              必買清單
            </h1>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone tracking-wider">
                已購買 {checkedItems} / {totalItems}
              </span>
              <span className="text-[#8C8C8C] tracking-wider">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-washi-card rounded-full overflow-hidden border border-washi-border">
              <div
                className="h-full bg-gradient-to-r from-[#8B6F47] to-[#A0826D] transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {categories.map((category, catIndex) => {
          const hasOpenPopover = category.items.some(item => item.name === openLinksFor);
          return (
          <div
            key={category.category}
            className={`animate-fade-in ${hasOpenPopover ? 'relative z-50' : ''}`}
            style={{ animationDelay: `${catIndex * 100}ms` }}
          >
            {/* Category Title */}
            <h2 className="font-serif text-xl text-ink mb-4 tracking-wide border-b border-washi-border pb-2">
              {category.category}
            </h2>

            {/* Items */}
            <div className="space-y-3">
              {category.items.map((item, itemIndex) => (
                <div
                  key={item.name}
                  onClick={() => toggleItem(catIndex, itemIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleItem(catIndex, itemIndex);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-start gap-4 p-3 rounded-lg hover:bg-washi-card transition-all duration-200 text-left group cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  {/* Custom Checkbox */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div
                      className={`w-6 h-6 rounded border-2 transition-all duration-300 flex items-center justify-center ${
                        item.checked
                          ? 'border-[#8B6F47] bg-[#8B6F47]/5'
                          : 'border-stone-300 group-hover:border-[#8B6F47]/50'
                      }`}
                    >
                      {item.checked && (
                        <Check
                          className="w-4 h-4 text-[#8B6F47]"
                          strokeWidth={2.5}
                          style={{
                            animation: 'checkPop 0.3s ease-out',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className={`text-base transition-all duration-300 ${
                          item.checked
                            ? 'text-stone line-through'
                            : 'text-ink group-hover:text-[#8B6F47]'
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.store && (
                        <span className="text-xs text-[#8C8C8C] tracking-wider border border-stone-200 rounded-full px-2 py-0.5">
                          {item.store}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Links Button */}
                  {item.links && item.links.length > 0 && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenLinksFor(openLinksFor === item.name ? null : item.name);
                        }}
                        className="flex items-center justify-center w-10 h-10 text-[#8B6F47] hover:text-[#6B5437] transition-colors rounded-full hover:bg-washi-card"
                        aria-label="查看參考連結"
                      >
                        <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
                      </button>

                      {/* Popover */}
                      {openLinksFor === item.name && (
                        <div
                          ref={popoverRef}
                          className="absolute right-0 top-10 z-50 w-72 bg-[#FAF8F5] border border-washi-border rounded-lg shadow-2xl ring-1 ring-black/5 overflow-hidden animate-popover-in"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-washi-border bg-washi-card/30">
                            <h3 className="text-sm font-serif font-bold text-ink tracking-wide">
                              參考連結
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenLinksFor(null);
                              }}
                              className="flex items-center justify-center w-9 h-9 text-stone hover:text-ink transition-colors rounded-full hover:bg-washi-card"
                              aria-label="關閉"
                            >
                              <X className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                          </div>

                          {/* Links List */}
                          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                            {item.links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-start gap-2 p-3 rounded-lg hover:bg-washi-card transition-all duration-200 group/link"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-stone group-hover/link:text-[#8B6F47] transition-colors flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                <span className="text-sm text-ink group-hover/link:text-[#8B6F47] transition-colors leading-relaxed">
                                  {link.title}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>

      <style>{`
        @keyframes checkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }

        @keyframes popover-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-popover-in {
          animation: popover-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
