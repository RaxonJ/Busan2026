// 備份腳本：讀出整個資料庫 → 寫成 JSON 快照（backups/latest.json + backups/history/）
//
// 用法：
//   node scripts/backup.mjs [source]
//   source 可為 daily / manual / edit / pre-restore（僅作標記，預設 manual）
//
// 需要環境變數：SUPABASE_URL + （SUPABASE_SERVICE_ROLE_KEY 或 anon key）
// 註：備份只需讀取權限，anon key 即可。

import { makeClient } from './lib/client.mjs';
import { fetchSnapshot, writeSnapshot } from './lib/backup-core.mjs';

async function main() {
  const source = process.argv[2] || process.env.SNAPSHOT_SOURCE || 'manual';
  const sb = makeClient();

  const snapshot = await fetchSnapshot(sb, source);
  const result = writeSnapshot(snapshot);

  if (!result.changed) {
    console.log(`✅ 資料無變更（來源：${source}，共 ${result.total} 筆）— 略過寫入，不產生新版本。`);
    return;
  }

  console.log(`✅ 備份完成（來源：${source}）`);
  console.log(`   總筆數：${result.total}`);
  console.log(`   明細：${JSON.stringify(snapshot.meta.table_counts)}`);
  console.log(`   已寫入：backups/latest.json`);
  console.log(`           ${result.historyFile.replace(/\\/g, '/').split('/').slice(-3).join('/')}`);
}

main().catch((e) => {
  console.error('❌ 備份失敗：', e.message);
  process.exit(1);
});
