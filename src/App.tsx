import { useState } from 'react';
import { Header } from './components/Header';
import { DayTabs } from './components/DayTabs';
import { DayView } from './components/DayView';
import { BottomNav } from './components/BottomNav';
import { AccommodationOverview } from './components/AccommodationOverview';
import { EmergencyContacts } from './components/EmergencyContacts';
import { PackingList } from './components/PackingList';
import { ShoppingList } from './components/ShoppingList';
import { TicketsOverview } from './components/TicketsOverview';
import { FullRouteMap } from './components/FullRouteMap';
import { ReservationChecklist } from './components/ReservationChecklist';
import { AdminGuard } from './components/admin/AdminGuard';
import { AdminLayout } from './components/admin/AdminLayout';
import { useItinerary } from './hooks/useItinerary';
import { CopyItineraryPopover } from './components/CopyItineraryPopover';

type Page = 'itinerary' | 'accommodation' | 'emergency' | 'packing' | 'shopping' | 'tickets' | 'full-route' | 'reservation';

const SWIPEABLE_BACK_PAGES = new Set<Page>(['packing', 'shopping', 'accommodation', 'tickets', 'reservation']);

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('itinerary');
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [initialTicketDay, setInitialTicketDay] = useState<number | undefined>(undefined);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const [copyPopoverOpen, setCopyPopoverOpen] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // 使用 Supabase 資料（含 localStorage 快取 + fallback）
  const [itinerary] = useItinerary();

  const currentDayPlan = itinerary.find((day) => day.day === selectedDay);
  const dayColors = itinerary.map((day) => day.themeColor);

  // Tab 切換（帶方向）
  const handleSelectDay = (newDay: number) => {
    if (newDay > selectedDay) {
      setSlideDirection('left');
    } else if (newDay < selectedDay) {
      setSlideDirection('right');
    }
    setSelectedDay(newDay);
  };

  const handleNavigateToTickets = (day: number) => {
    setInitialTicketDay(day);
    setCurrentPage('tickets');
  };

  // 滑動切換天數
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStart.x - touchEndX;
    const diffY = touchStart.y - touchEndY;
    const duration = Date.now() - touchStart.time;
    const minSwipeDistance = 50;

    // 防止誤觸：垂直移動為主時不切換（捲動/選取）
    if (Math.abs(diffY) >= Math.abs(diffX)) {
      setTouchStart(null);
      return;
    }

    // 防止誤觸：長按/選取文字時不切換
    if (duration > 300) {
      setTouchStart(null);
      return;
    }

    // 水平滑動切換
    if (Math.abs(diffX) > minSwipeDistance) {
      if (currentPage === 'itinerary') {
        if (diffX > 0) {
          // 向左滑 → 下一天
          if (selectedDay < itinerary.length) {
            setSlideDirection('left');
            setSelectedDay(selectedDay + 1);
          }
        } else {
          // 向右滑 → 上一天
          if (selectedDay > 1) {
            setSlideDirection('right');
            setSelectedDay(selectedDay - 1);
          }
        }
      } else if (SWIPEABLE_BACK_PAGES.has(currentPage)) {
        if (diffX < 0) {
          // 向右滑 → 返回行程主畫面
          setCurrentPage('itinerary');
        }
      }
    }

    setTouchStart(null);
  };

  // 動態套用滑動動畫 class
  const slideClass = slideDirection === 'left'
    ? 'slide-in-left'
    : slideDirection === 'right'
    ? 'slide-in-right'
    : '';

  return (
    <div className="min-h-screen bg-washi">
      {/* 行程頁面 */}
      {currentPage === 'itinerary' && (
        <>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-ai focus:text-white focus:rounded-lg"
          >
            跳到主要內容
          </a>
          <Header />
          <DayTabs
            totalDays={itinerary.length}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
            dayColors={dayColors}
            selectedDayDate={currentDayPlan?.date}
          />
          <div
            id="main-content"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`${slideClass} pb-20`}
          >
            {currentDayPlan && (
              <DayView
                key={selectedDay}
                day={currentDayPlan}
                prevAccommodation={itinerary.find(d => d.day === selectedDay - 1)?.accommodation}
                onNavigateToTickets={() => handleNavigateToTickets(selectedDay)}
                onNavigateToAccommodation={() => setCurrentPage('accommodation')}
              />
            )}
          </div>
        </>
      )}

      {/* 住宿總覽頁面 */}
      {currentPage === 'accommodation' && (
        <div className="pb-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <AccommodationOverview onBack={() => setCurrentPage('itinerary')} />
        </div>
      )}

      {/* 緊急聯絡頁面 */}
      {currentPage === 'emergency' && (
        <div className="pb-20">
          <EmergencyContacts onBack={() => setCurrentPage('itinerary')} />
        </div>
      )}

      {/* 打包清單頁面 */}
      {currentPage === 'packing' && (
        <div className="pb-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <PackingList onBack={() => setCurrentPage('itinerary')} />
        </div>
      )}

      {/* 必買清單頁面 */}
      {currentPage === 'shopping' && (
        <div className="pb-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <ShoppingList onBack={() => setCurrentPage('itinerary')} />
        </div>
      )}

      {/* 交通票券頁面 */}
      {currentPage === 'tickets' && (
        <div className="pb-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <TicketsOverview
            onBack={() => {
              setCurrentPage('itinerary');
              setInitialTicketDay(undefined);
            }}
            initialDay={initialTicketDay}
          />
        </div>
      )}

      {/* 全行程路線頁面 */}
      {currentPage === 'full-route' && (
        <div className="pb-20">
          <FullRouteMap onBack={() => setCurrentPage('itinerary')} />
        </div>
      )}

      {/* 預約 Checklist 頁面 */}
      {currentPage === 'reservation' && (
        <div className="pb-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <ReservationChecklist onBack={() => setCurrentPage('itinerary')} />
        </div>
      )}

      {/* 底部導覽列（所有頁面都顯示）*/}
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenAdmin={() => setAdminOpen(true)}
        onCopyItinerary={() => setCopyPopoverOpen(true)}
      />

      {/* 複製行程 Popover */}
      {copyPopoverOpen && (
        <CopyItineraryPopover
          itinerary={itinerary}
          selectedDay={selectedDay}
          onClose={() => setCopyPopoverOpen(false)}
          onCopySuccess={(message) => {
            setCopyToast(message);
            setTimeout(() => setCopyToast(null), 2000);
          }}
        />
      )}

      {/* 複製成功 Toast */}
      {copyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full text-sm font-medium shadow-lg bg-[#2C4F7C] text-white">
          {copyToast}
        </div>
      )}

      {/* Admin 後台（長按選單圖示開啟）*/}
      {adminOpen && (
        <div className="fixed inset-0 z-50">
          <AdminGuard onClose={() => setAdminOpen(false)}>
            <AdminLayout
              onClose={() => {
                setAdminOpen(false);
                // 關閉後台後清除 itinerary 快取，強制前台重新向 Supabase fetch 最新資料
                window.dispatchEvent(new CustomEvent('supabase-cache-invalidate'));
              }}
            />
          </AdminGuard>
        </div>
      )}
    </div>
  );
}

export default App;
