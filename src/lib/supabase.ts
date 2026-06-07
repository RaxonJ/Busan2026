import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client 初始化
 *
 * 設計：環境變數缺失時自動回傳 null，
 * 讓 app 可在沒有 Supabase 設定的情況下正常運作（fallback 模式）
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.info('✅ Supabase client 初始化成功');
} else {
  console.warn('⚠️  未設定 Supabase 環境變數，將使用 hardcoded 資料（fallback 模式）');
}

export { supabase };
