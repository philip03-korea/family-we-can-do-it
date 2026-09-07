import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GROUPS, featuresOfGroup } from '../data/features'
import { FAMILY, LEVELS } from '../data/family'
import BottomNav from '../components/BottomNav'

// 배움 · 집안 · 마음 공용 허브 한 개. 그룹 키만 다르게 받는다.
// 홈이 런처를 겸하지 않도록, 기능 목록은 전부 이 화면이 맡는다.
export default function GroupHub() {
  const { groupKey } = useParams()
  const navigate = useNavigate()
  const { profile, visibleFeatures, isViewing } = useAuth()

  const group = GROUPS.find((g) => g.key === groupKey)
  if (!group) return <Navigate to="/" replace />

  const items = featuresOfGroup(group.key, visibleFeatures)
  // 그룹이 통째로 꺼져 있으면 홈으로 되돌린다 (탭에도 안 보이는 그룹)
  if (items.length === 0) return <Navigate to="/" replace />

  const member = FAMILY.find((f) => f.key === profile?.member_key) || {}
  const level = LEVELS[profile?.level] || LEVELS.B

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 홈</button>
        <h1 className="text-xl font-bold">
          {group.emoji} {group.label}
        </h1>
        <span className="ml-auto text-sm text-slate-400">
          {isViewing && '👀 '}
          {member.emoji} {member.name}
          {group.key === 'learn' && profile?.level ? ` · ${level.code}` : ''}
        </span>
      </header>

      <div className="space-y-2">
        {items.map((f) => (
          <button
            key={f.key}
            onClick={() => navigate(f.route)}
            className="w-full flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3.5 text-left active:scale-[0.99] transition"
          >
            <span
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: group.tint + '26' }}
            >
              {f.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{f.name}</span>
              <span className="block text-xs text-slate-400 truncate">{f.desc}</span>
            </span>
            <span className="ml-auto text-slate-500 text-lg">›</span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-slate-600 mt-8">
        {items.length}개 열려 있어요 · 화면 구성은 부모님이 「나 → 화면 설정」에서 조정해요
      </p>

      <BottomNav />
    </div>
  )
}
