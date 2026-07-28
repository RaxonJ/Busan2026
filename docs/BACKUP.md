# 資料庫自動備份與還原（方案 A：GitHub 版本化快照）

## 為什麼需要這個

Supabase 免費專案在**約 7 天無存取後會自動休眠**。休眠時前台連不到資料庫，
會 fallback 到程式碼裡寫死的初版行程，看起來就像「編輯的資料全部不見、跳回 default」。
（實際上資料還在，休眠專案還原後即恢復。）

本方案一次解決兩件事：

1. **版本化備份**：把整個資料庫每天／每次編輯後匯出成 JSON，commit 進 GitHub，
   形成可依日期挑選、還原的版本歷史。就算 Supabase 專案被刪，資料也還在 Git。
2. **防休眠**：每日排程的讀取動作會讓 Supabase 保持活躍，不再自動休眠。

## 運作架構

```
前台編輯 ──(選配)──▶ /api/snapshot ──▶ GitHub repository_dispatch
                                              │
每日排程 (cron) ─────────────────────────────┤
手動觸發 (Actions UI / npm run backup) ───────┤
                                              ▼
                                   scripts/backup.mjs
                                   讀 Supabase 全表 → 寫 backups/*.json → commit
```

還原：`scripts/restore.mjs` 讀指定日期的 JSON，清空資料庫後寫回。

備份的資料表（13 張，`day_plans` 是 VIEW 不含）：
days, transports, accommodations, activities, tickets, activity_links,
accommodation_links, attachments, packing_categories, packing_items,
shopping_categories, shopping_items, shopping_item_links。

---

## 一次性設定

### 1. GitHub Secrets（每日排程備份）

備份只需**讀取**權限，用**公開的 anon key** 即可（RLS：public 可 SELECT），
因此 GitHub Secrets **不需要**放 service_role。倉庫 →
**Settings → Secrets and variables → Actions**，設兩個（皆為非機密公開值）：

| Secret 名稱 | 值 |
|---|---|
| `SUPABASE_URL` | `https://yfbxthgrvclsfxhzvcad.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon`/`publishable` key |

> 已於 2026-07-28 用 `gh secret set` 設定完成。
> 用 CLI 設定：`printf '%s' "值" | gh secret set SUPABASE_URL`（anon key 同理）。

設定後即生效：每天 UTC 18:00（台灣 02:00）自動備份，並保持資料庫不休眠。
也可到 **Actions → DB Backup → Run workflow** 手動跑一次驗證。

> **還原**才需要 service_role（寫入），且只放**本機 `.env`**、不進 GitHub。
> service_role 權限很大，絕不可進前台程式、commit 或 CI logs。

### 2. 本機執行備份／還原

複製 `.env.example` 為 `.env`，填入金鑰：

```bash
cp .env.example .env      # 然後編輯填入 anon / service_role key
npm install
npm run backup            # 產生第一份快照
```

### 3.（選配）編輯後即時備份

若想「一按儲存就馬上備份一版」，需再設定：

1. 建立 GitHub PAT（Fine-grained：對本倉庫給 **Contents: Read and write** 與 **Metadata**；
   或 classic token 勾 `repo`）。
2. Vercel 專案 → Settings → Environment Variables 新增：
   - `GH_DISPATCH_TOKEN` = 上面的 PAT
   - `GH_REPO` = `RaxonJ/Busan2026`
3. 重新部署。之後後台每次儲存都會去抖動觸發一次雲端備份。

未設定也沒關係：前台呼叫 `/api/snapshot` 失敗會被忽略，每日排程仍照常運作。

---

## 日常使用

```bash
npm run backup                        # 立即備份（無變更則略過，不產生重複版本）

npm run restore -- --list             # 列出所有版本（新→舊）
npm run restore -- latest --dry-run   # 預覽會還原成什麼（不寫入）
npm run restore -- latest --yes       # 還原最新版本
npm run restore -- 2026-07-26 --yes   # 還原某天（可只給日期前綴）
npm run restore -- 2026-07-26_14-30-05 --yes   # 還原精確時間點
```

- 還原是破壞性操作，**執行前一定會自動先存一份 `pre-restore` 版本**，還原錯了可再還原回來。
- 還原需要 `SUPABASE_SERVICE_ROLE_KEY`；只設 anon key 只能備份、不能還原。

## 版本從哪裡看

- 檔案層級：`backups/history/` 下每個檔名即為時間點。
- Git 層級：`git log -- backups/latest.json` 可看每次資料變更的 commit。
