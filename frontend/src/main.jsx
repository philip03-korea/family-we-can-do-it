import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { primeTTS } from './lib/tts'
import { initButtonSound } from './lib/sound'
import './index.css'

// 버튼 클릭 효과음 전역 연결 (설정에서 끌 수 있음)
initButtonSound()

// ── PWA 새 버전 자동 적용 ────────────────────────────────────────────
// registerType:'autoUpdate' 는 새 서비스워커를 받아 활성화까지 해주지만,
// "이미 열려 있는 화면"은 옛 번들을 그대로 쥐고 있다. 홈 화면에 설치한 앱은
// 백그라운드에서 재개될 뿐 새로고침이 안 일어나서, 배포를 해도 며칠씩 옛 화면이
// 남는다 (가족 폰에서 실제로 겪었다: 한 명은 새 화면, 한 명은 옛 화면).
//
// 그래서 두 가지를 한다.
//   1) 앱을 다시 볼 때마다 새 버전이 있는지 확인
//   2) 새 서비스워커가 제어권을 가져오면 딱 한 번 새로고침
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // 첫 설치 때도 controllerchange 가 뜬다. 그때 새로고침하면 첫 방문이 깜빡이므로
  // "원래 제어하던 워커가 있었을 때"만 새로고침한다.
  const hadController = !!navigator.serviceWorker.controller
  let refreshing = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return
    refreshing = true
    window.location.reload()
  })

  const checkForUpdate = () => {
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg && reg.update())
      .catch(() => {})
  }
  // 앱으로 돌아올 때마다 확인 (설치형 PWA는 이 순간이 사실상 "앱 켜기"다)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate()
  })
  window.addEventListener('focus', checkForUpdate)
}

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
