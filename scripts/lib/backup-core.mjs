// 備份核心邏輯（供 backup.mjs 與 restore.mjs 的還原前安全備份共用）

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TABLES, SUPABASE_REF } from './schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..', '..');
export const BACKUP_DIR = join(ROOT, 'backups');
export const HISTORY_DIR = join(BACKUP_DIR, 'history');
export const LATEST_FILE = join(BACKUP_DIR, 'latest.json');

const KEEP_HISTORY = 120; // 保留最近 N 份歷史快照

/** 從 Supabase 讀出所有資料表，組成快照物件 */
export async function fetchSnapshot(sb, source = 'manual') {
  const tables = {};
  const counts = {};
  for (const t of TABLES) {
    const { data, error } = await sb.from(t.name).select('*').order(t.orderBy, { ascending: true });
    if (error) throw new Error(`讀取資料表 ${t.name} 失敗：${error.message}`);
    tables[t.name] = data ?? [];
    counts[t.name] = tables[t.name].length;
  }
  return {
    meta: {
      app: 'busan2026',
      supabase_ref: SUPABASE_REF,
      created_at: new Date().toISOString(),
      source,
      table_counts: counts,
      total_rows: Object.values(counts).reduce((a, b) => a + b, 0),
    },
    tables,
  };
}

/** 只比較資料內容（忽略 meta），判斷是否有變更 */
function tablesChanged(snapshot) {
  if (!existsSync(LATEST_FILE)) return true;
  try {
    const prev = JSON.parse(readFileSync(LATEST_FILE, 'utf8'));
    return JSON.stringify(prev.tables) !== JSON.stringify(snapshot.tables);
  } catch {
    return true;
  }
}

/**
 * 寫入快照。無變更時只更新 latest.json 的 meta 是多餘的，故完全略過（keep-alive 目的已達成）。
 * @returns {{ changed: boolean, historyFile?: string, total: number }}
 */
export function writeSnapshot(snapshot, { force = false } = {}) {
  mkdirSync(HISTORY_DIR, { recursive: true });
  const changed = force || tablesChanged(snapshot);

  if (!changed) {
    return { changed: false, total: snapshot.meta.total_rows };
  }

  const json = JSON.stringify(snapshot, null, 2);
  writeFileSync(LATEST_FILE, json);

  const stamp = snapshot.meta.created_at.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const historyFile = join(HISTORY_DIR, `${stamp}.json`);
  writeFileSync(historyFile, json);

  // 清理過舊的歷史快照
  const files = readdirSync(HISTORY_DIR).filter((f) => f.endsWith('.json')).sort();
  if (files.length > KEEP_HISTORY) {
    for (const f of files.slice(0, files.length - KEEP_HISTORY)) {
      unlinkSync(join(HISTORY_DIR, f));
    }
  }

  return { changed: true, historyFile, total: snapshot.meta.total_rows };
}
