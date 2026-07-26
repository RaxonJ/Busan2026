/**
 * 編輯後觸發雲端備份（選配）
 *
 * 後台每次成功儲存後呼叫 triggerSnapshot()，去抖動後 POST /api/snapshot，
 * 由 Vercel Function 觸發 GitHub Actions 立即備份一版。
 *
 * 設計為 fire-and-forget：
 *  - 多次快速編輯會被去抖動合併成一次
 *  - /api/snapshot 未設定或失敗都會被忽略，絕不影響 App 運作
 *  - 每日排程備份為主要機制，此為即時補強
 */

let timer: ReturnType<typeof setTimeout> | null = null;

export function triggerSnapshot(delayMs = 15000): void {
  if (typeof fetch === 'undefined') return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    fetch('/api/snapshot', { method: 'POST' }).catch(() => {
      /* 忽略：備份觸發失敗不影響後台操作 */
    });
  }, delayMs);
}
