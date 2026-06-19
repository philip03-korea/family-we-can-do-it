import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getStudyStats, getStreak, getLifetimeReviews } from '../lib/db'
import { getBalance } from '../lib/rewards'
import { computeXP, computeBadges } from '../lib/gamify'
import { FAMILY, LEVELS, LEVEL_ORDER } from '../data/family'
import VoiceDemo from '../components/VoiceDemo'
import BottomNav from '../components/BottomNav'

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
  const { user, profile, ownProfile, signOut, refreshProfile, isParent, allProfiles, isViewing, viewKey, setViewAs, viewUserId } = useAuth()
  const ownKey = ownProfile?.member_key
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)
  const [streak, setStreak] = useState(null)
  const [game, setGame] = useState(null)
  const [points, setPoints] = useState(null)

  useEffect(() => {
    if (!profile) return
    const uid = viewUserId || user.id
    Promise.all([
      getStudyStats(uid, profile.level),
      getStreak(uid),
      getLifetimeReviews(uid),
      getBalance(profile.member_key).catch(() => 0),
    ])
      .then(([st, sk, totalReviews, bal]) => {
        setStats(st)
        setStreak(sk)
        setPoints(bal)
        const merged = { totalReviews, learned: st.learned, total: st.total, streak: sk.streak }
        setGame({ xp: computeXP(merged), badges: computeBadges(merged) })
      })
      .catch(() => {})
  }, [viewUserId, user?.id, profile])

  // 프로필이 없으면: 내가 어떤 가족 구성원인지 선택
  if (!profile) {
    return <PickMember user={user} onPicked={refreshProfile} saving={saving} setSaving={setSaving} />
  }

  const member = FAMILY.find((f) => f.key === profile.member_key) || {}
  const level = LEVELS[profile.level] || LEVELS.B

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      {/* 부모: 가족 구성원 미리보기 전환 */}
      {isParent && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-1.5">👀 화면 미리보기 (가족을 눌러 그 화면을 확인)</p>
          <div className="flex gap-1.5">
            {allProfiles
              .slice()
              .sort((a, b) => FAMILY.findIndex((f) => f.key === a.member_key) - FAMILY.findIndex((f) => f.key === b.member_key))
              .map((p) => {
                const f = FAMILY.find((x) => x.key === p.member_key) || {}
                const active = isViewing ? viewKey === p.member_key : p.member_key === ownKey
                return (
                  <button
                    key={p.id}
                    onClick={() => setViewAs(p.member_key === ownKey ? null : p.member_key)}
                    className={`flex-1 rounded-xl py-1.5 text-center border ${active ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                  >
                    <div className="text-base leading-none">{f.emoji}</div>
                    <div className="text-[11px] mt-0.5">{p.display_name}</div>
                  </button>
                )
              })}
          </div>
          {isViewing && (
            <div className="flex items-center justify-between bg-indigo-500/15 border border-indigo-500/40 rounded-xl px-3 py-2 mt-2">
              <span className="text-sm text-indigo-200">👀 {member.name} 화면 보는 중 (미리보기)</span>
              <button onClick={() => setViewAs(null)} className="text-xs bg-indigo-600 px-2.5 py-1 rounded-full">내 화면</button>
            </div>
          )}
        </div>
      )}

      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-400 text-sm">{isViewing ? '미리보기 👀' : '안녕하세요 👋'}</p>
          <h1 className="text-2xl font-bold">
            {member.emoji} {member.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {points != null && (
            <button
              onClick={() => navigate('/shop')}
              className="text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-full"
              title="보유 포인트 (상점)"
            >
              🛒 {points}P
            </button>
          )}
          {streak && (
            <span className="text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-full" title="연속 학습일">
              🔥 {streak.streak}일
            </span>
          )}
          {!isViewing && (
            <button onClick={signOut} className="text-sm text-slate-400 hover:text-slate-200">
              로그아웃
            </button>
          )}
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
        <button onClick={() => navigate('/chores')} className="bg-slate-800/60 border border-slate-700 rounded-2xl py-3 text-sm font-medium">
          🧹 집안일
        </button>
        <button onClick={() => navigate('/shop')} className="bg-slate-800/60 border border-slate-700 rounded-2xl py-3 text-sm font-medium">
          🛒 보상 상점
        </button>
        <button onClick={() => navigate('/math')} className="bg-slate-800/60 border border-slate-700 rounded-2xl py-3 text-sm font-medium">
          📐 수학
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
        {/* 복습 — 퀴즈로 */}
        <p className="text-xs text-slate-500 mt-3 mb-1.5">📚 복습 (학습한 단어로 퀴즈)</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/quiz?mode=solo')}
            className="py-3 rounded-2xl font-medium bg-slate-900 border border-slate-700 text-slate-200 text-sm"
          >
            🧑 혼자 풀기
          </button>
          <button
            onClick={() => navigate('/quiz?mode=examiner')}
            className="py-3 rounded-2xl font-medium bg-slate-900 border border-slate-700 text-slate-200 text-sm"
          >
            👥 퀴즈로 하기
          </button>
        </div>
        <button
          onClick={() => navigate('/study?mode=review')}
          className="w-full py-2.5 mt-2 rounded-2xl font-medium bg-slate-900/60 border border-slate-800 text-slate-400 text-sm"
        >
          🃏 플래시카드로 복습
        </button>
      </div>

      {/* 내 관심사 영어 — 좋아하는 주제로 단어 학습 */}
      {INTEREST_LINKS[profile.member_key] && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-1">🎯 내 관심사 영어</h2>
          <p className="text-slate-500 text-xs mb-3">좋아하는 주제로 단어를 익혀요</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_LINKS[profile.member_key].map((it) => (
              <button
                key={it.cat}
                onClick={() => navigate(`/study?cat=${it.cat}`)}
                className="flex-1 min-w-[45%] bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium"
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 무료 음성(TTS/STT) 데모 — 비용 0원 동작 확인 */}
      <VoiceDemo />

      {/* 레벨 사다리 A→F — 탭하면 그 레벨로 학습 */}
      <h2 className="text-lg font-bold mt-8 mb-1">레벨 사다리</h2>
      <p className="text-slate-500 text-xs mb-3">레벨을 눌러 그 레벨 단어로 학습할 수 있어요</p>
      <div className="space-y-2">
        {LEVEL_ORDER.map((code) => {
          const lv = LEVELS[code]
          const isMine = code === profile.level
          return (
            <button
              key={code}
              onClick={() => navigate(`/study?level=${code}`)}
              className={`${lv.bg} w-full rounded-2xl px-4 py-3 flex items-center justify-between text-left ${
                isMine ? 'ring-2 ring-white' : 'opacity-80'
              }`}
            >
              <span className="font-bold text-white text-lg">{code}</span>
              <span className="text-white/90 text-sm">
                {lv.name} · {lv.label}
              </span>
              <span className="flex items-center gap-1.5">
                {isMine && <span className="text-white text-xs bg-black/20 px-2 py-0.5 rounded-full">나</span>}
                <span className="text-white/70 text-lg">›</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => navigate('/guide')}
          className="text-sm text-slate-400 hover:text-slate-200 underline"
        >
          📖 사용설명서
        </button>
        <p className="text-xs text-slate-600 mt-3">FamTalk · 우리 가족 영어 🔥</p>
      </div>

      <BottomNav />
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
