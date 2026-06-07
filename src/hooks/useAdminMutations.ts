import { supabase } from '../lib/supabase';
import type { ActivityRow, TransportRow, AccommodationRow, TicketRow, AttachmentRow, ActivityLinkRow, AccommodationLinkRow } from '../types/database';
import type { PackingItem } from '../types/packingList';
import type { ShoppingCategory } from '../types/shoppingList';

type ActivityInput = Omit<ActivityRow, 'id' | 'created_at' | 'updated_at'>;
type ActivityUpdate = Partial<Omit<ActivityRow, 'id' | 'day' | 'created_at' | 'updated_at'>>;
type TransportInput = Omit<TransportRow, 'updated_at'>;
type AccommodationInput = Omit<AccommodationRow, 'updated_at'>;
type TicketInput = Omit<TicketRow, 'id' | 'updated_at'>;
type AttachmentInput = Omit<AttachmentRow, 'id' | 'updated_at'>;

function assertSupabase() {
  if (!supabase) throw new Error('Supabase 未設定');
  return supabase;
}

/** Supabase PostgrestError 不繼承 Error，統一包裝成 Error 以確保訊息正確顯示 */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const pgErr = err as { message: string; details?: string; hint?: string };
    const parts = [pgErr.message, pgErr.details, pgErr.hint].filter(Boolean);
    return new Error(parts.join(' — '));
  }
  return new Error(String(err));
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---- Activities ----
export async function createActivity(data: ActivityInput): Promise<ActivityRow> {
  const sb = assertSupabase();
  const { data: row, error } = await sb
    .from('activities')
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw toError(error);
  return row;
}

export async function updateActivity(id: string, data: ActivityUpdate): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb
    .from('activities')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw toError(error);
}

export async function deleteActivity(id: string): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb.from('activities').delete().eq('id', id);
  if (error) throw toError(error);
}

export async function reorderActivities(_dayNum: number, orderedIds: string[]): Promise<void> {
  const sb = assertSupabase();
  await Promise.all(
    orderedIds.map((id, idx) =>
      sb.from('activities').update({ sort_order: idx }).eq('id', id)
    )
  );
}

// ---- Transport ----
export async function upsertTransport(data: TransportInput): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb
    .from('transports')
    .upsert({ ...data, updated_at: new Date().toISOString() });
  if (error) throw toError(error);
}

// ---- Accommodation ----
export async function upsertAccommodation(data: AccommodationInput): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb
    .from('accommodations')
    .upsert({ ...data, updated_at: new Date().toISOString() });
  if (error) throw toError(error);
}

// ---- Tickets ----
export async function createTicket(data: TicketInput): Promise<TicketRow> {
  const sb = assertSupabase();
  const { data: row, error } = await sb
    .from('tickets')
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw toError(error);
  return row;
}

export async function updateTicket(id: string, data: Partial<TicketInput>): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb
    .from('tickets')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw toError(error);
}

export async function deleteTicket(id: string): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb.from('tickets').delete().eq('id', id);
  if (error) throw toError(error);
}

