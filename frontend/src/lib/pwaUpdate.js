// ============================================================
// PWA 자동 업데이트 + 강제 새로고침
// 아이폰 홈화면 PWA는 주소창·당겨서새로고침이 없어서 새 배포가 잘 안 잡힌다.
// → (1) 주기적으로 새 버전을 확인하고, 새 서비스워커가 오면 자동 교체·리로드
//   (2) 사용자가 직접 누르는 "새로고침" 버튼용 hardRefresh() 제공
// ============================================================
import { registerSW } from 'virtual:pwa-register'

let _updateSW = null

/** 앱 시작 시 1회 호출 — 서비스워커 등록 + 주기적 업데이트 확인 */
export function registerPwaUpdater() {
  if (typeof window === 'undefined') return
  _updateSW = registerSW({
    immediate: true,
    onRegisteredSW(swUrl, reg) {
      if (!reg) return
      // 1) 30초마다 새 버전 확인 (앱을 계속 켜둔 경우 대비)
      setInterval(() => { reg.update().catch(() => {}) }, 30 * 1000)
      // 2) 앱을 다시 보거나 포커스할 때마다 확인 (iOS 백그라운드 복귀 대응)
      const check = () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', check)
      window.addEventListener('focus', check)
    },
  })
}

/**
 * 사용자가 "새로고침" 버튼을 눌렀을 때 — 캐시를 비우고 최신 버전으로 강제 리로드.
 * 아이폰 PWA에서 새로고침 수단이 없을 때의 탈출구.
 */
export async function hardRefresh() {
  // 1) 최신 서비스워커 확인 + 대기 중이면 즉시 교체
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.()
    if (reg) {
      await reg.update().catch(() => {})
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  } catch { /* 무시 */ }
  // 2) 캐시 스토리지 전부 비우기 (workbox precache 포함 → 다음 요청은 네트워크에서)
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch { /* 무시 */ }
  // 3) 최신 index.html 을 받도록 강제 리로드
  window.location.reload()
}
