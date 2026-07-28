// 後台還原：從 GitHub 讀取版本化備份清單／內容，並用登入後的 Supabase session 寫回資料庫
//
// - 還原點來源：GitHub public repo 的 backups/history/*.json
//   （每個檔都是一次「有異動」的快照 → 天生只列出有變動的日期）
// - 寫入權限：後台登入後為 authenticated 角色，RLS 允許 ALL，故可直接寫回，無需 service_role

import { supabase } from './supabase';
import { INSERT_ORDER, DELETE_ORDER, PK_OF } from './backupSchema';

const OWNER = 'RaxonJ';
const REPO = 'Busan2026';
const BRANCH = 'master';
const CHUNK = 500;

export interface RestorePoint {
  name: string;        // 例：2026-07-26_10-57-18.json
  label: string;       // 例：2026-07-26 10:57
  downloadUrl: string;
}

export interface SnapshotMeta {
  created_at?: string;
  source?: string;
  total_rows?: number;
  table_counts?: Record<string, number>;
}

export interface Snapshot {
  meta?: SnapshotMeta;
  tables: Record<string, Record<string, unknown>[]>;
}

function nameToLabel(name: string): string {
  // 2026-07-26_10-57-18.json → 2026-07-26 10:57
  const m = name.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/);
  return m ? `${m[1]} ${m[2]}:${m[3]}` : name.replace(/\.json$/, '');
}

/** 列出所有還原點（新 → 舊）。每個 history 檔皆為一次有異動的備份。 */
export async function listRestorePoints(): Promise<RestorePoint[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/backups/history?ref=${BRANCH}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 404) return []; // 尚無 history 目錄
  if (!res.ok) throw new Error(`讀取還原點清單失敗（${res.status}）`);
  const files = (await res.json()) as Array<{ name: string; download_url: string; type: string }>;
  return files
    .filter((f) => f.type === 'file' && f.name.endsWith('.json'))
    .sort((a, b) => b.name.localeCompare(a.name))
    .map((f) => ({ name: f.name, label: nameToLabel(f.name), downloadUrl: f.download_url }));
}

/** 讀取指定備份內容 */
export async function fetchSnapshot(downloadUrl: string): Promise<Snapshot> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`讀取備份內容失敗（${res.status}）`);
  const data = (await res.json()) as Snapshot;
  if (!data || !data.tables) throw new Error('備份格式錯誤：缺少 tables');
  return data;
}

/**
 * 把快照寫回資料庫（破壞性）：反序清空 → 正序寫回。
 * 使用後台登入後的 supabase session（authenticated），無需 service_role。
 */
export async function restoreSnapshot(
  snapshot: Snapshot,
  onProgress?: (msg: string) => void
): Promise<void> {
  if (!supabase) throw new Error('Supabase 未設定');

  for (const name of DELETE_ORDER) {
    onProgress?.(`清空 ${name}…`);
    const { error } = await supabase.from(name).delete().not(PK_OF[name], 'is', null);
    if (error) throw new Error(`清空 ${name} 失敗：${error.message}`);
  }

  for (const name of INSERT_ORDER) {
    const rows = snapshot.tables[name] ?? [];
    onProgress?.(`寫回 ${name}（${rows.length} 筆）…`);
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabase.from(name).insert(chunk);
      if (error) throw new Error(`寫入 ${name} 失敗：${error.message}`);
    }
  }
}
