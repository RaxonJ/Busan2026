// Vercel Serverless Function（選配）：前台編輯後被呼叫，觸發 GitHub Actions 立即備份一版。
//
// 需要在 Vercel 專案設定這兩個環境變數：
//   GH_DISPATCH_TOKEN  一顆有 repo（或 contents:write + workflows）權限的 GitHub PAT
//   GH_REPO            倉庫全名，例如 "RaxonJ/Busan2026"
//
// 未設定時回傳 501，前台以 fire-and-forget 呼叫、忽略錯誤，不影響 App 運作。

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GH_DISPATCH_TOKEN;
  const repo = process.env.GH_REPO;
  if (!token || !repo) {
    return res.status(501).json({ error: 'snapshot 未設定（缺少 GH_DISPATCH_TOKEN / GH_REPO）' });
  }

  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'busan2026-snapshot',
      },
      body: JSON.stringify({ event_type: 'snapshot' }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(502).json({ error: `GitHub dispatch 失敗：${r.status} ${text}` });
    }
    return res.status(202).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
