import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStudyStats, getStreak, getLifetimeReviews } from '../lib/db'
import { computeXP, computeBadges } from '../lib/gamify'
import { isPushSupported, getPushEnabled, enablePush, disablePush, sendTestPush } from '../lib/push'
import { isSoundOn, setSoundOn, playSuccess } from '../lib/sound'
import { FAMILY, LEVELS, LEVEL_ORDER } from '../data/family'
import VoiceDemo from '../components/VoiceDemo'
import BottomNav from '../components/BottomNav'

// 「나」 탭 — 프로필·배지, 레벨 사다리, 알림·효과음, 사용설명서,
// 그리고 부모 전용 관리 도구(화면 설정 · 교회 교육기획).
// 홈에 쌓여 있던 설정 뭉치를 여기로 옮겨 홈을 「오늘」만 남겼다.
export default function Me() {
  const navigate = useNavigate()
  const { user, profile, ownProfile, signOut, isParent, isViewing, viewUserId, setViewAs, canSee } = useAuth()
  const ownKey = ownProfile?.member_key

  const [game, setGame] = useState(null)
  const [pushOn, setPushOn] = useState(false)
  const [soundOnState, setSoundOnState] = useState(isSoundOn())
  const [pushMsg, setPushMsg] = useState('')

  useEffect(() => {
    getPushEnabled().then(setPushOn).catch(() => {})
  }, [])

  useEffect(() => {
    if (!profile) return
    const uid = viewUserId || user?.id
    if (!uid) return
    Promise.all([getStudyStats(uid, profile.level), getStreak(uid), getLifetimeReviews(uid)])
      .then(([st, sk, totalReviews]) => {
        const merged = { totalReviews, learned: st.learned, total: st.total, streak: sk.streak }
        setGame({ xp: computeXP(merged), badges: computeBadges(merged) })
      })
      .catch(() => {})
  }, [viewUserId, user?.id, profile])

  async function togglePush() {
    setPushMsg('')
    try {
      if (pushOn) {
        await disablePush()
        setPushOn(false)
      } else {
        await enablePush({ userId: user.id, memberKey: ownKey })
        setPushOn(true)
        setPushMsg('알림이 켜졌어요! 🔔')
      }
    } catch (e) {
      setPushMsg('⚠️ ' + e.message)
    }
  }
  async function testPush() {
    setPushMsg('보내는 중…')
    try {
      const r = await sendTestPush()
      setPushMsg(r?.sent ? '테스트 알림을 보냈어요! 📩' : '구독이 없어요. 먼저 알림을 켜주세요.')
    } catch (e) {
      setPushMsg('⚠️ ' + e.message)
    }
  }

  const member = FAMILY.find((f) => f.key === profile?.member_key) || {}
  const level = LEVELS[profile?.level] || LEVELS.B

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 홈</button>
        <h1 className="text-xl font-bold">⚙️ 나</h1>
      </header>

      <div className={`${level.bg} rounded-3xl p-6 mb-5 shadow-lg`}>
        <p className="text-white/80 text-sm">{isViewing ? '미리보기 👀' : '내 프로필'}</p>
        <h1 className="text-2xl font-black text-white">
          {member.emoji} {member.name}
        </h1>
        <p className="text-white/85 text-sm mt-1">
          레벨 {level.code} · {level.name} · {level.label}
        </p>
        <p className="text-white/70 text-xs mt-2">{member.focus}</p>
      </div>

      {isViewing && (
        <button
          onClick={() => setViewAs(null)}
          className="w-full mb-5 bg-indigo-500/15 border border-indigo-500/40 rounded-2xl px-4 py-3 text-sm text-indigo-200"
        >
          👀 {member.name} 화면 보는 중 — 내 화면으로 돌아가기
        </button>
      )}

      {game && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">⭐ Lv.{game.xp.level}</span>
            <span className="text-xs text-slate-400">
              {game.xp.intoLevel}/{game.xp.perLevel} XP
            </span>
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

      {/* 부모 전용 관리 도구 */}
      {isParent && !isViewing && (
        <div className="mb-5">
          <h2 className="text-lg font-bold mb-2">🛠 관리</h2>
          <div className="space-y-2">
            <Row emoji="🎛" title="화면 설정" desc="아이별로 보이는 기능 켜고 끄기" onClick={() => navigate('/manage')} />
            {ownKey === 'dad' && (
              <Row emoji="⛪" title="교회 교육기획" desc="아빠 계정 전용" onClick={() => navigate('/church')} />
            )}
          </div>
        </div>
      )}

      {/* 레벨 사다리 — /study 로 보내므로 단어 학습이 켜진 사람에게만
          (꺼진 아이에게 보여주면 눌러도 홈으로 되돌아가 혼란스럽다) */}
      {canSee('study') && (<>
      <h2 className="text-lg font-bold mb-1">레벨 사다리</h2>
      <p className="text-slate-500 text-xs mb-3">레벨을 눌러 그 레벨 단어로 학습할 수 있어요</p>
      <div className="space-y-2 mb-6">
        {LEVEL_ORDER.map((code) => {
          const lv = LEVELS[code]
          const isMine = code === profile?.level
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
      </>)}

      {/* 알림 · 효과음 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 mb-5">
        <h2 className="text-lg font-bold mb-3">⚙️ 설정</h2>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium">🔔 푸시 알림</p>
            <p className="text-xs text-slate-400">매일 아침 알림 · 가족 소식 (아이폰은 홈 화면 추가 후)</p>
          </div>
          <button
            onClick={togglePush}
            disabled={!isPushSupported()}
            className={`w-14 h-8 rounded-full relative transition ${pushOn ? 'bg-emerald-500' : 'bg-slate-600'} disabled:opacity-40`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${pushOn ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {pushOn && (
          <button onClick={testPush} className="text-xs text-indigo-300 underline mb-1">
            테스트 알림 보내기
          </button>
        )}
        <div className="flex items-center justify-between py-2 border-t border-slate-700 mt-1">
          <div>
            <p className="font-medium">🔊 버튼 효과음</p>
            <p className="text-xs text-slate-400">버튼 누를 때 소리</p>
          </div>
          <button
            onClick={() => {
              const n = !soundOnState
              setSoundOn(n)
              setSoundOnState(n)
              if (n) playSuccess()
            }}
            className={`w-14 h-8 rounded-full relative transition ${soundOnState ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${soundOnState ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {pushMsg && <p className="text-xs text-slate-300 mt-2">{pushMsg}</p>}
        {!isPushSupported() && (
          <p className="text-xs text-amber-300 mt-2">이 기기는 푸시를 지원하지 않아요. (아이폰: 홈 화면에 추가 후 가능)</p>
        )}
      </div>

      {/* 음성 데모 — 부모 계정에서만 (개발·점검용) */}
      {isParent && !isViewing && <VoiceDemo />}

      <div className="text-center mt-6">
        <button onClick={() => navigate('/guide')} className="text-sm text-slate-400 underline">
          📖 사용설명서
        </button>
        {!isViewing && (
          <button onClick={signOut} className="block mx-auto mt-4 text-sm text-slate-500 underline">
            로그아웃
          </button>
        )}
        <p className="text-xs text-slate-600 mt-3">FamTalk · 우리 가족 🔥</p>
      </div>

      <BottomNav />
    </div>
  )
}

function Row({ emoji, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3.5 text-left"
    >
      <span className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-xl shrink-0">{emoji}</span>
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        <span className="block text-xs text-slate-400 truncate">{desc}</span>
      </span>
      <span className="ml-auto text-slate-500 text-lg">›</span>
    </button>
  )
}
