/**
 * 旅遊行程設定檔 ── 單一修改點（Single Source of Truth）
 *
 * 【換旅遊目的地時，只需修改此檔案，以下項目將自動更新】
 *  ✅ PWA 安裝名稱 / 主題色（vite.config.ts）
 *  ✅ 瀏覽器標題 / Apple PWA meta（index.html）
 *  ✅ Header 顯示標題 / 倒數日期（Header.tsx）
 *  ✅ localStorage 快取鍵名（useItinerary.ts）
 *  ✅ 緊急聯絡資訊（EmergencyContacts.tsx）
 *
 * 【換旅遊時同時需更新的資料檔】
 *  📄 src/data/itinerary.ts    → 行程內容
 *  📄 src/data/shoppingList.ts → 購物清單
 *  📄 src/data/packingList.ts  → 打包清單
 */

export interface EmergencyContact {
  category: string;
  name: string;
  phone: string;
  description?: string;
}

export interface TripConfig {
  /** PWA 完整名稱（加入主畫面時顯示） */
  appName: string;
  /** PWA 簡短名稱（主畫面圖示下方，建議 ≤ 6 字） */
  appShortName: string;
  /** PWA 描述（安裝提示） */
  appDescription: string;
  /** Header 副標題（旅伴名稱或標語） */
  subtitle: string;
  /** 出發時間（ISO 格式，用於倒數計時） */
  tripStart: string;
  /**
   * localStorage 快取鍵名
   * ⚠️ 換旅遊時必須更改，避免讀到舊行程的快取資料
   * 建議格式：`{目的地}-trip-v{版本}`
   */
  cacheKey: string;
  /** PWA 主題色（Android status bar / Safari tab） */
  themeColor: string;
  /** PWA 啟動畫面背景色 */
  backgroundColor: string;
  /** 緊急聯絡資訊（依目的地國家調整） */
  emergencyContacts: EmergencyContact[];
}

// ─────────────────────────────────────────────────────────────
// 目前行程：2026 釜山之旅
// 修改下方物件即可更新整個 App 的旅遊相關設定
// ─────────────────────────────────────────────────────────────
export const tripConfig: TripConfig = {
  appName: '釜山秋遊 2026',
  appShortName: '釜山',
  appDescription: '2026 釜山家庭旅遊行程 PWA',
  subtitle: '4 人同行 · 海雲台出發',
  tripStart: '2026-09-23T02:50:00',
  cacheKey: 'busan-trip-v1',
  themeColor: '#1B4E8C',
  backgroundColor: '#F5F8FC',

  emergencyContacts: [
    // ── 台灣駐外單位 ──────────────────────────────────────────
    {
      category: '台灣駐外單位',
      name: '駐釜山台北辦事處',
      phone: '+82-51-463-7965',
      description: '急難救助 24 小時專線',
    },

    // ── 韓國緊急電話 ──────────────────────────────────────────
    {
      category: '韓國緊急電話',
      name: '警察（신고）',
      phone: '112',
      description: '遇到犯罪、事故時撥打',
    },
    {
      category: '韓國緊急電話',
      name: '消防 / 救護車（소방）',
      phone: '119',
      description: '火災、急病、受傷時撥打',
    },
    {
      category: '韓國緊急電話',
      name: '觀光諮詢（한국관광공사）',
      phone: '1330',
      description: '24 小時中英韓語旅遊諮詢',
    },

    // ── 住宿飯店（請依實際訂房資訊填入） ─────────────────────
    {
      category: '住宿飯店',
      name: '海雲台飯店',
      phone: '',
      description: '請填入實際飯店電話',
    },
  ],
};
