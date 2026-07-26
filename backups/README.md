# 資料庫備份

這個資料夾存放釜山行程資料庫的 JSON 快照，構成「依日期的版本歷史」。

- `latest.json` — 最新一份快照（乾淨 diff 用）
- `history/YYYY-MM-DD_HH-mm-ss.json` — 每次「有變更」時保存的歷史版本

## 快速指令

```bash
npm run backup                      # 立刻備份一份
npm run restore -- --list          # 列出所有可還原的版本
npm run restore -- latest --dry-run   # 預覽還原（不寫入）
npm run restore -- latest --yes       # 實際還原最新版本
npm run restore -- 2026-07-26 --yes   # 還原某個日期版本
```

> 還原會清空並覆寫現有資料，但**執行前一定會先自動存一份 `pre-restore` 版本**，可回復。
> 還原需要 `SUPABASE_SERVICE_ROLE_KEY`（寫入權限）。

完整設定與運作原理見 [`../docs/BACKUP.md`](../docs/BACKUP.md)。
