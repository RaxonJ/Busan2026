// 資料庫備份／還原的資料表定義
//
// 依外鍵關係排序：父表在前、子表在後（INSERT 用此順序，DELETE 用反序）。
// day_plans 是 VIEW（聚合視圖），不需備份／還原，故不列入。

export const SUPABASE_REF = 'yfbxthgrvclsfxhzvcad';

/**
 * 每個資料表的主鍵欄位（用於 DELETE 全表時的「非 NULL」過濾條件）。
 * 順序即為安全的 INSERT 順序（父 → 子）。
 */
export const TABLES = [
  { name: 'days',                pk: 'day',  orderBy: 'day' },
  { name: 'transports',          pk: 'day',  orderBy: 'day' },
  { name: 'accommodations',      pk: 'day',  orderBy: 'day' },
  { name: 'activities',          pk: 'id',   orderBy: 'id' },
  { name: 'tickets',             pk: 'id',   orderBy: 'id' },
  { name: 'accommodation_links', pk: 'id',   orderBy: 'id' },
  { name: 'activity_links',      pk: 'id',   orderBy: 'id' },
  { name: 'attachments',         pk: 'id',   orderBy: 'id' },
  { name: 'packing_categories',  pk: 'id',   orderBy: 'id' },
  { name: 'packing_items',       pk: 'id',   orderBy: 'id' },
  { name: 'shopping_categories', pk: 'id',   orderBy: 'id' },
  { name: 'shopping_items',      pk: 'id',   orderBy: 'id' },
  { name: 'shopping_item_links', pk: 'id',   orderBy: 'id' },
];

export const INSERT_ORDER = TABLES.map((t) => t.name);
export const DELETE_ORDER = [...INSERT_ORDER].reverse();
