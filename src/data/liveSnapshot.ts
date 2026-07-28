// 前端 fallback 快照（由 scripts/backup.mjs 於每次備份時更新）
//
// 用途：當 Supabase 不可用（休眠、環境變數未設、網路失敗）時，App 顯示「最後一版」
// 資料，而非程式碼裡寫死的初版。三個月後停用 Supabase，App 仍會顯示這份最後一版。
//
// 內容為前端可直接使用的最終格式：
//   itinerary → day_plans 原始列（用 mapDayPlanRows 轉成 Itinerary）
//   packing   → PackingItem[]
//   shopping  → ShoppingCategory[]

import raw from './liveSnapshot.json';
import type { DayPlanViewRow } from '../types/database';
import type { PackingItem } from './packingList';
import type { ShoppingCategory } from './shoppingList';

export interface LiveSnapshot {
  itinerary: DayPlanViewRow[];
  packing: PackingItem[];
  shopping: ShoppingCategory[];
}

export const liveSnapshot = raw as unknown as LiveSnapshot;
