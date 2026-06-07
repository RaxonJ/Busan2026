import { Plus, Minus } from 'lucide-react';

interface FontSizeControlProps {
  onIncrease: () => void;
  onDecrease: () => void;
  canIncrease: boolean;
  canDecrease: boolean;
  fontSizeIndex: number;
  totalLevels: number;
}

export function FontSizeControl({
  onIncrease,
  onDecrease,
  canIncrease,
  canDecrease,
  fontSizeIndex,
  totalLevels,
}: FontSizeControlProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecrease}
        disabled={!canDecrease}
        className="w-11 h-11 rounded-full border border-ai/30 hover:bg-ai/[0.08] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        aria-label="縮小字體"
      >
        <Minus className="w-5 h-5 text-ink" />
      </button>

      {/* 等級數字指示 */}
      <span
        className="text-sm font-medium text-ink min-w-[2.5rem] text-center tabular-nums"
        aria-label={`字體等級 ${fontSizeIndex + 1} / ${totalLevels}`}
        role="status"
      >
        {fontSizeIndex + 1}/{totalLevels}
      </span>

      <button
        onClick={onIncrease}
        disabled={!canIncrease}
        className="w-11 h-11 rounded-full border border-ai/30 hover:bg-ai/[0.08] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        aria-label="放大字體"
      >
        <Plus className="w-5 h-5 text-ink" />
      </button>
    </div>
  );
}
