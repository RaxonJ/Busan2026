import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// 背景自動重新整理間隔（5 分鐘）
const POLL_INTERVAL_MS = 5 * 60 * 1000;

/**
 * 通用 Supabase 資料獲取 Hook
 *
 * 策略：
 * 1. 立即從 localStorage 載入快取（instant render）
 * 2. 背景發送 Supabase 請求
 * 3. 有新資料時靜默更新 state + localStorage
 * 4. Supabase 不可用時自動 fallback 到預設資料
 * 5. 頁面重新取得焦點（visibilitychange）時自動重新 fetch
 * 6. 每 5 分鐘定時背景輪詢
 *
 * @param cacheKey - localStorage 快取鍵名
 * @param fetchFn - Supabase 資料獲取函式（回傳 Promise）
 * @param fallbackData - Supabase 不可用時的預設資料
 * @returns [data, isLoading, error]
 */

export function useSupabaseData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T | null>,
  fallbackData: T
): [T, boolean, Error | null] {
  const [data, setData] = useState<T>(() => {
    // 啟動時優先從 localStorage 讀取快取
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return fallbackData;
      }
    }
    return fallbackData;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!supabase || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();

      if (result) {
        setData(result);
        localStorage.setItem(cacheKey, JSON.stringify(result));
      }
      // result 為 null 時保留當前 state（localStorage 快取或 fallback），不覆蓋
    } catch (err) {
      console.error(`❌ Supabase fetch 失敗 (${cacheKey}):`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // 保留當前 state，不用 fallbackData 覆蓋已有的資料
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Supabase client 不存在時，不發送請求，直接使用 fallback
    if (!supabase) {
      setData(fallbackData);
      return;
    }

    // 初次載入 fetch
    fetchData();

    // 頁面重新可見時（用戶從其他 App 切回）自動重新整理
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 後台關閉時強制刷新（清除快取後由 App.tsx 廣播此事件）
    const handleInvalidate = (e: Event) => {
      const key = (e as CustomEvent<{ cacheKey: string }>).detail?.cacheKey;
      if (!key || key === cacheKey) {
        localStorage.removeItem(cacheKey);
        fetchData();
      }
    };
    window.addEventListener('supabase-cache-invalidate', handleInvalidate);

    // 定時輪詢
    const pollTimer = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('supabase-cache-invalidate', handleInvalidate);
      clearInterval(pollTimer);
    };
  }, [fetchData, cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return [data, isLoading, error];
}
