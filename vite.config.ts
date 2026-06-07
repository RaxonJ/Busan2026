import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { tripConfig } from './src/config/trip'

// ── HTML 注入插件：將 index.html 中的 __TRIP_*__ 佔位符替換為 tripConfig 值 ──
const htmlInjectPlugin = {
  name: 'html-inject-trip',
  transformIndexHtml(html: string) {
    return html
      .replace(/__TRIP_NAME__/g, tripConfig.appName)
      .replace(/__TRIP_SHORT_NAME__/g, tripConfig.appShortName)
      .replace(/__TRIP_DESCRIPTION__/g, tripConfig.appDescription)
      .replace(/__THEME_COLOR__/g, tripConfig.themeColor);
  },
};

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true, // TODO: 移除，待補充測試後改為 false
  },
  server: {
    host: true, // 監聽所有網路介面（包括 LAN）
    port: 5173,
  },
  plugins: [
    htmlInjectPlugin,
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        navigateFallbackDenylist: [/^\/attachments\//, /^\/photos\//],
        runtimeCaching: [
          {
            // HTML / JS / CSS - NetworkFirst
            urlPattern: ({ request }) =>
              request.destination === 'document' ||
              request.destination === 'script' ||
              request.destination === 'style',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60
              },
            },
          },
          {
            // 圖片 - CacheFirst（圖片不常變）
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
            },
          },
          {
            // Supabase Storage 靜態檔案（照片、附件）- CacheFirst
            urlPattern: ({ url }) =>
              url.hostname.includes('supabase.co') &&
              url.pathname.includes('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            // Supabase API - NetworkOnly（不讓 SW 快取，離線由 App 的 localStorage 機制處理）
            urlPattern: ({ url }) => url.origin.includes('supabase.co'),
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: tripConfig.appName,
        short_name: tripConfig.appShortName,
        description: tripConfig.appDescription,
        theme_color: tripConfig.themeColor,
        background_color: tripConfig.backgroundColor,
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
        ],
      },
    }),
  ],
})
