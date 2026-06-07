/**
 * 共用色彩工具模組
 * 釜山海藍風 統一色調
 */

export type ThemeColor = 'blue' | 'purple' | 'green' | 'amber' | 'rose' | 'cyan' | 'indigo';

// 海藍背景基底
const BASE_COLOR = '#F5F8FC';

/**
 * 主題色對照表 - 釜山各區主題色
 * blue:   海雲台深藍
 * purple: 影島紫霧
 * green:  松島翠綠
 * amber:  機張金黃
 * rose:   西面玫瑰
 * cyan:   廣安里碧藍
 * indigo: 南浦靛藍
 */
const THEME_COLORS: Record<ThemeColor, string> = {
  blue:   '#1B4E8C', // 海雲台深藍
  purple: '#5C3D7A', // 影島紫霧
  green:  '#2E6B4A', // 松島翠綠
  amber:  '#A07010', // 機張金黃
  rose:   '#A63D4A', // 西面玫瑰
  cyan:   '#1E7080', // 廣安里碧藍
  indigo: '#3D4E7A', // 南浦靛藍
};

/**
 * 強調色對照表 - 與主題色相同，供特殊場景使用
 */
const ACCENT_COLORS: Record<ThemeColor, string> = {
  blue:   '#1B4E8C',
  purple: '#5C3D7A',
  green:  '#2E6B4A',
  amber:  '#A07010',
  rose:   '#A63D4A',
  cyan:   '#1E7080',
  indigo: '#3D4E7A',
};

/**
 * 每日背景漸層色 - 海藍色底，帶輕微主題色暈染
 */
export const dayGradients: Record<ThemeColor, { from: string; to: string }> = {
  blue:   { from: '#EFF5FC', to: BASE_COLOR }, // 略帶海藍
  purple: { from: '#F3F0F8', to: BASE_COLOR }, // 略帶紫暖
  green:  { from: '#EFF5F2', to: BASE_COLOR }, // 略帶青綠
  amber:  { from: '#F8F5EC', to: BASE_COLOR }, // 略帶金黃
  rose:   { from: '#F8EFEF', to: BASE_COLOR }, // 略帶玫瑰
  cyan:   { from: '#EFF6F8', to: BASE_COLOR }, // 略帶青碧
  indigo: { from: '#EFF0F8', to: BASE_COLOR }, // 略帶靛藍
};

/**
 * 解析主題色（HEX 格式）
 */
export function resolveThemeColor(themeColor: ThemeColor): string {
  return THEME_COLORS[themeColor];
}

/**
 * 解析強調色（HEX 格式）
 */
export function resolveAccentColor(themeColor: ThemeColor): string {
  return ACCENT_COLORS[themeColor];
}

/**
 * 為 HEX 色碼加上透明度
 * @param hex - HEX 色碼（例如 '#2C4F7C'）
 * @param opacity - 透明度（0-1）
 * @returns RGBA 色碼（例如 'rgba(44, 79, 124, 0.2)'）
 */
export function withOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
