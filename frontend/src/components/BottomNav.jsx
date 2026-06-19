import { useNavigate, useLocation } from 'react-router-dom'

// 하단 고정 네비게이션 (모바일 앱 느낌 — 아래 공간 활용)
const ITEMS = [
  { to: '/', icon: '🏠', label: '홈' },
  { to: '/chores', icon: '🧹', label: '집안일' },
  { to: '/meals', icon: '🍚', label: '식단표' },
  { to: '/family', icon: '👨‍👩‍👧‍👦', label: '가족' },
  { to: '/shop', icon: '🛒', label: '상점' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-900/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5">
        {ITEMS.map((it) => {
          const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to)
          return (
            <button
              key={it.to}
              onClick={() => navigate(it.to)}
              className={`flex flex-col items-center gap-0.5 py-2.5 ${active ? 'text-white' : 'text-slate-400'}`}
            >
              <span className={`text-xl leading-none ${active ? '' : 'opacity-80'}`}>{it.icon}</span>
              <span className="text-[11px] font-medium">{it.label}</span>
              <span className={`h-0.5 w-6 rounded-full mt-0.5 ${active ? 'bg-indigo-400' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
