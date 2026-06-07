import * as LucideIcons from 'lucide-react';
import { Hotel, ChevronRight } from 'lucide-react';
import type { Transport, Accommodation } from '../types/itinerary';
import type { ThemeColor } from '../utils/colors';
import { resolveThemeColor } from '../utils/colors';

interface DayBriefingProps {
  transport: Transport;
  accommodation?: Accommodation;
  activitiesCount: number;
  themeColor: ThemeColor;
  onNavigateToAccommodation?: () => void;
}

export function DayBriefing({
  transport,
  accommodation,
  themeColor,
  onNavigateToAccommodation,
}: DayBriefingProps) {
  const themeColorHex = resolveThemeColor(themeColor);

  const TransportIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>>)[transport.icon];

  const truncatedName = accommodation?.name
    ? accommodation.name.length > 15
      ? accommodation.name.slice(0, 15) + '…'
      : accommodation.name
    : null;

  return (
    // 扁平化設計：無邊框卡片，僅用細底線區隔，左側主題色小點取代左邊框
    <div className="flex items-center justify-between gap-3 py-3 border-b border-stone-200/50">
      {/* 左：交通資訊 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* 小色點指示當日主題 */}
        <span
          className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: themeColorHex }}
          aria-hidden="true"
        />
        {TransportIcon ? (
          <TransportIcon
            className="w-4 h-4 flex-shrink-0"
            strokeWidth={1.5}
            style={{ color: themeColorHex }}
          />
        ) : null}
        <span className="text-xs text-stone leading-snug truncate">
          {transport.description}
        </span>
      </div>

      {/* 右：今晚住宿（可點擊跳轉）*/}
      {accommodation && truncatedName && (
        <button
          onClick={onNavigateToAccommodation}
          className="flex items-center gap-1 flex-shrink-0 text-xs text-stone hover:text-ink transition-colors duration-200"
          aria-label={`查看住宿：${accommodation.name}`}
        >
          <Hotel className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="whitespace-nowrap">{truncatedName}</span>
          <ChevronRight className="w-3 h-3 opacity-50" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
