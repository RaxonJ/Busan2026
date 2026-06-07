/**
 * Supabase 資料庫 Row 型別（snake_case 命名）
 * 與前端 itinerary.ts 中的 camelCase 型別分開管理
 */

export interface DayRow {
  day: number;
  date: string | null;
  title: string;
  theme_color: string;
  route_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  day: number;
  sort_order: number;
  time: string;
  title: string;
  description: string | null;
  is_kid_friendly: boolean;
  is_senior_friendly: boolean;
  map_query: string | null;
  map_url: string | null;
  photo_url: string | null;
  priority: string | null;
  activity_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportRow {
  day: number;
  mode: string;
  description: string;
  icon: string;
  updated_at: string;
}

export interface AccommodationRow {
  day: number;
  name: string;
  description: string | null;
  map_query: string | null;
  photo_url: string | null;
  updated_at: string;
}

export interface TicketRow {
  id: string;
  day: number;
  sort_order: number;
  name: string;
  type: string;
  datetime: string | null;
  notes: string | null;
  updated_at: string;
}

export interface ActivityLinkRow {
  id: string;
  activity_id: string;
  sort_order: number;
  title: string;
  url: string;
  updated_at: string;
}

export interface AccommodationLinkRow {
  id: string;
  accommodation_day: number;
  sort_order: number;
  title: string;
  url: string;
  updated_at: string;
}

export interface AttachmentRow {
  id: string;
  ticket_id: string | null;
  accommodation_day: number | null;
  sort_order: number;
  type: string;
  url: string;
  label: string | null;
  updated_at: string;
}

export interface ShoppingCategoryRow {
  id: string;
  name: string;
  sort_order: number;
  updated_at: string;
}

export interface ShoppingItemRow {
  id: string;
  category_id: string;
  sort_order: number;
  name: string;
  store: string | null;
  updated_at: string;
}

export interface ShoppingItemLinkRow {
  id: string;
  item_id: string;
  sort_order: number;
  title: string;
  url: string;
  updated_at: string;
}

export interface PackingCategoryRow {
  id: string;
  name: string;
  sort_order: number;
  updated_at: string;
}

export interface PackingItemRow {
  id: string;
  category_id: string;
  sort_order: number;
  name: string;
  updated_at: string;
}

/** day_plans VIEW 回傳的 JSON 結構（欄位已映射為 camelCase） */
export interface DayPlanViewRow {
  day: number;
  date: string | null;
  title: string;
  themeColor: string;
  transport: {
    mode: string;
    description: string;
    icon: string;
  } | null;
  accommodation: {
    name: string;
    description: string | null;
    mapQuery: string | null;
    photoUrl: string | null;
    attachments: Array<{ type: string; url: string; label: string | null }>;
    links: Array<{ title: string; url: string }>;
  } | null;
  activities: Array<{
    time: string;
    title: string;
    description: string | null;
    isKidFriendly: boolean;
    isSeniorFriendly: boolean;
    mapQuery: string | null;
    mapUrl: string | null;
    photoUrl: string | null;
    priority: string | null;
    activityType?: string | null;
    links: Array<{ title: string; url: string }>;
  }>;
  tickets: Array<{
    name: string;
    type: string;
    datetime: string | null;
    notes: string | null;
    attachments: Array<{ type: string; url: string; label: string | null }>;
  }>;
}
