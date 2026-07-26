// 還原腳本：把某個日期版本的 JSON 快照寫回 Supabase 資料庫
//
// 用法：
//   node scripts/restore.mjs --list                 列出所有可還原的版本
//   node scripts/restore.mjs latest --dry-run       預覽（不寫入）還原最新版本會發生什麼
//   node scripts/restore.mjs latest --yes           實際還原最新版本
//   node scripts/restore.mjs 2026-07-26 --yes       還原該日期（可只給日期前綴）
//   node scripts/restore.mjs 2026-07-26_14-30-05 --yes   還原精確時間點
//
// ⚠️ 還原是破壞性操作：會清空現有資料再寫回快照內容。
//    實際寫入前一定會先自動做一份「還原前安全備份」(source=pre-restore)，因此可回復。
//    還原需要 SUPABASE_SERVICE_ROLE_KEY（寫入權限）。

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { makeClient, getConfig } from './lib/client.mjs';
import { fetchSnapshot, writeSnapshot, HISTORY_DIR, LATEST_FILE, BACKUP_DIR } from './lib/backup-core.mjs';
import { INSERT_ORDER, DELETE_ORDER, TABLES } from './lib/schema.mjs';

const CHUNK = 500;
const pkOf = Object.fromEntries(TABLES.map((t) => [t.name, t.pk]));

function listHistory() {
  if (!existsSync(HISTORY_DIR)) return [];
  return readdirSync(HISTORY_DIR).filter((f) => f.endsWith('.json')).sort();
}

function printList() {
  const files = listHistory();
  if (files.length === 0 && !existsSync(LATEST_FILE)) {
    console.log('（尚無任何備份，請先執行 npm run backup）');
    return;
  }
  console.log('可還原的版本（新 → 舊）：\n');
  for (const f of [...files].reverse()) {
    try {
      const meta = JSON.parse(readFileSync(join(HISTORY_DIR, f), 'utf8')).meta ?? {};
      const label = f.replace('.json', '');
      console.log(`  ${label}   共 ${meta.total_rows ?? '?'} 筆   來源:${meta.source ?? '?'}`);
    } catch {
      console.log(`  ${f}   （無法讀取 meta）`);
    }
  }
  console.log('\n用法：node scripts/restore.mjs <上面的版本名稱或日期前綴> --yes');
}

/** 解析使用者指定的目標 → 回傳快照檔的絕對路徑 */
function resolveTarget(target) {
  if (!target || target === 'latest') {
    if (!existsSync(LATEST_FILE)) throw new Error('找不到 backups/latest.json');
    return LATEST_FILE;
  }
  // 直接給檔案路徑
  if (target.endsWith('.json')) {
    const p = isAbsolute(target) ? target : join(process.cwd(), target);
    if (existsSync(p)) return p;
  }
  // 在 history 中比對（精確檔名 / 日期前綴）
  const files = listHistory();
  const exact = files.find((f) => f === `${target}.json`);
  if (exact) return join(HISTORY_DIR, exact);

  const matches = files.filter((f) => f.startsWith(target));
  if (matches.length === 0) {
    throw new Error(`找不到符合「${target}」的版本。請先用 --list 查看可用版本。`);
  }
  // 多筆符合 → 取最新的一筆
  const chosen = matches.sort().at(-1);
  if (matches.length > 1) {
    console.log(`ℹ️  「${target}」符合 ${matches.length} 個版本，採用最新：${chosen}`);
  }
  return join(HISTORY_DIR, chosen);
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const positional = args.filter((a) => !a.startsWith('--'));
  const target = positional[0];

  if (flags.has('--list') || (!target && !flags.has('--help'))) {
    if (!target) printList();
    if (flags.has('--list')) return;
    if (!target) return;
  }

  const dryRun = flags.has('--dry-run');
  const yes = flags.has('--yes');

  const file = resolveTarget(target);
  const snapshot = JSON.parse(readFileSync(file, 'utf8'));
  if (!snapshot.tables) throw new Error('快照格式錯誤：缺少 tables 欄位');

  const label = file.replace(/\\/g, '/').split('/').slice(-2).join('/');
  console.log(`\n📦 目標版本：${label}`);
  console.log(`   建立時間：${snapshot.meta?.created_at ?? '?'}（來源:${snapshot.meta?.source ?? '?'}）`);
  console.log(`   還原後各表筆數：`);
  for (const t of INSERT_ORDER) {
    console.log(`     ${t.padEnd(22)} ${(snapshot.tables[t]?.length ?? 0)}`);
  }

  if (dryRun) {
    console.log('\n🔍 --dry-run：以上為將寫入的內容，未實際變更資料庫。');
    return;
  }

  const { isServiceRole } = getConfig();
  if (!isServiceRole) {
    throw new Error('還原需要寫入權限。請設定 SUPABASE_SERVICE_ROLE_KEY 後再執行（見 docs/BACKUP.md）。');
  }
  if (!yes) {
    console.log('\n⚠️  這會【清空並覆寫】現有資料庫。確認無誤請加上 --yes 再執行一次：');
    console.log(`     node scripts/restore.mjs ${target} --yes`);
    return;
  }

  const sb = makeClient();

  // 1) 還原前先自動做一份安全備份（可回復）
  console.log('\n🛟 還原前先建立安全備份 (source=pre-restore)...');
  const safety = await fetchSnapshot(sb, 'pre-restore');
  const saved = writeSnapshot(safety, { force: true });
  if (saved.historyFile) {
    console.log(`   已保存：${saved.historyFile.replace(/\\/g, '/').split('/').slice(-3).join('/')}`);
  }

  // 2) 反序清空所有資料表
  console.log('🗑️  清空現有資料...');
  for (const name of DELETE_ORDER) {
    const pk = pkOf[name];
    const { error } = await sb.from(name).delete().not(pk, 'is', null);
    if (error) throw new Error(`清空 ${name} 失敗：${error.message}`);
  }

  // 3) 正序寫回快照資料
  console.log('⬆️  寫回快照資料...');
  for (const name of INSERT_ORDER) {
    const rows = snapshot.tables[name] ?? [];
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await sb.from(name).insert(chunk);
      if (error) throw new Error(`寫入 ${name} 失敗：${error.message}`);
    }
    console.log(`     ${name.padEnd(22)} 已寫入 ${rows.length} 筆`);
  }

  console.log(`\n✅ 還原完成：${label}`);
  console.log('   若結果不如預期，可用 pre-restore 版本再次還原回來。');
}

main().catch((e) => {
  console.error('❌ 還原失敗：', e.message);
  process.exit(1);
});
