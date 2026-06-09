import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { primeTTS } from './lib/tts'
import './index.css'

// iOS는 첫 사용자 제스처 안에서 음성을 한 번 깨워야 이후 자동 재생(예: AI 답변
// 읽어주기)이 무음이 되지 않는다. 첫 탭에서 1회만 실행.
if (typeof window !== 'undefined') {
  const unlock = () => {
    primeTTS()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('touchend', unlock)
  }
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('touchend', unlock, { once: true })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
