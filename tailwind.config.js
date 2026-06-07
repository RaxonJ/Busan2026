/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 釜山調色盤
      colors: {
        washi: '#F5F8FC',          // 海藍背景
        'washi-card': '#FAFCFF',   // 淺藍卡片
        'washi-border': '#DDE6F0', // 藍灰邊框
        ink: '#1A2B3C',            // 深藍主文字
        stone: '#5A6E82',          // 石藍次文字（WCAG AA 4.5:1）
        ai: '#1B4E8C',             // 釜山深藍主色
        vermillion: '#C25B56',     // 強調紅（保留）
      },
      // Noto Sans KR 字體
      fontFamily: {
        serif: ['"Noto Sans KR"', 'sans-serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      // 僅保留柔和動畫
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
