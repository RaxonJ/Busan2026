import { ChevronLeft, Map } from 'lucide-react';
import { useItinerary } from '../hooks/useItinerary';
import { getEffectiveMapQuery } from '../utils/mapUrl';

interface FullRouteMapProps {
  onBack: () => void;
}

/**
 * 動態產生全行程路線 URL（iframe 嵌入專用）
 * - 只包含釜山段景點（排除台灣段：桃園機場）
 * - 按天序串連所有 waypoints
 */
function buildFullTripRouteUrl(itinerary: ReturnType<typeof useItinerary>[0]): string {
  const taiwanKeywords = ['桃園', '台北'];

  const waypoints: string[] = [];

  itinerary.forEach((day) => {
    day.activities.forEach((activity) => {
      const query = getEffectiveMapQuery(activity.mapQuery, activity.mapUrl, activity.title);
      if (query) {
        // 排除台灣段景點
        const isTaiwan = taiwanKeywords.some(keyword =>
          query.includes(keyword)
        );

        if (!isTaiwan && !waypoints.includes(query)) {
          waypoints.push(query);
        }
      }
    });
  });

  // embedUrl: 給 iframe 嵌入
  // 格式: maps.google.com/maps?saddr=起點&daddr=第2站+to:第3站+to:...+to:終點&output=embed
  const origin = waypoints[0];
  const remainingWaypoints = waypoints.slice(1);

  let embedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${remainingWaypoints.map(wp => encodeURIComponent(wp)).join('+to:')}`;

  embedUrl += '&output=embed';

  return embedUrl;
}

export function FullRouteMap({ onBack }: FullRouteMapProps) {
  // 使用 Supabase 資料（含 localStorage 快取 + fallback）
  const [itinerary] = useItinerary();
  const embedUrl = buildFullTripRouteUrl(itinerary);

  return (
    <div className="min-h-screen bg-washi pb-20">
      {/* 頂部導航 */}
      <div className="sticky top-0 z-50 bg-[#2C4F7C] text-white px-4 py-4 flex items-center gap-3 shadow-md">
        <button
          onClick={onBack}
          className="p-2.5 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="返回行程"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Map className="w-6 h-6" />
          全行程路線
        </h1>
      </div>

      {/* 地圖內容 */}
      <div className="p-4 space-y-4">
        {/* 說明卡片 */}
        <div className="bg-washi-card border border-washi-border rounded-lg shadow-sm p-4">
          <p className="text-stone">
            以下為完整旅程的路線規劃，包含所有釜山段景點。點擊地圖可在 Google Maps 中開啟完整路線。
          </p>
        </div>

        {/* 地圖 iframe */}
        <div className="bg-washi-card border border-washi-border rounded-lg shadow-sm overflow-hidden">
          <iframe
            src={embedUrl}
            width="100%"
            height="600"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0 }}
            title="全行程路線地圖"
            allowFullScreen
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
