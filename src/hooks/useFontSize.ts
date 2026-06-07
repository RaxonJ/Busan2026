import { useState, useEffect } from 'react';

const FONT_SIZES = [16, 20, 24, 28, 32, 36]; // 6 階字體
const STORAGE_KEY = 'kyushu-trip-font-size';

export function useFontSize() {
  // 初始值從 localStorage 讀取，預設 16px
  const [fontSizeIndex, setFontSizeIndex] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const size = parseInt(stored, 10);
      const index = FONT_SIZES.indexOf(size);
      return index >= 0 ? index : 0;
    }
    return 0;
  });

  const currentSize = FONT_SIZES[fontSizeIndex];

  // 每次 fontSizeIndex 變化時，更新 html font-size 和 localStorage
  useEffect(() => {
    document.documentElement.style.fontSize = `${currentSize}px`;
    localStorage.setItem(STORAGE_KEY, currentSize.toString());
  }, [currentSize]);

  const increase = () => {
    setFontSizeIndex((prev) => Math.min(prev + 1, FONT_SIZES.length - 1));
  };

  const decrease = () => {
    setFontSizeIndex((prev) => Math.max(prev - 1, 0));
  };

  const canIncrease = fontSizeIndex < FONT_SIZES.length - 1;
  const canDecrease = fontSizeIndex > 0;

  return {
    currentSize,
    increase,
    decrease,
    canIncrease,
    canDecrease,
    fontSizeIndex,
    totalLevels: FONT_SIZES.length,
  };
}
