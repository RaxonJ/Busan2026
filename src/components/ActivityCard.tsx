import { useState } from 'react'; // linksOpen only — isExpanded is controlled by DayView
import { Baby, Heart, ExternalLink, X, Plane, Car, Train, Bus, Ship, Utensils, Camera, Hotel, Home, Coffee, ChevronDown, ChevronUp } from 'lucide-react';
import type { Activity, ActivityType } from '../types/itinerary';
import type { ThemeColor } from '../utils/colors';
import { resolveThemeColor } from '../utils/colors';
import { getEffectiveMapQuery } from '../utils/mapUrl';
import { MapEmbed } from './MapEmbed';
import { PhotoViewer } from './PhotoViewer';

interface ActivityCardProps {
  activity: Activity;
  themeColor: ThemeColor;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  mapOpen: boolean;
  photoOpen: boolean;
  onToggleMap: () => void;
  onTogglePhoto: () => void;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  flight: <Plane className="w-3.5 h-3.5" />,
  car:    <Car    className="w-3.5 h-3.5" />,
  train:  <Train  className="w-3.5 h-3.5" />,
  bus:    <Bus    className="w-3.5 h-3.5" />,
  ship:   <Ship   className="w-3.5 h-3.5" />,
  food:   <Utensils className="w-3.5 h-3.5" />,
  spot:   <Camera className="w-3.5 h-3.5" />,
  hotel:  <Hotel  className="w-3.5 h-3.5" />,
  home:   <Home   className="w-3.5 h-3.5" />,
  coffee: <Coffee className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  flight: 'bg-blue-50 text-blue-600 border-blue-200',
  car:    'bg-indigo-50 text-indigo-600 border-indigo-200',
  train:  'bg-orange-50 text-orange-600 border-orange-200',
  bus:    'bg-yellow-50 text-yellow-600 border-yellow-200',
  ship:   'bg-cyan-50 text-cyan-600 border-cyan-200',
  food:   'bg-rose-50 text-rose-600 border-rose-200',
  spot:   'bg-emerald-50 text-emerald-600 border-emerald-200',
  hotel:  'bg-purple-50 text-purple-600 border-purple-200',
  home:   'bg-stone-50 text-stone-600 border-stone-200',
  coffee: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ActivityCard({ activity, themeColor, index, isExpanded, onToggleExpand, mapOpen, photoOpen, onToggleMap, onTogglePhoto }: ActivityCardProps) {
  const [linksOpen, setLinksOpen] = useState(false);
  const hasLinks = activity.links && activity.links.length > 0;
  const effectiveMapQuery = getEffectiveMapQuery(activity.mapQuery, activity.mapUrl, activity.title);
  const accentColor = resolveThemeColor(themeColor);

  return (
    <div
      className="relative pl-8 stagger-item border-b border-stone-200/50 last:border-b-0"
      style={{ '--stagger-index': index } as React.CSSProperties}
    >
      {/* Backdrop for links popover */}
      {linksOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setLinksOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 時間軸線段 */}
      <div
        className="absolute left-[1px] top-7 bottom-0 w-px opacity-20"
        style={{ background: 'var(--timeline-color, #2C4F7C)' }}
      />

      {/* 時間標籤 */}
      <div className="absolute left-[1px] top-0 -translate-x-1/2 px-3">
        <p className="text-[10px] font-medium text-stone-400 whitespace-nowrap tracking-[0.12em] uppercase">
          {activity.time}
        </p>
      </div>

      {/* 內容區（無卡片框，只有 padding 和底線分隔）*/}
      <div className="pt-6 pb-5">
        {/* 標題列（常駐顯示，點擊展開/收合）*/}
        <div
          className="flex items-start justify-between gap-2 cursor-pointer select-none"
          onClick={onToggleExpand}
          role="button"
          aria-expanded={isExpanded}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(); } }}
        >
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {activity.activityType && (
              <span className={`mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full border ${ACTIVITY_COLORS[activity.activityType]}`}>
                {ACTIVITY_ICONS[activity.activityType]}
              </span>
            )}
            <div className="flex-1 min-w-0">
              {/* 襯線字體標題 — 雜誌排版感 */}
              <h3 className="font-serif font-bold text-ink leading-snug break-words">
                {activity.title}
              </h3>
              {activity.priority === 'must' && (
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 border border-amber-500 rounded-full text-xs font-semibold text-amber-900 bg-amber-100">
                  ⭐ 必去
                </span>
              )}
              {activity.priority === 'optional' && (
                <span
                  className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-stone-400"
                  style={{ border: '1px dashed #c7b9a8' }}
                >
                  備選
                </span>
              )}
            </div>
          </div>

          {/* 展開/收合箭頭 */}
          <button
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-stone-100/80 transition-colors duration-200"
            style={{ color: accentColor }}
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            aria-label={isExpanded ? '收合' : '展開'}
            tabIndex={-1}
          >
            {isExpanded
              ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
              : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            }
          </button>
        </div>

        {/* 展開區域：說明 + 標籤 + 地圖/照片（ease-in-out 優雅淡入）*/}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="pt-4 space-y-4">
            {/* 說明文字：段落式渲染，修正字面 \n，增加段落間距 */}
            {activity.description && (
              <div className="space-y-2.5">
                {activity.description
                  .replace(/\\n/g, '\n')        // 修正字面 \n → 真換行符
                  .split(/\n{2,}/)               // 雙換行切成獨立段落
                  .map((para, i) => (
                    <p key={i} className="text-sm text-stone-500 leading-[1.75] whitespace-pre-line tracking-wide">
                      {para.trim()}
                    </p>
                  ))
                }
              </div>
            )}

            {/* 友善標籤 + 連結按鈕 */}
            <div className="flex flex-wrap items-center gap-2">
              {activity.isKidFriendly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-pink-300 rounded-full text-xs font-medium text-pink-700">
                  <Baby className="w-3 h-3" />
                  親子
                </span>
              )}
              {activity.isSeniorFriendly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-red-300 rounded-full text-xs font-medium text-red-700">
                  <Heart className="w-3 h-3" />
                  長輩友善
                </span>
              )}

              {/* 參考連結按鈕 */}
              {hasLinks && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setLinksOpen(prev => !prev); }}
                    className="flex items-center justify-center w-8 h-8 text-[#8B6F47] hover:text-[#6B5437] transition-colors rounded-full hover:bg-stone-100/60"
                    aria-label={linksOpen ? '關閉參考連結' : '查看參考連結'}
                    aria-expanded={linksOpen}
                  >
                    <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                  </button>

                  {/* Popover */}
                  {linksOpen && (
                    <div className="absolute left-0 bottom-10 z-50 w-72 bg-[#FAF8F5] border border-washi-border rounded-lg shadow-2xl ring-1 ring-black/5 overflow-hidden animate-popover-in">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-washi-border bg-washi-card/30">
                        <h3 className="text-sm font-serif font-bold text-ink tracking-wide">
                          參考連結
                        </h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLinksOpen(false); }}
                          className="flex items-center justify-center w-9 h-9 text-stone hover:text-ink transition-colors rounded-full hover:bg-washi-card"
                          aria-label="關閉"
                        >
                          <X className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                        {activity.links!.map((link, idx) => (
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

            {/* 地圖與照片 */}
            <div className="space-y-2">
              {activity.mapUrl && (
                <a
                  href={activity.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-[#2C4F7C] hover:bg-stone-50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  開啟 Google Maps
                </a>
              )}
              {effectiveMapQuery && (
                <MapEmbed
                  mapQuery={effectiveMapQuery}
                  title={activity.title}
                  isOpen={mapOpen}
                  onToggle={onToggleMap}
                />
              )}
              {activity.photoUrl && (
                <PhotoViewer
                  photoUrl={activity.photoUrl}
                  alt={activity.title}
                  isOpen={photoOpen}
                  onToggle={onTogglePhoto}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
