import * as LucideIcons from 'lucide-react';
import { Map } from 'lucide-react';
import type { Transport, Activity, Accommodation } from '../types/itinerary';
import type { ThemeColor } from '../utils/colors';
import { resolveThemeColor } from '../utils/colors';
import { getEffectiveMapQuery } from '../utils/mapUrl';
import { naverSearchUrl } from '../utils/naverMap';

interface TransportSummaryProps {
  transport: Transport;
  themeColor: ThemeColor;
  activities: Activity[];
  accommodation?: Accommodation;
  prevAccommodation?: Accommodation;
  dayTitle?: string;
}

export function TransportSummary({ transport, themeColor, activities, accommodation, prevAccommodation, dayTitle }: TransportSummaryProps) {
  // 動態取得圖示元件
  const IconComponent = (LucideIcons as any)[transport.icon] || LucideIcons.Car;

  // 依時間排序的景點（共用）
  const sortedActivities = [...activities].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  // 建構路線連結：Naver 地圖無法以「地名」串接多點路線，
  // 故改為開啟當日終點（最後一站 / 住宿）的 Naver 地圖搜尋，抵達後於 App 內導航。
  const buildRouteUrl = () => {
    const waypoints: string[] = [];
    if (prevAccommodation?.mapQuery) waypoints.push(prevAccommodation.mapQuery);
    sortedActivities.forEach(activity => {
      const query = getEffectiveMapQuery(activity.mapQuery, activity.mapUrl, activity.title);
      if (query) waypoints.push(query);
    });
    if (accommodation?.mapQuery) waypoints.push(accommodation.mapQuery);
    if (waypoints.length < 2) return null;
    const destination = waypoints[waypoints.length - 1];
    return naverSearchUrl(destination);
  };

  // 自動從景點標題產生路線描述
  const buildRouteDescription = () => {
    const labels: string[] = [];
    if (prevAccommodation?.name) labels.push(prevAccommodation.name);
    sortedActivities.forEach(activity => {
      const query = getEffectiveMapQuery(activity.mapQuery, activity.mapUrl, activity.title);
      if (query) labels.push(activity.title);
    });
    if (accommodation?.name) labels.push(accommodation.name);
    return labels.length >= 2 ? labels.join(' → ') : null;
  };

  const routeUrl = buildRouteUrl();
  const routeDescription = buildRouteDescription();

  // 如果有路線 URL，渲染為可點擊連結
  if (routeUrl) {
    const themeColorValue = resolveThemeColor(themeColor);
    return (
      <a
        href={routeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-4 py-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer group min-h-[56px]"
        style={{
          backgroundColor: themeColorValue + '08',
          borderColor: themeColorValue + '40',
        }}
      >
        <IconComponent className="w-6 h-6 flex-shrink-0" style={{ color: themeColorValue }} />
        <div className="flex flex-col min-w-0 flex-1">
          {dayTitle && (
            <span className="font-medium text-ink leading-snug">
              {dayTitle}
            </span>
          )}
          {routeDescription && (
            <span className={`text-stone text-sm ${dayTitle ? 'text-xs mt-0.5' : 'font-medium text-ink'}`}>
              {routeDescription}
            </span>
          )}
        </div>
        <Map className="w-5 h-5 flex-shrink-0 transition-colors opacity-60 group-hover:opacity-100" style={{ color: themeColorValue }} />
      </a>
    );
  }

  // 沒有路線 URL 時，渲染為普通 div
  return (
    <div className="inline-flex items-center gap-3 px-4 py-3 rounded-lg border border-washi-border bg-washi-card">
      <IconComponent className="w-5 h-5 text-ai" />
      <span className="font-medium text-ink">
        {transport.description}
      </span>
    </div>
  );
}
