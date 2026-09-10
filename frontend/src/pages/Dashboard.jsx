import StudioHome from '../components/StudioHome'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getStudyStats, getStreak } from '../lib/db'
import { getBalance } from '../lib/rewards'
import { FAMILY, LEVELS } from '../data/family'

// 아이별 관심사 → 학습 카테고리 바로가기
const INTEREST_LINKS = {
  haeum: [{ cat: 'webtoon', label: '🎬 웹툰·배우 영어' }],
  haul: [
    { cat: 'sat', label: '📖 SAT 단어' },
    { cat: 'math_en', label: '➗ 수학 영어' },
    { cat: 'science_en', label: '🔬 과학 영어' },
    { cat: 'football', label: '⚽ 축구 영어' },
    { cat: 'kpop_rap', label: '🎤 랩·음악 영어' },
  ],
  haram: [
    { cat: 'games', label: '🎮 게임 영어' },
    { cat: 'popsong', label: '🎵 팝송 영어' },
  ],
}

export default function Dashboard() {
  const { user, profile, refreshProfile, viewUserId } = useAuth()
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)
  const [streak, setStreak] = useState(null)
  const [points, setPoints] = useState(null)

  useEffect(() => {
    if (!profile) return
    let alive = true
    setStats(null); setStreak(null); setPoints(null)
    const uid = viewUserId || user.id
    Promise.all([
      getStudyStats(uid, profile.level),
      getStreak(uid),
      getBalance(profile.member_key).catch(() => null),
    ])
      .then(([st, sk, bal]) => {
        if (!alive) return
        setStats(st)
        setStreak(sk)
        setPoints(bal)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [viewUserId, user?.id, profile])

  // 프로필이 없으면: 내가 어떤 가족 구성원인지 선택
  if (!profile) {
    return <PickMember user={user} onPicked={refreshProfile} saving={saving} setSaving={setSaving} />
  }

  return <StudioHome stats={stats} streak={streak} points={points} interests={INTEREST_LINKS[profile.member_key] || []} />
}

// 처음 로그인 시: 가족 구성원 선택 → profiles에 저장
function PickMember({ user, onPicked, saving, setSaving }) {
  const [error, setError] = useState('')
  // 이미 다른 계정이 가져간 구성원 (한 구성원 = 한 계정)
  const [taken, setTaken] = useState([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, member_key')
      .then(({ data }) => setTaken((data || []).filter((p) => p.id !== user.id).map((p) => p.member_key)))
  }, [user.id])

  async function pick(f) {
    if (taken.includes(f.key)) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      member_key: f.key,
      display_name: f.name,
      level: f.level,
      toefl_track: !!f.toefl,
    })
    // DB 유니크 인덱스(step14)에 걸린 경우 — 그 사이 다른 기기에서 선점한 상황
    if (error?.code === '23505') {
      setError(`${f.name}는 이미 다른 계정이 사용 중이에요. 본인 계정으로 로그인해 주세요.`)
      setTaken((t) => [...t, f.key])
    } else if (error) setError(error.message)
    else await onPicked()
    setSaving(false)
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5">
      <h1 className="text-2xl font-bold mt-6 mb-1">누구신가요?</h1>
      <p className="text-slate-400 text-sm mb-6">가족 구성원을 선택하면 추천 레벨로 시작합니다.</p>
      <div className="space-y-3">
        {FAMILY.map((f) => {
          const used = taken.includes(f.key)
          return (
            <button
              key={f.key}
              disabled={saving || used}
              onClick={() => pick(f)}
              className={`${LEVELS[f.level].bg} w-full rounded-2xl p-4 flex items-center gap-4 text-left disabled:opacity-50 ${used ? 'grayscale' : ''}`}
            >
              <span className="text-3xl">{f.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-white">
                  {f.name} <span className="text-white/70 text-sm font-normal">· {f.age}</span>
                </div>
                <div className="text-white/80 text-sm">
                  {used ? '이미 사용 중 — 다른 계정이 선택했어요' : `레벨 ${f.level} · ${f.focus}`}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {error && <p className="text-amber-300 text-sm mt-4">⚠️ {error}</p>}
    </div>
  )
}
