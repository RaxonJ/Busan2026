import { useState } from 'react';
import { Layers, BookOpen, Ticket, ChevronRight, FileText, Image as ImageIcon } from 'lucide-react';
import type { DayPlan, Accommodation, Attachment } from '../types/itinerary';
import { resolveThemeColor, withOpacity } from '../utils/colors';
import { ActivityCard } from './ActivityCard';
import { TransportSummary } from './TransportSummary';
import { AccommodationCard } from './AccommodationCard';
import { DayBriefing } from './DayBriefing';
import AttachmentModal from './AttachmentModal';

interface DayViewProps {
  day: DayPlan;
  prevAccommodation?: Accommodation;
  onNavigateToTickets?: () => void;
  onNavigateToAccommodation?: () => void;
}

export function DayView({
  day,
  prevAccommodation,
  onNavigateToTickets,
  onNavigateToAccommodation,
}: DayViewProps) {
  const timelineColor = resolveThemeColor(day.themeColor);

  // 媒體（地圖 + 照片）展開狀態 — 合一控制
  const [mapStates, setMapStates] = useState<Record<number, boolean>>({});
  const [photoStates, setPhotoStates] = useState<Record<number, boolean>>({});
  const [accommodationPhotoOpen, setAccommodationPhotoOpen] = useState(false);
  const [allMediaOpen, setAllMediaOpen] = useState(false);

  // 行程卡片展開狀態 — 以 activity.priority === 'must' 為初始值
  const [cardExpandStates, setCardExpandStates] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    day.activities.forEach((activity, index) => {
      init[index] = activity.priority === 'must';
    });
    return init;
  });
  const [allCardsExpanded, setAllCardsExpanded] = useState(false);

  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  // 切換全部媒體（地圖 + 照片）
  const toggleAllMedia = () => {
    const next = !allMediaOpen;
    setAllMediaOpen(next);
    const newMapStates: Record<number, boolean> = {};
    const newPhotoStates: Record<number, boolean> = {};
    day.activities.forEach((activity, index) => {
      newMapStates[index] = next;
      newPhotoStates[index] = activity.photoUrl ? next : false;
    });
    setMapStates(newMapStates);
    setPhotoStates(newPhotoStates);
    if (day.accommodation?.photoUrl) setAccommodationPhotoOpen(next);
  };

  // 切換全部行程卡片
  const toggleAllCards = () => {
    const next = !allCardsExpanded;
    setAllCardsExpanded(next);
    const newStates: Record<number, boolean> = {};
    day.activities.forEach((_, index) => { newStates[index] = next; });
    setCardExpandStates(newStates);
  };

  // 切換單個地圖
  const toggleMap = (index: number) => {
    setMapStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // 切換單個照片
  const togglePhoto = (index: number) => {
    setPhotoStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // 切換單個行程卡片
  const toggleCard = (index: number) => {
    setCardExpandStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // 切換住宿照片
  const toggleAccommodationPhoto = () => {
    setAccommodationPhotoOpen(prev => !prev);
  };

  return (
    // 全寬背景色（修正桌面版左右色差）
    <div style={{ backgroundColor: withOpacity(timelineColor, 0.04) }}>
      <div className="px-4 py-6 max-w-3xl mx-auto animate-fade-in">

        {/* 當日標題（含浮水印數字）*/}
        <div className="relative mb-6 overflow-hidden">
          {/* 大型半透明浮水印數字 */}
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 font-serif font-bold leading-none select-none pointer-events-none"
            style={{
              fontSize: 'clamp(4.5rem, 18vw, 8rem)',
              color: withOpacity(timelineColor, 0.08),
            }}
            aria-hidden="true"
          >
            {String(day.day).padStart(2, '0')}
          </span>

          {day.date && (
            <p
              className="text-xs tracking-[0.2em] mb-2 font-medium uppercase relative z-10"
              style={{ color: timelineColor }}
            >
              {day.date}
            </p>
          )}
          <h2 className="text-2xl font-bold font-serif text-ink relative z-10">
            Day {day.day} · {day.title}
          </h2>
        </div>

        {/* 日程簡報（交通 + 住宿快捷）*/}
        <div className="mb-4">
          <DayBriefing
            transport={day.transport}
            accommodation={day.accommodation}
            activitiesCount={day.activities.length}
            themeColor={day.themeColor}
            onNavigateToAccommodation={onNavigateToAccommodation}
          />
        </div>

        {/* 交通總結 */}
        <div className="mb-6">
          <TransportSummary
            transport={day.transport}
            themeColor={day.themeColor}
            activities={day.activities}
            accommodation={day.accommodation}
            prevAccommodation={prevAccommodation}
            dayTitle={day.title}
          />
        </div>

        {/* 當日票券摘要（可折疊）*/}
        {day.tickets && day.tickets.length > 0 && (
          <details className="mb-6 bg-washi-card border border-washi-border rounded-lg p-4 group cursor-pointer hover:shadow-md transition-shadow">
            <summary className="flex items-center gap-2 list-none cursor-pointer">
              <Ticket className="w-5 h-5" style={{ color: timelineColor }} strokeWidth={1.5} />
              <h3 className="font-medium text-ink">今日票券</h3>
              <span className="text-xs text-stone ml-auto">
                {day.tickets.length} 張
              </span>
              <ChevronRight className="w-4 h-4 text-stone opacity-60 transition-transform group-open:rotate-90" strokeWidth={1.5} />
            </summary>
            <div className="space-y-2 mt-3 pt-3 border-t border-washi-border">
              {day.tickets.map((ticket, index) => (
                <div
                  key={index}
                  className="text-sm pl-2 border-l-2 transition-colors"
                  style={{ borderColor: timelineColor }}
                >
                  <p className="text-ink font-medium">{ticket.name}</p>
                  {ticket.datetime && (
                    <p className="text-stone text-xs mt-0.5 tracking-wider">
                      {ticket.datetime}
                    </p>
                  )}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {ticket.attachments.map((att, attIdx) => (
                        <button
                          key={attIdx}
                          onClick={(e) => { e.stopPropagation(); setSelectedAttachment(att); }}
                          className="flex items-center gap-1 px-2 py-1 bg-white/70 border border-stone-200 rounded-full text-xs text-ink hover:bg-white transition-all"
                        >
                          {att.type === 'pdf'
                            ? <FileText className="w-3 h-3" strokeWidth={1.5} />
                            : <ImageIcon className="w-3 h-3" strokeWidth={1.5} />
                          }
                          <span>{att.label || '附件'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {onNavigateToTickets && (
                <button
                  onClick={onNavigateToTickets}
                  className="w-full mt-3 pt-3 border-t border-washi-border text-center text-sm font-medium text-ai hover:text-ai/80 transition-colors"
                >
                  查看完整票券詳情 →
                </button>
              )}
            </div>
          </details>
        )}

        <AttachmentModal
          isOpen={selectedAttachment !== null}
          onClose={() => setSelectedAttachment(null)}
          attachment={selectedAttachment}
        />

        {/* 全部展開/收合按鈕（2 個：媒體合一 + 行程內容）*/}
        <div className="flex gap-3 mb-6">
          {/* 媒體（地圖 + 照片合一）*/}
          <button
            onClick={toggleAllMedia}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
              allMediaOpen
                ? 'bg-ai/5 text-ai border-ai'
                : 'border-stone-200/70 text-stone hover:border-ai hover:text-ai'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{allMediaOpen ? '收合媒體' : '展開媒體'}</span>
          </button>

          {/* 展開/收合全部行程卡片 */}
          <button
            onClick={toggleAllCards}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
              allCardsExpanded
                ? 'bg-vermillion/5 text-vermillion border-vermillion'
                : 'border-stone-200/70 text-stone hover:border-vermillion hover:text-vermillion'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{allCardsExpanded ? '收合行程' : '展開行程'}</span>
          </button>
        </div>

        {/* 時間軸行程 */}
        <div
          className="relative ml-1.5 mb-6"
          style={{ '--timeline-color': timelineColor } as React.CSSProperties}
        >
          {[...day.activities].sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
          }).map((activity, index) => (
            <ActivityCard
              key={index}
              activity={activity}
              themeColor={day.themeColor}
              index={index}
              isExpanded={cardExpandStates[index] ?? activity.priority === 'must'}
              onToggleExpand={() => toggleCard(index)}
              mapOpen={mapStates[index] ?? false}
              photoOpen={photoStates[index] ?? false}
              onToggleMap={() => toggleMap(index)}
              onTogglePhoto={() => togglePhoto(index)}
            />
          ))}
        </div>

        {/* 住宿資訊 */}
        {day.accommodation && (
          <div className="mt-6">
            <AccommodationCard
              accommodation={day.accommodation}
              photoOpen={accommodationPhotoOpen}
              onTogglePhoto={toggleAccommodationPhoto}
            />
          </div>
        )}
      </div>
    </div>
  );
}
