// 前端還原用的資料表定義（對應 scripts/lib/schema.mjs）
//
// 陣列順序 = 安全的 INSERT 順序（父表在前、子表在後）；DELETE 用反序。
// day_plans 是 VIEW，不還原。

export const INSERT_ORDER = [
  'days',
  'transports',
  'accommodations',
  'activities',
  'tickets',
  'accommodation_links',
  'activity_links',
  'attachments',
  'packing_categories',
  'packing_items',
  'shopping_categories',
  'shopping_items',
  'shopping_item_links',
] as const;

export const DELETE_ORDER: string[] = [...INSERT_ORDER].reverse();

/** 各表主鍵欄位（DELETE 全表時用「主鍵非 NULL」過濾，Supabase 要求 delete 帶條件）*/
export const PK_OF: Record<string, string> = {
  days: 'day',
  transports: 'day',
  accommodations: 'day',
  activities: 'id',
  tickets: 'id',
  accommodation_links: 'id',
  activity_links: 'id',
  attachments: 'id',
  packing_categories: 'id',
  packing_items: 'id',
  shopping_categories: 'id',
  shopping_items: 'id',
  shopping_item_links: 'id',
};