// ---- Storage ----
export async function uploadToStorage(
  file: File,
  folder: 'photos' | 'attachments'
): Promise<string> {
  const sb = assertSupabase();
  const uuid = generateUUID();
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${uuid}-${sanitized}`;

  // 嘗試上傳；若 bucket 不存在則自動建立後重試
  let uploadResult = await sb.storage.from('trip-files').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });

  if (uploadResult.error?.message?.toLowerCase().includes('bucket')) {
    const { error: createError } = await sb.storage.createBucket('trip-files', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (createError && !createError.message.toLowerCase().includes('already exists')) {
      throw createError;
    }
    uploadResult = await sb.storage.from('trip-files').upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
    });
  }

  if (uploadResult.error) throw uploadResult.error;
  const { data } = sb.storage.from('trip-files').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFromStorage(url: string): Promise<void> {
  const sb = assertSupabase();
  const match = url.match(/\/storage\/v1\/object\/public\/trip-files\/(.+)$/);
  if (!match) return;
  const path = decodeURIComponent(match[1]);
  const { error } = await sb.storage.from('trip-files').remove([path]);
  if (error) throw toError(error);
}

// ---- Attachments ----
export async function createAttachment(data: AttachmentInput): Promise<AttachmentRow> {
  const sb = assertSupabase();
  const { data: row, error } = await sb
    .from('attachments')
    .insert({ ...data, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw toError(error);
  return row;
}

export async function deleteAttachment(id: string, url?: string): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb.from('attachments').delete().eq('id', id);
  if (error) throw toError(error);
  if (url && url.includes('supabase.co/storage')) {
    await deleteFromStorage(url).catch(console.error);
  }
}

// ---- Activity Links ----
export async function createActivityLink(data: { activity_id: string; sort_order: number; title: string; url: string }): Promise<ActivityLinkRow> {
  const sb = assertSupabase();
  const { data: row, error } = await sb
    .from('activity_links')
    .insert(data)
    .select()
    .single();
  if (error) throw toError(error);
  return row;
}

export async function deleteActivityLink(id: string): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb.from('activity_links').delete().eq('id', id);
  if (error) throw toError(error);
}

// ---- Accommodation Links ----
export async function createAccommodationLink(data: {
  accommodation_day: number;
  sort_order: number;
  title: string;
  url: string;
}): Promise<AccommodationLinkRow> {
  const sb = assertSupabase();
  const { data: row, error } = await sb
    .from('accommodation_links')
    .insert(data)
    .select()
    .single();
  if (error) throw toError(error);
  return row;
}

export async function deleteAccommodationLink(id: string): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb.from('accommodation_links').delete().eq('id', id);
  if (error) throw toError(error);
}

// ---- Shopping List (正規化表) ----
export async function saveShoppingList(categories: ShoppingCategory[]): Promise<void> {
  const sb = assertSupabase();

  // 1. 刪除所有舊分類（CASCADE 自動刪除 items 與 links）
  const { error: delErr } = await sb
    .from('shopping_categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) throw delErr;

  // 2. 逐一重新 INSERT 分類 → 項目 → 連結
  for (const [catIdx, cat] of categories.entries()) {
    const { data: newCat, error: catErr } = await sb
      .from('shopping_categories')
      .insert({ name: cat.category, sort_order: catIdx, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (catErr) throw catErr;

    for (const [itemIdx, item] of cat.items.entries()) {
      const { data: newItem, error: itemErr } = await sb
        .from('shopping_items')
        .insert({
          category_id: newCat.id,
          sort_order: itemIdx,
          name: item.name,
          store: item.store ?? null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (itemErr) throw itemErr;

      if (item.links && item.links.length > 0) {
        const linkRows = item.links.map((link, linkIdx) => ({
          item_id: newItem.id,
          sort_order: linkIdx,
          title: link.title,
          url: link.url,
          updated_at: new Date().toISOString(),
        }));
        const { error: linkErr } = await sb.from('shopping_item_links').insert(linkRows);
        if (linkErr) throw linkErr;
      }
    }
  }
}

// ---- Packing List (正規化表) ----
export async function savePackingList(items: PackingItem[]): Promise<void> {
  const sb = assertSupabase();

  // 固定分類順序（與前台 PackingListEditor CATEGORIES 一致）
  const CATEGORY_NAMES: PackingItem['category'][] = ['證件', '汗蒸幕／溫泉', '衣物', '通用'];

  // 1. 刪除所有舊分類（CASCADE 自動刪除 packing_items）
  const { error: delErr } = await sb
    .from('packing_categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) throw delErr;

  // 2. 重新 INSERT 分類，取得新 id 建立映射
  const categoryIdMap: Record<string, string> = {};
  for (const [idx, name] of CATEGORY_NAMES.entries()) {
    const { data: cat, error: catErr } = await sb
      .from('packing_categories')
      .insert({ name, sort_order: idx, updated_at: new Date().toISOString() })
      .select('id')
      .single();
    if (catErr) throw catErr;
    categoryIdMap[name] = cat.id;
  }

  // 3. 重新 INSERT 項目
  const itemRows = items
    .map((item, idx) => ({
      category_id: categoryIdMap[item.category],
      sort_order: idx,
      name: item.item,
      updated_at: new Date().toISOString(),
    }))
    .filter((row) => row.category_id);

  if (itemRows.length > 0) {
    const { error: insertErr } = await sb.from('packing_items').insert(itemRows);
    if (insertErr) throw insertErr;
  }
}

// ---- Days (基本資訊) ----
export async function updateDay(day: number, data: { date?: string; title?: string; theme_color?: string }): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb
    .from('days')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('day', day);
  if (error) throw toError(error);
}

export async function createDay(input: {
  title: string;
  date?: string;
  themeColor?: string;
}): Promise<number> {
  const sb = assertSupabase();
  const { data, error } = await sb.rpc('add_new_day', {
    p_title:       input.title,
    p_date:        input.date ?? '',
    p_theme_color: input.themeColor ?? 'blue',
  });
  if (error) throw toError(error);
  return data as number;
}

export async function deleteDay(dayNum: number): Promise<void> {
  const sb = assertSupabase();
  const { error } = await sb.rpc('delete_day_and_renumber', {
    p_day: dayNum,
  });
  if (error) throw toError(error);
}
