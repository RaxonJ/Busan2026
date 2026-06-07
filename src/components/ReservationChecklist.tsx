import { useState, useEffect } from 'react';
import { ChevronLeft, CalendarCheck, CheckSquare, Square, ExternalLink, AlertTriangle, Clock, Calendar } from 'lucide-react';

interface ReservationChecklistProps {
  onBack: () => void;
}

interface ReservationItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;           // 活動日期，例如 "4/20"
  deadline?: string;      // 預約截止日，例如 "3/20（需提前 1 個月）"
  deadlineDate?: string;  // ISO-like: "2026-03-20"
  activityDate: string;   // ISO-like: "2026-04-20"
  urgency: 'critical' | 'soon' | 'normal';
  link?: string;
  linkLabel?: string;
  note?: string;
}

const RESERVATION_ITEMS: ReservationItem[] = [
  // 機票 & 包車接送
  {
    id: 'flight-go',
    title: '去程機票',
    subtitle: '02:50 TPE → 06:10 PUS（金海機場）',
    date: '9/23（三）',
    activityDate: '2026-09-23',
    urgency: 'normal',
    note: '4 位旅客，請確認行李規定已購妥',
  },
  {
    id: 'flight-return',
    title: '回程機票',
    subtitle: '22:00 PUS → 抵台',
    date: '9/27（日）',
    activityDate: '2026-09-27',
    urgency: 'normal',
    note: '深夜班機，行李限重請提前確認',
  },
  {
    id: 'car-go',
    title: '包車：機場 → 海雲台',
    subtitle: '9/23 清晨 06:10 落地後，金海機場 → 海雲台',
    date: '9/23（三）',
    activityDate: '2026-09-23',
    urgency: 'critical',
    deadline: '出發前 1 個月確認',
    deadlineDate: '2026-08-23',
    note: '確認司機能配合清晨接機，需可放 4 人行李的大車',
  },
  {
    id: 'car-return',
    title: '包車：海雲台 → 機場',
    subtitle: '9/27 約 19:30 出發，海雲台飯店 → 金海機場',
    date: '9/27（日）',
    activityDate: '2026-09-27',
    urgency: 'critical',
    deadline: '出發前 1 個月確認',
    deadlineDate: '2026-08-23',
    note: '22:00 起飛，國際線提前 2 小時，確認司機可配合深夜場次',
  },
  // 住宿
  {
    id: 'hotel-haeundae',
    title: '海雲台飯店',
    subtitle: 'Day 1–5，9/23～9/27（4晚）',
    date: '9/23 Check-in',
    activityDate: '2026-09-23',
    urgency: 'soon',
    note: '靠近 LCT 塔樓，Club D Oasis 汗蒸幕徒步可達',
  },
  // 汗蒸幕
  {
    id: 'spa-club-d',
    title: 'Club D Oasis 汗蒸幕（5 小時）',
    subtitle: 'Day 1（9/23）落地當天，釜山PASS 免費換券',
    date: '9/23（三）早上',
    activityDate: '2026-09-23',
    urgency: 'soon',
    note: '釜山PASS 可換「汗蒸幕 5 小時券」，水上樂園另計費，需自備泳衣',
  },
  // 膠囊列車
  {
    id: 'ticket-blueline',
    title: '海雲台 블루라인파크 膠囊列車',
    subtitle: 'Day 2（9/24）09:00 首班｜尾浦→青沙埔靠海車廂',
    date: '9/24（四）',
    deadline: '8/24（提前 1 個月）',
    deadlineDate: '2026-08-24',
    activityDate: '2026-09-24',
    urgency: 'critical',
    note: '靠海車廂超搶手，提前 1 個月訂票，官網訂位',
  },
  // 景點票券
  {
    id: 'ticket-luge',
    title: 'Skyline Luge 斜坡滑車（機張）',
    subtitle: 'Day 4（9/26）釜山PASS 免費 2 次',
    date: '9/26（六）',
    activityDate: '2026-09-26',
    urgency: 'normal',
    note: '釜山PASS 含，注意身高限制；長輩可搭纜椅觀景',
  },
  {
    id: 'ticket-arte',
    title: 'Arte Museum 海雲台',
    subtitle: 'Day 2（9/24）釜山PASS 免費入場',
    date: '9/24（四）',
    activityDate: '2026-09-24',
    urgency: 'normal',
    note: '釜山PASS 含免費入場券，確認有效期',
  },
  // 特殊活動（需提前訂）
  {
    id: 'yacht-drone',
    title: '鑽石灣遊艇＋廣安里無人機煙火秀',
    subtitle: 'Day 4（9/26）週六限定，需提前 1 個月訂票',
    date: '9/26（六）晚上',
    deadline: '8/26（提前 1 個月）',
    deadlineDate: '2026-08-26',
    activityDate: '2026-09-26',
    urgency: 'critical',
    note: '挑「煙火場」次數，確認出航時間與無人機煙火施放時段對齊',
  },
];

