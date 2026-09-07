import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ME_TAB, FEATURE_MAP, featureKeyOfPath } from '../data/features'

// 하단 고정 네비게이션.
// 탭 = 홈 + 「켜진 그룹」 + 나. 그룹 안의 기능이 전부 꺼지면 그 탭은 사라진다.
// 부모는 노출 설정과 무관하게 항상 세 그룹을 다 본다.
export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { visibleGroups } = useAuth()

  const items = [
    { to: '/', icon: '🏠', label: '홈', key: 'home-tab' },
    ...(visibleGroups || []).map((g) => ({
      to: `/g/${g.key}`,
      icon: g.emoji,
      label: g.label,
      key: g.key,
      group: g.key,
    })),
    { to: ME_TAB.route, icon: ME_TAB.emoji, label: ME_TAB.label, key: 'me' },
  ]

  // 지금 열려 있는 기능이 속한 그룹도 그 그룹 탭을 켜준 것으로 본다
  // (예: /study 에 있으면 「배움」 탭에 표시)
  const currentGroup = FEATURE_MAP[featureKeyOfPath(pathname) || '']?.group || null

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-900/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="max-w-md mx-auto grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((it) => {
          const active =
            it.to === '/'
              ? pathname === '/'
              : pathname.startsWith(it.to) || (it.group && it.group === currentGroup)
          return (
            <button
              key={it.key}
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
