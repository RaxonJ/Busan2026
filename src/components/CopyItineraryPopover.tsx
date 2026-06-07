// src/components/CopyItineraryPopover.tsx
import { Copy, X } from 'lucide-react';
import type { DayPlan } from '../types/itinerary';
import { itineraryToMarkdown, dayToMarkdown } from '../utils/itineraryToMarkdown';

interface CopyItineraryPopoverProps {
  itinerary: DayPlan[];
  selectedDay: number;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
}

export function CopyItineraryPopover({ itinerary, selectedDay, onClose, onCopySuccess }: CopyItineraryPopoverProps) {
  const copyToClipboard = async (text: string) => {
    // 先執行 clipboard 操作，確保 user activation 脈絡完整（iOS Safari 要求）
    let success = false;
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch {
      // navigator.clipboard 不可用或被拒絕時，fallback 到 execCommand
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }
    onClose();
    onCopySuccess(success ? '已複製到剪貼簿！' : '複製失敗，請手動複製');
  };

  const currentDay = itinerary.find((d) => d.day === selectedDay);

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Popover 本體 */}
      <div className="fixed bottom-24 right-6 z-50 bg-washi-card border border-washi-border rounded-2xl shadow-xl p-4 min-w-[200px]">
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-[#2C4F7C]" />
            <span className="text-sm font-medium text-ink">複製行程</span>
          </div>
          <button onClick={onClose} className="text-stone hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 選項按鈕 */}
        <div className="flex flex-col gap-2">
          {currentDay && (
            <button
              onClick={() => copyToClipboard(dayToMarkdown(currentDay))}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-washi hover:bg-washi-border border border-washi-border text-sm text-ink transition-colors"
            >
              複製今天（Day {selectedDay}）
            </button>
          )}
          <button
            onClick={() => copyToClipboard(itineraryToMarkdown(itinerary))}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-washi hover:bg-washi-border border border-washi-border text-sm text-ink transition-colors"
          >
            複製全部（{itinerary.length} 天）
          </button>
        </div>
      </div>
    </>
  );
}