const CATEGORIES = [
  { id: 'flight', label: '機票 & 包車', ids: ['flight-go', 'flight-return', 'car-go', 'car-return'] },
  { id: 'hotel', label: '住宿', ids: ['hotel-haeundae'] },
  { id: 'spa', label: '汗蒸幕', ids: ['spa-club-d'] },
  { id: 'ticket', label: '景點票券 & 特殊活動', ids: ['ticket-blueline', 'ticket-luge', 'ticket-arte', 'yacht-drone'] },
];

const CATEGORY_COLORS: Record<string, { header: string; bar: string }> = {
  flight:     { header: 'bg-blue-600',  bar: 'bg-blue-600' },
  hotel:      { header: 'bg-emerald-700', bar: 'bg-emerald-700' },
  spa:        { header: 'bg-teal-600',  bar: 'bg-teal-600' },
  ticket:     { header: 'bg-violet-700', bar: 'bg-violet-700' },
};

const STORAGE_KEY = 'busan-reservation-checked';

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function UrgencyBadge({ item }: { item: ReservationItem }) {
  const hasDeadline = !!item.deadlineDate;
  const days = hasDeadline
    ? getDaysUntil(item.deadlineDate!)
    : getDaysUntil(item.activityDate);

  if (hasDeadline && days <= 0) {
    return (
      <span className="flex items-center gap-1 text-xs border border-red-400 text-red-600 rounded-full px-2 py-0.5 font-medium">
        <AlertTriangle className="w-3 h-3" />
        截止已過
      </span>
    );
  }

  if (item.urgency === 'critical') {
    return (
      <span className="flex items-center gap-1 text-xs border border-red-400 text-red-600 rounded-full px-2 py-0.5 font-medium">
        <AlertTriangle className="w-3 h-3" />
        截止剩 {days} 天
      </span>
    );
  }

  if (item.urgency === 'soon') {
    return (
      <span className="flex items-center gap-1 text-xs border border-amber-400 text-amber-700 rounded-full px-2 py-0.5 font-medium">
        <Clock className="w-3 h-3" />
        距出發 {getDaysUntil(item.activityDate)} 天
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs border border-stone-300 text-stone-500 rounded-full px-2 py-0.5">
      <Calendar className="w-3 h-3" />
      距出發 {getDaysUntil(item.activityDate)} 天
    </span>
  );
}

export function ReservationChecklist({ onBack }: ReservationChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCheckedItems(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checkedItems]));
    } catch { /* ignore */ }
  }, [checkedItems]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalItems = RESERVATION_ITEMS.length;
  const checkedCount = checkedItems.size;
  const progress = Math.round((checkedCount / totalItems) * 100);

  // 緊急項目（未完成）
  const urgentPending = RESERVATION_ITEMS.filter(
    (item) => item.urgency === 'critical' && !checkedItems.has(item.id)
  );

  return (
    <div className="min-h-screen bg-washi pb-24">
      {/* 頂部導航 */}
      <div className="sticky top-0 z-50 bg-[#2C4F7C] text-white px-4 py-4 shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="返回行程"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-serif font-bold flex items-center gap-2">
            <CalendarCheck className="w-6 h-6" />
            預約 Checklist
          </h1>
        </div>

        {/* 進度條 */}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm mt-2 text-white/90">
          已確認 {checkedCount} / {totalItems} 項（{progress}%）
        </p>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* 緊急提示卡 */}
        {urgentPending.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <h2 className="font-serif font-bold text-red-800 text-base">
                緊急！需立即預約
              </h2>
            </div>
            <ul className="space-y-1">
              {urgentPending.map((item) => {
                const days = item.deadlineDate ? getDaysUntil(item.deadlineDate) : null;
                return (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="mt-0.5 flex-shrink-0 font-bold">•</span>
                    <span>
                      <span className="font-medium">{item.title}</span>
                      {days !== null && (
                        <span className="ml-1 text-red-600 font-bold">（截止剩 {days} 天）</span>
                      )}
                      {item.deadline && (
                        <span className="block text-xs text-red-500 mt-0.5">截止日：{item.deadline}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 各類別 */}
        {CATEGORIES.map((cat) => {
          const items = cat.ids.map((id) => RESERVATION_ITEMS.find((r) => r.id === id)!).filter(Boolean);
          const catChecked = items.filter((item) => checkedItems.has(item.id)).length;
          const colors = CATEGORY_COLORS[cat.id];

          return (
            <div key={cat.id}>
              {/* 類別標題 */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif font-bold text-ink text-lg flex items-center gap-2">
                  <div className={`w-1 h-6 ${colors.bar} rounded-full`} />
                  {cat.label}
                </h2>
                <span className="text-sm text-stone-500">
                  {catChecked}/{items.length}
                </span>
              </div>

              {/* 項目列表 */}
              <div className="space-y-3">
                {items.map((item) => {
                  const isChecked = checkedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`
                        bg-washi-card border rounded-xl shadow-sm overflow-hidden
                        transition-all duration-200
                        ${item.urgency === 'critical' && !isChecked
                          ? 'border-red-200'
                          : 'border-washi-border'}
                        ${isChecked ? 'opacity-60' : ''}
                      `}
                    >
                      {/* 點擊區域（勾選） */}
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full p-4 flex items-start gap-3 text-left cursor-pointer hover:bg-stone-50 transition-colors"
                      >
                        {/* 勾選圖示 */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-stone-400" />
                          )}
                        </div>

                        {/* 內容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start gap-2 mb-1">
                            <span
                              className={`font-medium text-base leading-snug ${
                                isChecked ? 'line-through text-stone-400' : 'text-ink'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>

                          <p className="text-sm text-stone-500 mb-2">{item.subtitle}</p>

                          {/* 日期 + 倒數 */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.date}
                            </span>
                            {!isChecked && <UrgencyBadge item={item} />}
                          </div>

                          {/* 備註 */}
                          {item.note && (
                            <p className="mt-2 text-xs text-stone-500 leading-relaxed border-t border-stone-100 pt-2">
                              {item.note}
                            </p>
                          )}

                          {/* 截止日資訊 */}
                          {item.deadline && !isChecked && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              預約截止：{item.deadline}
                            </div>
                          )}
                        </div>
                      </button>

                      {/* 訂購連結 */}
                      {item.link && (
                        <div className="px-4 pb-3 pt-0 border-t border-stone-100">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[#2C4F7C] font-medium hover:underline cursor-pointer py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {item.linkLabel ?? '前往訂購'}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 全部完成提示 */}
        {checkedCount === totalItems && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
            <CheckSquare className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-serif font-bold text-emerald-800 text-lg">全部預約完成！</p>
            <p className="text-sm text-emerald-700 mt-1">準備好出發享受釜山之旅了</p>
          </div>
        )}

        {/* 提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
          <p className="font-medium mb-1 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4" />
            使用說明
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs leading-relaxed">
            <li>點擊項目即可標記為「已確認」</li>
            <li>勾選狀態自動儲存，下次開啟仍保留</li>
            <li>紅色標籤代表截止日緊迫，請優先處理</li>
            <li>所有倒數天數均以今日為基準自動計算</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
