/**
 * 從 Google Maps URL 中提取地點搜尋字串
 *
 * 支援格式：
 * - https://www.google.com/maps/search/?api=1&query=勝尾寺
 * - https://maps.google.com/maps?q=勝尾寺
 * - https://www.google.com/maps/place/勝尾寺
 * - https://www.google.com/maps/place/勝尾寺/@34.xxx,135.xxx
 * - https://maps.app.goo.gl/xxx → 無法客端解析，回傳 null
 */
export function extractQueryFromMapUrl(mapUrl: string): string | null {
  try {
    const url = new URL(mapUrl);

    // ?query=xxx 或 ?q=xxx
    const query = url.searchParams.get('query') || url.searchParams.get('q');
    if (query) return decodeURIComponent(query);

    // /maps/place/xxx 或 /maps/place/xxx/@lat,lng
    const placeMatch = url.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));

    return null;
  } catch {
    return null;
  }
}

/**
 * 判斷字串是否為 URL
 */
function isUrl(str: string): boolean {
  return /^https?:\/\//.test(str);
}

/**
 * 取得活動的有效地點查詢字串
 *
 * 優先順序：
 * 1. mapQuery（手動填寫的搜尋字串）
 * 2. 從 mapUrl 提取的 query（完整 Google Maps URL）
 * 3. title（景點名稱，當有 mapUrl 但解析不出 query 時使用）
 *
 * @param mapQuery - 地圖搜尋字串
 * @param mapUrl   - Google Maps 連結（含縮短連結）
 * @param title    - 景點名稱，作為最終 fallback
 */
export function getEffectiveMapQuery(
  mapQuery?: string,
  mapUrl?: string,
  title?: string
): string | null {
  // 1. 有手動填寫的 mapQuery 就直接用
  if (mapQuery) return mapQuery;

  // 2. 嘗試從 mapUrl 解析
  if (mapUrl) {
    const extracted = extractQueryFromMapUrl(mapUrl);
    if (extracted) return extracted;

    // 3. mapUrl 存在但解析不出（如縮短連結），用 title 當搜尋字串
    if (title && !isUrl(title)) return title;
  }

  return null;
}
