import { supabase } from '../lib/supabase';
import { useSupabaseData } from './useSupabaseData';
import { itinerary as hardcodedItinerary } from '../data/itinerary';
import type { Itinerary } from '../types/itinerary';
import type { DayPlanViewRow } from '../types/database';
import { mapDayPlanRows } from '../utils/mappers';
import { tripConfig } from '../config/trip';

/**
 * 行程資料 Hook
 *
 * 策略：
 * 1. localStorage 快取 → Supabase 背景 fetch → 靜默更新
 * 2. Supabase 不可用時 fallback 到 hardcoded data
 * 3. Supabase 資料不完整（缺 mapQuery / accommodation）時也 fallback
 *
 * 資料來源：day_plans VIEW（正規化表的聚合視圖）
 */

/** 驗證 Supabase 資料是否有效（有天數且有行程） */
function isItineraryComplete(data: Itinerary): boolean {
  return data.length > 0 && data.some(day => day.activities.length > 0 || (day.tickets ?? []).length > 0);
}

export function useItinerary(): [Itinerary, boolean, Error | null] {
  const fetchItinerary = async (): Promise<Itinerary | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('day_plans')
      .select('*')
      .order('day', { ascending: true });

    if (error) {
      console.error('❌ Supabase fetch day_plans 失敗:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const mapped = mapDayPlanRows(data as DayPlanViewRow[]);

    // 🔍 DEBUG: 印出 Supabase 資料狀態（排查票券不顯示問題）
    const hasMapQuery = mapped.some(day => day.activities.some(a => !!a.mapQuery));
    const hasAccommodation = mapped.some(day => day.accommodation != null);
    console.log('[useItinerary] Supabase 資料摘要:', {
      days: mapped.length,
      hasMapQuery,
      hasAccommodation,
      ticketsPerDay: mapped.map(d => ({ day: d.day, tickets: d.tickets?.length ?? 0 })),
    });

    // 資料不完整時不使用，讓 hook 保持 fallback（hardcoded）
    if (!isItineraryComplete(mapped)) {
      console.warn('⚠️ Supabase 行程資料不完整，使用 hardcoded 資料');
      return null;
    }

    return mapped;
  };

  return useSupabaseData<Itinerary>(
    tripConfig.cacheKey,
    fetchItinerary,
    hardcodedItinerary
  );
}
