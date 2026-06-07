import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { deleteActivity, reorderActivities } from '../../hooks/useAdminMutations';
import { ActivityModal } from './ActivityModal';
import { ConfirmDialog } from './ConfirmDialog';
import type { ActivityRow } from '../../types/database';

function sortByTime(activities: ActivityRow[]): ActivityRow[] {
  return [...activities].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

interface ActivityListProps {
  dayNum: number;
  onChanged: () => void;
}

export function ActivityList({ dayNum, onChanged }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalActivity, setModalActivity] = useState<ActivityRow | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ActivityRow | null>(null);

  // Visual drag state (useState — only for triggering re-renders)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // dropLineIdx: which index the drop indicator line appears ABOVE; activities.length = below last card
  const [dropLineIdx, setDropLineIdx] = useState<number | null>(null);

  // Core drag logic state — useRef to survive useEffect re-creation
  const isDraggingRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startYRef = useRef(0);
  const sourceIdxRef = useRef(-1);
  const dragOverIdxRef = useRef<number | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);

  const activitiesRef = useRef<ActivityRow[]>([]);
  const wasDraggedRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // Bridge unstable props to refs — touch useEffect reads only refs, deps = []
  const onChangedRef = useRef(onChanged);
  useEffect(() => { onChangedRef.current = onChanged; }, [onChanged]);

  const dayNumRef = useRef(dayNum);
  useEffect(() => { dayNumRef.current = dayNum; }, [dayNum]);

  // Keep activitiesRef in sync with state
  useEffect(() => { activitiesRef.current = activities; }, [activities]);

  // Trim stale cardRefs when activities length changes
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, activities.length);
  }, [activities.length]);

  const loadActivities = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('day', dayNum)
      .order('sort_order');
    const sorted = sortByTime((data as ActivityRow[]) ?? []);
    setActivities(sorted);
    if (sorted.length > 0) {
      await reorderActivities(dayNum, sorted.map((a) => a.id));
    }
    setLoading(false);
  }, [dayNum]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  // Native Touch Events — mounted ONCE (deps=[]), reads refs to avoid stale closures
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const cancelTimer = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const findScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      while (node) {
        const style = getComputedStyle(node);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') return node;
        node = node.parentElement;
      }
      return null;
    };

    const onStart = (e: TouchEvent) => {
      const card = (e.target as HTMLElement).closest('[data-card-idx]') as HTMLElement | null;
      if (!card) return;
      if ((e.target as HTMLElement).closest('[data-delete-btn]')) return;
      if ((e.target as HTMLElement).closest('[data-move-btn]')) return;
      sourceIdxRef.current = parseInt(card.dataset.cardIdx ?? '-1', 10);
      if (sourceIdxRef.current < 0) return;
      startYRef.current = e.touches[0].clientY;
      wasDraggedRef.current = false;

      longPressTimerRef.current = setTimeout(() => {
        isDraggingRef.current = true;
        dragOverIdxRef.current = sourceIdxRef.current;
        setDragIndex(sourceIdxRef.current);
        setDropLineIdx(null);

        // Lock scroll parent to prevent page scroll interfering with drag
        scrollParentRef.current = findScrollParent(el.parentElement);
        if (scrollParentRef.current) scrollParentRef.current.style.overflowY = 'hidden';
      }, 500);
    };

    const onMove = (e: TouchEvent) => {
      const dy = Math.abs(e.touches[0].clientY - startYRef.current);
      if (!isDraggingRef.current) {
        if (dy > 8) cancelTimer(); // scrolling — cancel long press
        return;
      }
      e.preventDefault(); // prevent page scroll during drag

      const y = e.touches[0].clientY;
      let hoverIdx = dragOverIdxRef.current ?? sourceIdxRef.current;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) hoverIdx = i;
      });

      if (hoverIdx !== dragOverIdxRef.current) {
        dragOverIdxRef.current = hoverIdx;
        const src = sourceIdxRef.current;
        // Visual drop line position:
        // Moving up: show line ABOVE hoverIdx
        // Moving down: show line BELOW hoverIdx (= above hoverIdx+1)
        // Back to original: no line
        if (hoverIdx === src) {
          setDropLineIdx(null);
        } else if (hoverIdx < src) {
          setDropLineIdx(hoverIdx);
        } else {
          setDropLineIdx(hoverIdx + 1);
        }
      }
    };

    const onEnd = async () => {
      cancelTimer();
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      wasDraggedRef.current = true;

      // Restore scroll
      if (scrollParentRef.current) {
        scrollParentRef.current.style.overflowY = '';
        scrollParentRef.current = null;
      }

      const from = sourceIdxRef.current;
      const to = dragOverIdxRef.current;
      dragOverIdxRef.current = null;
      setDragIndex(null);
      setDropLineIdx(null);

      if (from >= 0 && to !== null && from !== to) {
        const newArr = [...activitiesRef.current];
        const [moved] = newArr.splice(from, 1);
        newArr.splice(to, 0, moved);
        setActivities(newArr);
        await reorderActivities(dayNumRef.current, newArr.map((a) => a.id));
        onChangedRef.current();
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, []); // Mount once — all values accessed via refs

  const handleMove = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= activities.length) return;
    const newArr = [...activities];
    [newArr[idx], newArr[targetIdx]] = [newArr[targetIdx], newArr[idx]];
    setActivities(newArr);
    await reorderActivities(dayNum, newArr.map((a) => a.id));
    onChangedRef.current();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteActivity(deleteTarget.id);
    setDeleteTarget(null);
    await loadActivities();
    onChangedRef.current();
  };

  const handleModalSaved = async () => {
    await loadActivities();
    onChangedRef.current();
  };

  if (loading) return <div className="py-8 text-center text-sm text-[#8C8C8C]">載入中...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">景點行程</h3>
        <button
          onClick={() => setModalActivity(null)}
          className="flex items-center gap-1.5 text-sm text-[#2C4F7C] hover:text-[#1e3a5f] cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增景點
        </button>
      </div>

      {/* 空狀態 */}
      {activities.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-stone-400">
          <MapPin className="w-10 h-10 opacity-30" />
          <p className="text-sm text-center">還沒有行程，點擊「新增景點」開始規劃！</p>
        </div>
      )}

      {/* 景點清單 — 始終按原始 activities 順序渲染，拖移時以指示線標記插入位置 */}
      <div ref={listRef} className="space-y-3">
        {activities.map((a, idx) => {
          const isDraggingThis = dragIndex === idx;
          const showDropAbove = dropLineIdx === idx;

          return (
            <div key={a.id}>
              {/* Drop indicator line above this card */}
              {showDropAbove && (
                <div className="h-0.5 bg-[#2C4F7C] rounded-full mx-2 mb-1.5 transition-all" />
              )}

              <div
                data-card-idx={idx}
                ref={(el) => { cardRefs.current[idx] = el; }}
                onClick={() => {
                  if (wasDraggedRef.current) { wasDraggedRef.current = false; return; }
                  setModalActivity(a);
                }}
                className={`border border-stone-200 rounded-lg bg-white select-none cursor-pointer transition-all duration-150 ${
                  isDraggingThis
                    ? 'opacity-50 scale-[1.03] shadow-lg ring-2 ring-[#2C4F7C]/30'
                    : 'hover:border-stone-300 hover:shadow-sm active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-3">
                  {/* 上下移動按鈕 */}
                  <div data-move-btn className="flex flex-col flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMove(idx, 'up'); }}
                      className={`p-1 rounded transition-colors ${idx === 0 ? 'opacity-30 pointer-events-none' : 'text-stone-400 hover:text-[#2C4F7C] hover:bg-stone-100 cursor-pointer'}`}
                      title="上移"
                      aria-label="上移"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMove(idx, 'down'); }}
                      className={`p-1 rounded transition-colors ${idx === activities.length - 1 ? 'opacity-30 pointer-events-none' : 'text-stone-400 hover:text-[#2C4F7C] hover:bg-stone-100 cursor-pointer'}`}
                      title="下移"
                      aria-label="下移"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 景點資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-[#8C8C8C] flex-shrink-0">{a.time}</span>
                      <span className="text-sm font-medium text-[#2C2C2C] truncate">{a.title}</span>
                    </div>
                    {(a.is_kid_friendly || a.is_senior_friendly) && (
                      <div className="flex gap-1.5 mt-1">
                        {a.is_kid_friendly && (
                          <span className="text-xs border border-pink-200 text-pink-500 rounded-full px-2 py-0.5">親子</span>
                        )}
                        {a.is_senior_friendly && (
                          <span className="text-xs border border-red-200 text-red-400 rounded-full px-2 py-0.5">長輩友善</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 刪除按鈕 */}
                  <button
                    data-delete-btn
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(a); }}
                    className="p-2 rounded-lg text-[#C4C4C4] hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors flex-shrink-0"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Drop indicator line below last card */}
        {dropLineIdx === activities.length && activities.length > 0 && (
          <div className="h-0.5 bg-[#2C4F7C] rounded-full mx-2 transition-all" />
        )}
      </div>

      {/* 景點編輯 Modal */}
      {modalActivity !== undefined && (
        <ActivityModal
          activity={modalActivity}
          dayNum={dayNum}
          nextOrder={activities.length}
          onSaved={handleModalSaved}
          onClose={() => setModalActivity(undefined)}
        />
      )}

      {/* 刪除確認 Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="刪除景點"
        message={`確定要刪除「${deleteTarget?.title ?? ''}」嗎？此動作無法復原。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
