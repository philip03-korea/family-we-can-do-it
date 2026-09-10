// 로컬 UI 검증 전용. 운영 빌드는 이 설정과 더미 프로필을 사용하지 않는다.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  root: fileURLToPath(new URL('../', import.meta.url)),
  plugins: [react(), { name:'preview-pages', configureServer(server) { server.middlewares.use((req,res,next) => { if (req.headers.accept?.includes('text/html') && !req.url.startsWith('/@')) req.url='/dev/studio-preview.html'; next() }) } }],
  optimizeDeps: { entries: ['dev/studio-preview.html'] },
  resolve: { alias: [{ find: /^.*\/context\/AuthContext(?:\.jsx)?$/, replacement: fileURLToPath(new URL('./preview-auth.jsx', import.meta.url)) }, { find: /^.*\/lib\/tutor$/, replacement: fileURLToPath(new URL('./preview-tutor.js', import.meta.url)) }] },
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
})
