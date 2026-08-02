import { useState } from 'react'
import { hardRefresh } from '../lib/pwaUpdate'

// 어디서나 눌러 최신 버전으로 강제 새로고침 (특히 아이폰 홈화면 PWA용).
// 하단 네비 위, 우측에 떠 있는 작은 버튼.
export default function RefreshButton() {
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      aria-label="새로고침"
      onClick={async () => { setBusy(true); await hardRefresh() }}
      disabled={busy}
      className="fixed z-50 right-3 flex items-center gap-1 rounded-full bg-indigo-600/90 text-white shadow-lg px-3 py-2 text-xs font-bold active:scale-95 backdrop-blur disabled:opacity-70"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
    >
      <span className={busy ? 'animate-spin' : ''}>🔄</span>
      {busy ? '새로고침…' : '새로고침'}
    </button>
  )
}
