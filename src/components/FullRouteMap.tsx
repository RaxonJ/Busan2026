import { ChevronLeft, Map, MapPin, ExternalLink } from 'lucide-react';
import { useItinerary } from '../hooks/useItinerary';
import { getEffectiveMapQuery } from '../utils/mapUrl';
import { naverSearchUrl } from '../utils/naverMap';

interface FullRouteMapProps {
  onBack: () => void;
}

/**
 * 依天序串出全行程景點（釜山段），排除台灣段（桃園／台北）與重複點。
 */
function buildWaypoints(itinerary: ReturnType<typeof useItinerary>[0]): string[] {
  const taiwanKeywords = ['桃園', '台北'];
  const waypoints: string[] = [];

  itinerary.forEach((day) => {
    day.activities.forEach((activity) => {
      const query = getEffectiveMapQuery(activity.mapQuery, activity.mapUrl, activity.title);
      if (!query) return;
      const isTaiwan = taiwanKeywords.some((keyword) => query.includes(keyword));
      if (!isTaiwan && !waypoints.includes(query)) {
        waypoints.push(query);
      }
    });
  });

  return waypoints;
}

/**
 * 全行程路線
 *
 * 韓國當地使用 Naver 地圖（Google 圖資受限、路線導航不可用），
 * 故以「依序排列的景點清單」呈現，每一站可直接在 Naver 地圖開啟。
 */
export function FullRouteMap({ onBack }: FullRouteMapProps) {
  const [itinerary] = useItinerary();
  const waypoints = buildWaypoints(itinerary);

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

      <div className="p-4 space-y-4">
        {/* 說明卡片 */}
        <div className="bg-washi-card border border-washi-border rounded-lg shadow-sm p-4">
          <p className="text-stone">
            以下為完整旅程的釜山段景點（依天序排列）。韓國當地請使用 Naver 地圖，
            點擊任一站即可在 Naver 地圖開啟。
          </p>
        </div>

        {/* 景點清單（每站可開啟 Naver 地圖）*/}
        {waypoints.length > 0 ? (
          <ol className="bg-washi-card border border-washi-border rounded-lg shadow-sm divide-y divide-washi-border overflow-hidden">
            {waypoints.map((wp, index) => (
              <li key={`${wp}-${index}`}>
                <a
                  href={naverSearchUrl(wp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3.5 min-h-[56px] hover:bg-washi transition-colors group"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[#2C4F7C] text-white text-sm font-semibold">
                    {index + 1}
                  </span>
                  <MapPin className="w-4 h-4 flex-shrink-0 text-[#2C4F7C]" />
                  <span className="flex-1 min-w-0 text-ink group-hover:text-[#2C4F7C] transition-colors break-words">
                    {wp}
                  </span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0 text-stone opacity-60 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <div className="bg-washi-card border border-washi-border rounded-lg shadow-sm p-8 text-center text-stone">
            尚無可顯示的景點
          </div>
        )}
      </div>
    </div>
  );
}
