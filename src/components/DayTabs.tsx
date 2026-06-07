import { useRef, useEffect, useState } from 'react';
import type { ThemeColor } from '../utils/colors';
import { resolveThemeColor } from '../utils/colors';

interface DayTabsProps {
  totalDays: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  dayColors: ThemeColor[];
  selectedDayDate?: string;
}

export function DayTabs({ totalDays, selectedDay, onSelectDay, dayColors, selectedDayDate }: DayTabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // 選中天的主題色
  const selectedColor = resolveThemeColor(dayColors[selectedDay - 1] ?? 'blue');

  // 更新底線指示器位置
  useEffect(() => {
    const selectedTab = tabsRef.current[selectedDay - 1];
    if (selectedTab) {
      setIndicatorStyle({
        left: selectedTab.offsetLeft,
        width: selectedTab.offsetWidth,
      });
      // 自動將選中的 tab 滾動到可視範圍中央
      selectedTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDay]);

  return (
    <div className="sticky top-[100px] z-40 bg-[#EDE8E1] border-b border-washi-border">
      <div className="overflow-x-auto">
        <div className="relative flex min-w-max px-4">
          {/* 底線指示器 — 跟隨選中天的主題色 */}
          <div
            className="absolute bottom-0 h-0.5 transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              backgroundColor: selectedColor,
            }}
          />

          {/* Tab 按鈕 */}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const isSelected = day === selectedDay;
            const dayColor = resolveThemeColor(dayColors[day - 1] ?? 'blue');

            return (
              <button
                key={day}
                ref={(el) => (tabsRef.current[day - 1] = el)}
                onClick={() => {
                  onSelectDay(day);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`
                  px-8 py-4 font-medium transition-all duration-200 whitespace-nowrap rounded-lg
                  flex flex-col items-center justify-center gap-1 min-h-[56px] cursor-pointer
                  ${isSelected
                    ? 'bg-white/80 shadow-sm'
                    : 'text-stone hover:text-ink hover:bg-white/40'}
                `}
                style={isSelected ? { color: selectedColor } : undefined}
              >
                <span className="font-bold text-sm">Day {day}</span>

                {/* 每個 tab 自己的主題色小圓點（色碼指示） */}
                <span
                  className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: dayColor,
                    opacity: isSelected ? 1 : 0.5,
                    transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                  }}
                  aria-hidden="true"
                />

                {isSelected && selectedDayDate && (
                  <span className="text-xs text-stone">{selectedDayDate}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
