import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'images/food-studio.png'],
      manifest: {
        name: 'FamTalk — 우리 가족 영어',
        short_name: 'FamTalk',
        description: '배움과 진로, 일상을 함께하는 우리 가족 스튜디오',
        theme_color: '#4f46e5',
        background_color: '#f7f6f2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // 생성된 서비스워커가 푸시 핸들러(public/push-sw.js)를 불러옴
        importScripts: ['push-sw.js'],
        // 한 번 받은 음성 파일은 브라우저에 캐싱 → 서버/네트워크 비용 0
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/storage/tts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tts-audio-cache',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
      },
    }),
  ],
})
