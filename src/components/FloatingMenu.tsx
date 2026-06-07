import { useState, useRef } from 'react';
import { Menu, X, Hotel, Phone, CheckSquare, ShoppingCart, Ticket, Map, Settings, Copy, CalendarCheck } from 'lucide-react';

interface FloatingMenuProps {
  onNavigate: (page: 'accommodation' | 'emergency' | 'packing' | 'shopping' | 'tickets' | 'full-route' | 'reservation') => void;
  onOpenAdmin?: () => void;
  onCopyItinerary?: () => void;
}

export function FloatingMenu({ onNavigate, onOpenAdmin, onCopyItinerary }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuItems = [
    { id: 'full-route' as const, icon: Map, label: '全行程路線' },
    { id: 'reservation' as const, icon: CalendarCheck, label: '預約清單' },
    { id: 'shopping' as const, icon: ShoppingCart, label: '必買清單' },
    { id: 'tickets' as const, icon: Ticket, label: '交通票券' },
    { id: 'accommodation' as const, icon: Hotel, label: '住宿總覽' },
    { id: 'emergency' as const, icon: Phone, label: '緊急聯絡' },
    { id: 'packing' as const, icon: CheckSquare, label: '打包清單' },
  ];

  const handleItemClick = (id: 'full-route' | 'accommodation' | 'emergency' | 'packing' | 'shopping' | 'tickets' | 'reservation') => {
    onNavigate(id);
    setIsOpen(false);
  };

  // 長按 600ms 開啟 admin
  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsOpen(false);
      onOpenAdmin?.();
    }, 600);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      {/* 主按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#2C4F7C] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        aria-label={isOpen ? '關閉選單' : '開啟選單'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* 選單項目（由下往上展開）*/}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col-reverse gap-3">
          {/* Admin 入口（隱藏，僅在展開時顯示小圖示） */}
          {onOpenAdmin && (
            <button
              onClick={() => { onOpenAdmin(); setIsOpen(false); }}
              className="fab-item bg-washi-card border border-washi-border rounded-full shadow-lg hover:shadow-xl px-4 py-3 flex items-center gap-2 whitespace-nowrap transition-all duration-200 hover:scale-105 opacity-70 hover:opacity-100"
              style={{
                animation: 'fabSlideIn 0.3s ease-out forwards',
                animationDelay: `${menuItems.length * 50}ms`,
              } as React.CSSProperties}
            >
              <Settings className="w-5 h-5 text-[#2C4F7C]" />
              <span className="font-medium text-ink">管理後台</span>
            </button>
          )}

          {/* 複製行程按鈕 */}
          {onCopyItinerary && (
            <button
              onClick={() => { onCopyItinerary(); setIsOpen(false); }}
              className="fab-item bg-washi-card border border-washi-border rounded-full shadow-lg hover:shadow-xl px-4 py-3 flex items-center gap-2 whitespace-nowrap transition-all duration-200 hover:scale-105"
              style={{
                animation: 'fabSlideIn 0.3s ease-out forwards',
                animationDelay: `${menuItems.length * 50}ms`,
                opacity: 0,
              } as React.CSSProperties}
            >
              <Copy className="w-5 h-5 text-[#2C4F7C]" />
              <span className="font-medium text-ink">複製行程</span>
            </button>
          )}

          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="fab-item bg-washi-card border border-washi-border rounded-full shadow-lg hover:shadow-xl px-4 py-3 flex items-center gap-2 whitespace-nowrap transition-all duration-200 hover:scale-105"
                style={{
                  '--stagger-index': index,
                  animation: 'fabSlideIn 0.3s ease-out forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                } as React.CSSProperties}
              >
                <Icon
                  className="w-5 h-5 text-[#2C4F7C]"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                />
                <span
                  className="font-medium text-ink"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 背景遮罩（點擊關閉選單）*/}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes fabSlideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fab-item {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
