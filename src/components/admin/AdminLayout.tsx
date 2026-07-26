import { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, X, RefreshCw, MapPin, Car, Hotel, Ticket, Calendar, ShoppingBag, Package, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { DayEditor } from './DayEditor';
import { ActivityList } from './ActivityList';
import { TransportEditor } from './TransportEditor';
import { AccommodationEditor } from './AccommodationEditor';
import { TicketEditor } from './TicketEditor';
import { PackingListEditor } from './PackingListEditor';
import { ShoppingListEditor } from './ShoppingListEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { createDay, deleteDay } from '../../hooks/useAdminMutations';
import { triggerSnapshot } from '../../lib/snapshotTrigger';
import type { DayPlanViewRow } from '../../types/database';

type Section = 'day' | 'activities' | 'transport' | 'accommodation' | 'tickets';
type GlobalSection = 'packing' | 'shopping';
type ActiveView = Section | GlobalSection;

const SECTIONS: { id: Section; label: string; Icon: React.ElementType }[] = [
  { id: 'day',           label: '基本資訊', Icon: Calendar },
  { id: 'activities',    label: '景點行程', Icon: MapPin },
  { id: 'transport',     label: '交通方式', Icon: Car },
  { id: 'accommodation', label: '住宿資訊', Icon: Hotel },
  { id: 'tickets',       label: '交通票券', Icon: Ticket },
];

const GLOBAL_SECTIONS: { id: GlobalSection; label: string; Icon: React.ElementType }[] = [
  { id: 'packing',  label: '打包清單', Icon: Package },
  { id: 'shopping', label: '購物清單', Icon: ShoppingBag },
];

interface AdminLayoutProps {
  onClose: () => void;
}

export function AdminLayout({ onClose }: AdminLayoutProps) {
  const { user, signOut } = useAdminAuth();
  const [days, setDays] = useState<DayPlanViewRow[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeView, setActiveView] = useState<ActiveView>('day');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [showAddDayForm, setShowAddDayForm] = useState(false);
  const [addDayTitle, setAddDayTitle]       = useState('');
  const [addDayDate, setAddDayDate]         = useState('');
  const [addDayLoading, setAddDayLoading]   = useState(false);
  const [addDayError, setAddDayError]       = useState<string | null>(null);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<number | null>(null);
  const [deleteDayLoading, setDeleteDayLoading] = useState(false);
  const [deleteDayError, setDeleteDayError] = useState<string | null>(null);

  const tabBarRef = useRef<HTMLDivElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);

  const loadDays = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('day_plans').select('*').order('day');
    setDays((data as DayPlanViewRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadDays(); }, [refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    // 編輯儲存後去抖動觸發雲端備份（未設定 /api/snapshot 時自動忽略）
    triggerSnapshot();
  }, []);

  const currentDay = days.find((d) => d.day === selectedDay);
  const isDayView = activeView !== 'packing' && activeView !== 'shopping';

  const handleSignOut = async () => {
    await signOut();
  };

  const sectionIds = SECTIONS.map((s) => s.id);
  const currentSectionIdx = isDayView ? sectionIds.indexOf(activeView as Section) : -1;

  // Tab scrollIntoView when activeView changes
  useEffect(() => {
    if (!tabBarRef.current || !isDayView) return;
    const el = tabBarRef.current.querySelector(`[data-tab-id="${activeView}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeView, isDayView]);

  // Native touch events for vertical lock + swipe detection
  useEffect(() => {
    const el = editorAreaRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let isHorizontal: boolean | null = null;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isHorizontal = null;
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (isHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHorizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (isHorizontal) e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      if (!isDayView && currentSectionIdx < 0) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (!isHorizontal || Math.abs(dx) < 50) return;

      if (dx > 0 && currentSectionIdx === 0) {
        // 第一個 tab 右滑 → 開側邊欄
        setSidebarOpen(true);
      } else if (dx > 0 && currentSectionIdx > 0) {
        setSlideDir('right');
        setActiveView(sectionIds[currentSectionIdx - 1]);
      } else if (dx < 0 && currentSectionIdx < sectionIds.length - 1) {
        setSlideDir('left');
        setActiveView(sectionIds[currentSectionIdx + 1]);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [isDayView, currentSectionIdx, sectionIds]);

  const handleAddDay = async () => {
    if (!addDayTitle.trim()) return;
    setAddDayLoading(true);
    setAddDayError(null);
    try {
      const newDayNum = await createDay({
        title: addDayTitle.trim(),
        date: addDayDate.trim() || undefined,
        themeColor: 'blue',
      });
      setAddDayTitle('');
      setAddDayDate('');
      setShowAddDayForm(false);
      setSelectedDay(newDayNum);
      setActiveView('day');
      refresh();
    } catch (err) {
      console.error('新增天數失敗:', err);
      let msg: string;
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === 'object') {
        msg = JSON.stringify(err);
      } else {
        msg = String(err);
      }
      setAddDayError(msg);
    } finally {
      setAddDayLoading(false);
    }
  };

  const resetAddDayForm = () => {
    setShowAddDayForm(false);
    setAddDayTitle('');
    setAddDayDate('');
  };

  const handleAddDayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !addDayLoading) handleAddDay();
    if (e.key === 'Escape') resetAddDayForm();
  };

  const handleDeleteDayConfirmed = async () => {
    if (confirmDeleteDay === null) return;
    setDeleteDayLoading(true);
    setDeleteDayError(null);
    try {
      await deleteDay(confirmDeleteDay);
      if (selectedDay === confirmDeleteDay) {
        setSelectedDay(1);
        setActiveView('day');
      }
      setConfirmDeleteDay(null);
      refresh();
    } catch (err) {
      console.error('刪除天數失敗:', err);
      const msg = err instanceof Error ? err.message
        : (err && typeof err === 'object') ? JSON.stringify(err)
        : String(err);
      setDeleteDayError(msg);
    } finally {
      setDeleteDayLoading(false);
    }
  };

  const handleTabClick = (id: ActiveView) => {
    if (isDayView && sectionIds.includes(id as Section)) {
      const newIdx = sectionIds.indexOf(id as Section);
      setSlideDir(newIdx > currentSectionIdx ? 'left' : 'right');
    }
    setActiveView(id);
  };

  return (
    <div className="fixed inset-0 bg-[#FAF8F5] z-50 flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
            aria-label="開啟選單"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className="block h-0.5 bg-[#2C2C2C] rounded" />
              <span className="block h-0.5 bg-[#2C2C2C] rounded" />
              <span className="block h-0.5 bg-[#2C2C2C] rounded" />
            </div>
          </button>
          <h1 className="font-serif text-lg text-[#2C2C2C]">管理後台</h1>
          {activeView === 'packing' ? (
            <span className="hidden sm:block text-sm text-[#8C8C8C]">打包清單</span>
          ) : activeView === 'shopping' ? (
            <span className="hidden sm:block text-sm text-[#8C8C8C]">購物清單</span>
          ) : currentDay ? (
            <span className="hidden sm:block text-sm text-[#8C8C8C]">
              Day {currentDay.day} · {currentDay.title}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="p-2 rounded-lg text-[#8C8C8C] hover:text-[#2C2C2C] hover:bg-stone-100 cursor-pointer transition-colors" title="重新整理">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="hidden sm:block text-xs text-[#8C8C8C] max-w-[120px] truncate">{user?.email}</span>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#8C8C8C] hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">登出</span>
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-[#8C8C8C] hover:text-[#2C2C2C] hover:bg-stone-100 cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar overlay on mobile */}
        <div
          className={`absolute inset-0 z-30 bg-black/20 md:hidden transition-opacity duration-200 ${
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar — day list */}
        <aside className={`
          absolute inset-y-0 left-0 z-40 w-52 bg-white border-r border-stone-200 flex flex-col
          transition-transform duration-200 ease-out
          md:static md:translate-x-0
          ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
        `}>
          {/* 行程編輯 section */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">行程編輯</p>
          </div>
          <nav className="overflow-y-auto flex-1 py-1">
            {loading ? (
              <div className="p-4 text-sm text-[#8C8C8C]">載入中...</div>
            ) : (
              days.map((d) => {
                const isActive = d.day === selectedDay && isDayView;
                return (
                  <div key={d.day} className="relative group">
                    <button
                      onClick={() => {
                        setSelectedDay(d.day);
                        setActiveView('day');
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left pl-4 pr-8 py-2.5 text-sm cursor-pointer transition-colors border-l-2 ${
                        isActive
                          ? 'border-l-[#2C4F7C] bg-[#2C4F7C]/8 text-[#2C4F7C] font-medium'
                          : 'border-l-transparent text-[#2C2C2C] hover:bg-stone-100/80'
                      }`}
                    >
                      <span className="block text-xs text-[#8C8C8C]">Day {d.day} · {d.date}</span>
                      <span className="block truncate">{d.title}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteDay(d.day); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2
                                 opacity-0 group-hover:opacity-100
                                 w-6 h-6 flex items-center justify-center
                                 rounded text-stone-400 hover:text-red-500 hover:bg-red-50
                                 transition-all duration-150 cursor-pointer"
                      title={`刪除 Day ${d.day}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}

            {/* 新增天數 */}
            {!showAddDayForm ? (
              <button
                onClick={() => setShowAddDayForm(true)}
                className="w-full flex items-center gap-1.5 px-4 py-2
                           text-sm text-stone-400 hover:text-[#2C4F7C]
                           hover:bg-stone-50 cursor-pointer transition-colors
                           border-l-2 border-l-transparent"
              >
                <Plus className="w-3.5 h-3.5" />
                新增天數
              </button>
            ) : (
              <div className="mx-3 my-2 p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-[#2C4F7C] font-semibold">新增天數</p>
                <input
                  type="text"
                  placeholder="當日標題（必填）"
                  value={addDayTitle}
                  onChange={(e) => setAddDayTitle(e.target.value)}
                  onKeyDown={handleAddDayKeyDown}
                  autoFocus
                  className="admin-input text-sm"
                />
                <input
                  type="text"
                  placeholder="日期（選填，如：7/17（四））"
                  value={addDayDate}
                  onChange={(e) => setAddDayDate(e.target.value)}
                  onKeyDown={handleAddDayKeyDown}
                  className="admin-input text-sm"
                />
                {addDayError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1 break-all">
                    ⚠️ {addDayError}
                  </p>
                )}
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={handleAddDay}
                    disabled={!addDayTitle.trim() || addDayLoading}
                    className="admin-save-btn flex-1 justify-center text-xs py-1.5"
                  >
                    {addDayLoading
                      ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      : <Plus className="w-3 h-3" />}
                    {addDayLoading ? '新增中...' : '確認新增'}
                  </button>
                  <button
                    onClick={resetAddDayForm}
                    className="px-2.5 py-1.5 text-xs text-stone-400 hover:text-[#2C2C2C] hover:bg-stone-100 rounded cursor-pointer transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 清單管理 section */}
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="px-4 pb-1 text-[10px] uppercase tracking-widest text-stone-400 font-semibold">清單管理</p>
              {GLOBAL_SECTIONS.map(({ id, label, Icon }) => {
                const isActive = activeView === id;
                return (
                  <button
                    key={id}
                    onClick={() => { setActiveView(id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors border-l-2 ${
                      isActive
                        ? 'border-l-[#2C4F7C] bg-[#2C4F7C]/8 text-[#2C4F7C] font-medium'
                        : 'border-l-transparent text-[#2C2C2C] hover:bg-stone-100/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Section tabs — only show for day-based views */}
          {isDayView && (
            <div
              ref={tabBarRef}
              className="flex overflow-x-auto border-b border-stone-200 bg-white px-4 gap-1 scrollbar-hide"
            >
              {SECTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  data-tab-id={id}
                  onClick={() => handleTabClick(id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap cursor-pointer transition-all duration-200 border-b-2 -mb-px ${
                    activeView === id
                      ? 'border-[#2C4F7C] text-[#2C4F7C] font-medium'
                      : 'border-transparent text-[#8C8C8C] hover:text-[#2C2C2C]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Editor area */}
          <div
            ref={editorAreaRef}
            className="flex-1 overflow-y-auto p-4 md:p-6"
          >
            <div
              key={activeView}
              style={{
                animation: slideDir
                  ? `slideInFrom${slideDir === 'left' ? 'Right' : 'Left'} 0.22s ease-out`
                  : undefined,
              }}
              onAnimationEnd={() => setSlideDir(null)}
            >
              {activeView === 'packing' && <PackingListEditor />}
              {activeView === 'shopping' && <ShoppingListEditor />}
              {isDayView && (
                !currentDay ? (
                  <div className="text-center py-16 text-[#8C8C8C]">
                    <p>請選擇左側天數</p>
                  </div>
                ) : (
                  <div key={currentDay.day} className="max-w-2xl mx-auto">
                    {activeView === 'day' && (
                      <DayEditor day={currentDay} onSaved={refresh} />
                    )}
                    {activeView === 'activities' && (
                      <ActivityList dayNum={currentDay.day} onChanged={refresh} />
                    )}
                    {activeView === 'transport' && (
                      <TransportEditor day={currentDay} onSaved={refresh} />
                    )}
                    {activeView === 'accommodation' && (
                      <AccommodationEditor
                        day={currentDay}
                        onSaved={refresh}
                        prevDayAccommodation={
                          currentDay.day >= 2
                            ? (days.find((d) => d.day === currentDay.day - 1)?.accommodation ?? null)
                            : null
                        }
                      />
                    )}
                    {activeView === 'tickets' && (
                      <TicketEditor dayNum={currentDay.day} onChanged={refresh} />
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteDay !== null}
        title={`刪除 Day ${confirmDeleteDay}？`}
        message={
          deleteDayError
            ? `刪除失敗：${deleteDayError}`
            : `此操作將永久刪除 Day ${confirmDeleteDay} 的所有景點行程、交通方式、住宿資訊、交通票券及附件。後續天數將自動重新編號。此操作無法復原。`
        }
        confirmLabel={deleteDayLoading ? '刪除中...' : '確認刪除'}
        onConfirm={handleDeleteDayConfirmed}
        onCancel={() => { if (!deleteDayLoading) { setConfirmDeleteDay(null); setDeleteDayError(null); } }}
      />

      {/* Global admin styles */}
      <style>{`
        .admin-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #E7E5E4;
          background: white;
          color: #2C2C2C;
          font-size: 1rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .admin-input:focus {
          outline: none;
          border-color: #2C4F7C;
          box-shadow: 0 0 0 3px rgba(44,79,124,0.15);
        }
        .admin-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #8C8C8C;
          margin-bottom: 0.375rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .admin-save-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          background: #2C4F7C;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .admin-save-btn:hover { background: #1e3a5f; }
        .admin-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes slideInFromRight {
          from { transform: translateX(30px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}
