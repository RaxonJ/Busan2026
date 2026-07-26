/**
 * Naver 地圖連結工具
 *
 * 韓國當地主要使用 Naver Map —— Google Maps 在韓國圖資受限、導航幾乎不可用，
 * 因此 App 內所有「開啟地圖」連結一律導向 Naver Map。
 *
 * 採用網頁版通用連結 https://map.naver.com/p/search/{query}：
 * - 桌機：直接開啟 Naver 地圖搜尋結果
 * - 手機：瀏覽器會提示以 Naver Map App 開啟（未裝 App 也能用網頁版）
 */
export function naverSearchUrl(query: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}
