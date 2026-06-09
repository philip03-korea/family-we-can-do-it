import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getStudyStats, getStreak, getLifetimeReviews } from '../lib/db'
import { computeXP, computeBadges } from '../lib/gamify'
import { FAMILY, LEVELS, LEVEL_ORDER } from '../data/family'
import VoiceDemo from '../components/VoiceDemo'

export default function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)
  const [streak, setStreak] = useState(null)
  const [game, setGame] = useState(null)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      getStudyStats(user.id, profile.level),
      getStreak(user.id),
      getLifetimeReviews(user.id),
    ])
      .then(([st, sk, totalReviews]) => {
        setStats(st)
        setStreak(sk)
        const merged = { totalReviews, learned: st.learned, total: st.total, streak: sk.streak }
        setGame({ xp: computeXP(merged), badges: computeBadges(merged) })
      })
      .catch(() => {})
  }, [user?.id, profile])

  // 프로필이 없으면: 내가 어떤 가족 구성원인지 선택
  if (!profile) {
    return <PickMember user={user} onPicked={refreshProfile} saving={saving} setSaving={setSaving} />
  }

  const member = FAMILY.find((f) => f.key === profile.member_key) || {}
  const level = LEVELS[profile.level] || LEVELS.B

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-24">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-400 text-sm">안녕하세요 👋</p>
          <h1 className="text-2xl font-bold">
            {member.emoji} {member.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {streak && (
            <span className="text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-full" title="연속 학습일">
              🔥 {streak.streak}일
            </span>
          )}
          <button onClick={signOut} className="text-sm text-slate-400 hover:text-slate-200">
            로그아웃
          </button>
        </div>
      </header>

      {/* 내 레벨 카드 */}
      <div className={`${level.bg} rounded-3xl p-6 mb-6 shadow-lg`}>
        <p className="text-white/80 text-sm">내 레벨</p>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-black text-white">{level.code}</span>
          <span className="text-white/90 mb-1.5 font-medium">
            {level.name} · {level.label}
          </span>
        </div>
        <p className="text-white/80 text-sm mt-2">{member.focus}</p>
        {streak && (
          <p className="text-white/70 text-xs mt-3">오늘 {streak.todayReviews}개 학습 · 🔥 연속 {streak.streak}일</p>
        )}
      </div>

      {/* 게임화: XP/레벨/배지 */}
      {game && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">⭐ Lv.{game.xp.level}</span>
            <span className="text-xs text-slate-400">{game.xp.intoLevel}/{game.xp.perLevel} XP</span>
          </div>
          <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden mb-4">
            <div className="bg-level-c h-full transition-all" style={{ width: `${game.xp.progress * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {game.badges.map((b) => (
              <div
                key={b.id}
                title={b.name}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                  b.earned ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-600'
                }`}
              >
                <span className={b.earned ? '' : 'grayscale opacity-50'}>{b.emoji}</span>
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 바로가기 */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button onClick={() => navigate('/words')} className="bg-slate-800/60 border border-slate-700 rounded-2xl py-3 text-sm font-medium">
          📒 단어장
        </button>
        <button onClick={() => navigate('/chat')} className="bg-slate-800/60 border border-slate-700 rounded-2xl py-3 text-sm font-medium">
          💬 AI 회화
        </button>
        <button onClick={() => navigate('/family')} className="bg-slate-800/60 border border-slate-700 rounded-2xl py-3 text-sm font-medium">
          👨‍👩‍👧‍👦 가족
        </button>
      </div>

      {/* 하울 전용 TOEFL 트랙 */}
      {profile.toefl_track && (
        <button
          onClick={() => navigate('/toefl')}
          className="bg-level-e w-full rounded-2xl py-3 mb-6 font-bold"
        >
          🎓 TOEFL 트랙 (영역별 훈련 + AI 채점)
        </button>
      )}

      {/* 오늘의 학습 */}
      <div className="bg-slate-800/60 rounded-3xl p-5 mb-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">오늘의 학습</h2>
          {stats && (
            <span className="text-xs text-slate-400">
              학습한 단어 {stats.learned}/{stats.total}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="복습 대기" value={stats ? stats.dueCount : '…'} accent="text-amber-400" />
          <Stat label="새 단어" value={stats ? stats.freshCount : '…'} accent="text-emerald-400" />
        </div>
        <button
          onClick={() => navigate('/study')}
          className={`${level.bg} w-full py-4 rounded-2xl font-bold text-lg`}
          disabled={stats && stats.dueCount === 0 && stats.freshCount === 0}
        >
          {stats && stats.dueCount === 0 && stats.freshCount === 0
            ? '오늘 학습 완료 ☕'
            : '학습 시작 →'}
        </button>
      </div>

      {/* 무료 음성(TTS/STT) 데모 — 비용 0원 동작 확인 */}
      <VoiceDemo />

      {/* 레벨 사다리 A→F */}
      <h2 className="text-lg font-bold mt-8 mb-3">레벨 사다리</h2>
      <div className="space-y-2">
        {LEVEL_ORDER.map((code) => {
          const lv = LEVELS[code]
          const isMine = code === profile.level
          return (
            <div
              key={code}
              className={`${lv.bg} rounded-2xl px-4 py-3 flex items-center justify-between ${
                isMine ? 'ring-2 ring-white' : 'opacity-70'
              }`}
            >
              <span className="font-bold text-white text-lg">{code}</span>
              <span className="text-white/90 text-sm">
                {lv.name} · {lv.label}
              </span>
              {isMine && <span className="text-white text-xs bg-black/20 px-2 py-0.5 rounded-full">나</span>}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-600 mt-8">
        STEP 1 완료 — 다음: 단어·SRS / 학습 UI (STEP 2~3)
      </p>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-4 text-center">
      <div className={`text-3xl font-black ${accent}`}>{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  )
}

// 처음 로그인 시: 가족 구성원 선택 → profiles에 저장
function PickMember({ user, onPicked, saving, setSaving }) {
  const [error, setError] = useState('')

  async function pick(f) {
    setSaving(true)
    setError('')
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      member_key: f.key,
      display_name: f.name,
      level: f.level,
      toefl_track: !!f.toefl,
    })
    if (error) setError(error.message)
    else await onPicked()
    setSaving(false)
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5">
      <h1 className="text-2xl font-bold mt-6 mb-1">누구신가요?</h1>
      <p className="text-slate-400 text-sm mb-6">가족 구성원을 선택하면 추천 레벨로 시작합니다.</p>
      <div className="space-y-3">
        {FAMILY.map((f) => (
          <button
            key={f.key}
            disabled={saving}
            onClick={() => pick(f)}
            className={`${LEVELS[f.level].bg} w-full rounded-2xl p-4 flex items-center gap-4 text-left disabled:opacity-50`}
          >
            <span className="text-3xl">{f.emoji}</span>
            <div className="flex-1">
              <div className="font-bold text-white">
                {f.name} <span className="text-white/70 text-sm font-normal">· {f.age}</span>
              </div>
              <div className="text-white/80 text-sm">
                레벨 {f.level} · {f.focus}
              </div>
            </div>
          </button>
        ))}
      </div>
      {error && <p className="text-amber-300 text-sm mt-4">⚠️ {error}</p>}
    </div>
  )
}
