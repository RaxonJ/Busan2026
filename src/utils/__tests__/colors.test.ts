import { describe, it, expect } from 'vitest';
import { withOpacity, resolveThemeColor, resolveAccentColor, dayGradients } from '../colors';
import type { ThemeColor } from '../colors';

describe('withOpacity | HEX 色碼轉 rgba', () => {
  it('應將 HEX + opacity 轉換為 rgba 字串', () => {
    expect(withOpacity('#2C4F7C', 0.5)).toBe('rgba(44, 79, 124, 0.5)');
  });

  it('opacity 為 0 時回傳完全透明', () => {
    expect(withOpacity('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
  });

  it('opacity 為 1 時回傳完全不透明', () => {
    expect(withOpacity('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });
});

describe('resolveThemeColor | 主題色解析', () => {
  const ALL_THEME_COLORS: ThemeColor[] = ['blue', 'purple', 'green', 'amber', 'rose', 'cyan', 'indigo'];
  const EXPECTED_COLOR = '#2C4F7C';

  it.each(ALL_THEME_COLORS)('ThemeColor "%s" 應回傳藍染色 #2C4F7C', (color) => {
    expect(resolveThemeColor(color)).toBe(EXPECTED_COLOR);
  });
});

describe('resolveAccentColor | 強調色解析', () => {
  it('任何 ThemeColor 都回傳藍染色 #2C4F7C', () => {
    expect(resolveAccentColor('blue')).toBe('#2C4F7C');
    expect(resolveAccentColor('rose')).toBe('#2C4F7C');
  });
});

describe('dayGradients | 每日背景漸層色', () => {
  it('每個 ThemeColor 都有 from 與 to 欄位', () => {
    const colors: ThemeColor[] = ['blue', 'purple', 'green', 'amber', 'rose', 'cyan', 'indigo'];
    for (const color of colors) {
      expect(dayGradients[color]).toHaveProperty('from');
      expect(dayGradients[color]).toHaveProperty('to');
    }
  });

  it('from 與 to 均為和紙色 #F7F3EE', () => {
    expect(dayGradients['blue'].from).toBe('#F7F3EE');
    expect(dayGradients['blue'].to).toBe('#F7F3EE');
  });
});
