import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Home, Ticket, Hotel, CheckSquare, MoreHorizontal,
  ShoppingCart, Map, CalendarCheck, Phone, Copy, Settings,
} from 'lucide-react';

type Page = 'itinerary' | 'accommodation' | 'emergency' | 'packing' | 'shopping' | 'tickets' | 'full-route' | 'reservation';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onOpenAdmin?: () => void;
  onCopyItinerary?: () => void;
}

const MAIN_TABS: { id: Page; icon: LucideIcon; label: string }[] = [
  { id: 'itinerary',     icon: Home,        label: '行程' },
  { id: 'tickets',       icon: Ticket,      label: '票券' },
  { id: 'accommodation', icon: Hotel,       label: '住宿' },
  { id: 'packing',       icon: CheckSquare, label: '清單' },
];

const MORE_ITEMS: { id: Page; icon: LucideIcon; label: string }[] = [
  { id: 'shopping',    icon: ShoppingCart,  label: '購物清單' },
  { id: 'full-route',  icon: Map,           label: '全行程路線' },
  { id: 'reservation', icon: CalendarCheck, label: '預約清單' },
  { id: 'emergency',   icon: Phone,         label: '緊急聯絡' },
];

export function BottomNav({ currentPage, onNavigate, onOpenAdmin, onCopyItinerary }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const handleMoreItemClick = (page: Page) => {
    onNavigate(page);
    setMoreOpen(false);
  };

  return (
    <>
      {/* 底部導覽列 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-washi-card/95 backdrop-blur-sm border-t border-washi-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="主要導覽"
      >
        <div className="flex items-stretch">
          {MAIN_TABS.map(({ id, icon: Icon, label }) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 relative transition-all duration-200 rounded-none ${
                  isActive
                    ? 'text-ai bg-ai/5'
                    : 'text-stone hover:text-ink hover:bg-stone-100/60'
                }`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* 選中指示點 */}
                {isActive && (
                  <span className="absolute top-1 w-1 h-1 rounded-full bg-ai" aria-hidden="true" />
                )}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}

          {/* 更多按鈕 */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 relative transition-all duration-200 rounded-none ${
              moreOpen
                ? 'text-ai bg-ai/5'
                : 'text-stone hover:text-ink hover:bg-stone-100/60'
            }`}
            aria-label="更多"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">更多</span>
          </button>
        </div>
      </nav>

      {/* 更多底部面板 */}
      {moreOpen && (
        <>
          {/* 半透明遮罩 */}
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />

          {/* 滑上面板 */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-washi-card rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
            role="dialog"
            aria-label="更多功能"
          >
            {/* 拖曳指示條 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-washi-border rounded-full" />
            </div>

            <div className="px-3 pb-2">
              {MORE_ITEMS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => handleMoreItemClick(id)}
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-lg text-ink hover:bg-washi transition-colors duration-150 text-sm font-medium border-b border-stone-100/80 last:border-b-0"
                >
                  <Icon className="w-5 h-5 text-stone" strokeWidth={1.5} />
                  {label}
                </button>
              ))}

              {/* 複製行程 */}
              {onCopyItinerary && (
                <button
                  onClick={() => { onCopyItinerary(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-lg text-ink hover:bg-washi transition-colors duration-150 text-sm font-medium border-b border-stone-100/80"
                >
                  <Copy className="w-5 h-5 text-stone" strokeWidth={1.5} />
                  複製行程
                </button>
              )}

              {/* 管理後台（低調）*/}
              {onOpenAdmin && (
                <button
                  onClick={() => { onOpenAdmin(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-lg opacity-50 hover:opacity-80 text-ink hover:bg-washi transition-all duration-150 text-sm font-medium"
                >
                  <Settings className="w-5 h-5 text-stone" strokeWidth={1.5} />
                  管理後台
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
