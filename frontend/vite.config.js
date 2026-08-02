import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 등록은 src/lib/pwaUpdate.js 에서 직접 한다 (주기적 업데이트 확인을 위해). 자동 주입 끔.
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'FamTalk — 우리 가족 영어',
        short_name: 'FamTalk',
        description: '다섯 식구가 함께 오르는 영어 사다리 A→F',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
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
