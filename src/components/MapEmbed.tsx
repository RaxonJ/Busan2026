import { MapPin, ExternalLink } from 'lucide-react';
import { naverSearchUrl } from '../utils/naverMap';

interface MapEmbedProps {
  mapQuery: string;
  title?: string;
  /** @deprecated 保留以相容既有呼叫端；改為外開 Naver 地圖後不再使用手風琴開合狀態 */
  isOpen?: boolean;
  /** @deprecated 同上 */
  onToggle?: () => void;
}

/**
 * 「在 Naver 地圖開啟」連結
 *
 * 原本為內嵌 Google Maps iframe，但韓國 Google 圖資受限、內嵌預覽幾乎不可用，
 * 且 Naver 無免金鑰的 iframe 內嵌方案，故改為直接外開 Naver 地圖搜尋。
 */
export function MapEmbed({ mapQuery }: MapEmbedProps) {
  return (
    <div className="mt-2">
      <a
        href={naverSearchUrl(mapQuery)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium text-ai hover:bg-ai/5 transition-all"
        aria-label="在 Naver 地圖開啟"
      >
        <MapPin className="w-4 h-4" />
        <span>在 Naver 地圖開啟</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>
    </div>
  );
}
