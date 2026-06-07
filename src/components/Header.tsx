import { useState, useEffect } from 'react';
import { useFontSize } from '../hooks/useFontSize';
import { FontSizeControl } from './FontSizeControl';
import { tripConfig } from '../config/trip';

const TRIP_START = new Date(tripConfig.tripStart);

function useCountdown() {
  const [tripDays, setTripDays] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tripDiff = TRIP_START.getTime() - now.getTime();
      setTripDays(tripDiff > 0 ? Math.floor(tripDiff / (1000 * 60 * 60 * 24)) : 0);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return { tripDays };
}

export function Header() {
  const { increase, decrease, canIncrease, canDecrease, fontSizeIndex, totalLevels } = useFontSize();
  const { tripDays } = useCountdown();

  return (
    <header className="sticky top-0 z-50 bg-washi shadow-sm">
      {/* 頂部裝飾線：藍染色漸層 */}
      <div className="h-px bg-gradient-to-r from-transparent via-ai/30 to-transparent" />

      <div className="px-4 py-3 flex items-center justify-between">
        {/* 左側：朱印章 + 標題文字 */}
        <div className="flex items-center gap-3">
          {/* 朱印圓章 */}
          <div className="w-10 h-10 rounded-full border-2 border-vermillion flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-vermillion font-bold text-sm leading-none">旅</span>
          </div>

          {/* 標題文字 */}
          <div>
            <h1 className="text-lg font-bold font-serif text-ink leading-tight">
              {tripConfig.appName}
            </h1>
            <p className="text-xs text-stone tracking-widest">
              {tripConfig.subtitle}
            </p>
          </div>
        </div>

        {/* 右側：字體控制 */}
        <FontSizeControl
          onIncrease={increase}
          onDecrease={decrease}
          canIncrease={canIncrease}
          canDecrease={canDecrease}
          fontSizeIndex={fontSizeIndex}
          totalLevels={totalLevels}
        />
      </div>

      {/* 倒數計時列 */}
      <div className="px-4 pb-2.5 flex items-center gap-2">
        {/* 出發倒數 */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-ai/5 border border-ai/20 rounded-full">
          <span className="text-xs font-medium text-ai">✈ 出發倒數</span>
          <span className="text-xs font-bold text-ai">{tripDays} 天</span>
        </div>

      </div>

      {/* 底部分隔線 */}
      <div className="h-px bg-washi-border" />
    </header>
  );
}
