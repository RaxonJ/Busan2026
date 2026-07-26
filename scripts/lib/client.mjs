// 從環境變數建立 Supabase client（供 Node 腳本使用）
//
// 讀取（備份）：anon key 即可（RLS 對 public 開放 SELECT）
// 寫入（還原）：必須用 service_role key（RLS 只允許 authenticated 寫入，
//              service_role 會繞過 RLS）
//
// 支援的環境變數（擇一提供 key）：
//   SUPABASE_URL 或 VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   ← 還原必需
//   SUPABASE_ANON_KEY 或 VITE_SUPABASE_ANON_KEY  ← 僅能備份

import { createClient } from '@supabase/supabase-js';

// 本機執行時自動載入 .env（GitHub Actions 由 secrets 注入，無 .env 也無妨）
try {
  await import('dotenv/config');
} catch {
  /* dotenv 未安裝時忽略 */
}

export function getConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  if (!url || !key) {
    throw new Error(
      '缺少環境變數。需要 SUPABASE_URL 以及 SUPABASE_SERVICE_ROLE_KEY（還原必需）或 anon key（僅備份）。'
    );
  }
  return { url, key, isServiceRole: !!serviceKey };
}

export function makeClient() {
  const { url, key } = getConfig();
  return createClient(url, key, { auth: { persistSession: false } });
}
