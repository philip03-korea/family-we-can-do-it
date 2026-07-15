import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FAMILY, colorOf, textOnColor } from '../data/family'
import {
  TESTS, TEST_LIST, TEST_GROUPS, DISCLAIMER, HOTLINES, CHAT_HELP, CENTER_FINDER, TONE_STYLE, scoreTest,
  CONFIDENTIALITY, PARENT_KEYS, notifiesParents, displayScore, displayMax,
} from '../data/counsel'
import {
  saveResult, listMyResults, listSharedResults, setShared, setNote, deleteResult,
  listChildCrisis, markParentSeen, notifyParentsOfCrisis,
  latestByTest, trendOf, friendlyCounselError,
} from '../lib/counsel'
import BottomNav from '../components/BottomNav'

const nameOf = (k) => FAMILY.find((f) => f.key === k)?.name || '가족'

function Avatar({ k, size = 24 }) {
  if (!k) return null
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold shrink-0"
      style={{ width: size, height: size, background: colorOf(k), color: textOnColor(k), fontSize: size * 0.5 }}
    >
      {FAMILY.find((f) => f.key === k)?.emoji || '·'}
    </span>
  )
}

// ============================================================
// 위기개입 화면 — 하23 프로토콜: 점수보다 먼저, 즉시, 회피 없이
// ============================================================
function CrisisScreen({ onClose, notifiesParent }) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900 overflow-y-auto">
      <div className="max-w-md mx-auto p-5 pb-10">
        <div className="bg-rose-500/15 border-2 border-rose-500/50 rounded-2xl p-5 mb-4 mt-4">
          <h1 className="text-xl font-bold text-rose-200 mb-3">잠깐만요. 혼자 두지 않을게요.</h1>
          <p className="text-sm text-slate-200 leading-relaxed mb-2">
            방금 답변에서 <strong className="text-rose-200">스스로를 해치고 싶은 마음</strong>에 대한 이야기가 있었어요.
            지금 정말 힘든 시간을 보내고 계시는 것 같아요.
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">
            그 마음이 드는 건 당신이 약해서가 아니에요. 지금 바로 도움을 받을 수 있고,
            아래 번호는 <strong>24시간·무료·비밀보장</strong>이에요.
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {HOTLINES.filter((h) => h.urgent).map((h) => (
            <a
              key={h.num}
              href={`tel:${h.num.replace(/-/g, '')}`}
              className="block bg-rose-600 rounded-2xl p-4 active:scale-[0.98] transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-white">{h.num}</div>
                  <div className="text-sm font-bold text-rose-100">{h.name}</div>
                  <div className="text-xs text-rose-200/80 mt-0.5">{h.desc}</div>
                </div>
                <span className="text-3xl">📞</span>
              </div>
            </a>
          ))}
        </div>

        <p className="text-xs text-slate-400 mb-2">전화가 부담스러우면 채팅으로도 가능해요</p>
        <a href={CHAT_HELP.url} target="_blank" rel="noreferrer" className="block bg-slate-800 border border-slate-600 rounded-2xl p-4 mb-4">
          <div className="font-bold text-sm text-sky-300">💬 {CHAT_HELP.name}</div>
          <div className="text-xs text-slate-400 mt-1">{CHAT_HELP.desc}</div>
        </a>

        <div className="bg-slate-800/60 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-sm mb-2">🤝 지금 할 수 있는 것</h2>
          <ul className="text-sm text-slate-300 space-y-2 leading-relaxed">
            <li>· <strong className="text-white">곁에 있는 가족에게 지금 마음을 말해주세요.</strong> 혼자 견디지 않아도 돼요.</li>
            <li>· 위 번호로 전화하거나, 어렵다면 문자·채팅 상담을 이용해보세요.</li>
            <li>· 당장 위험하다고 느껴지면 <a href="tel:119" className="text-rose-300 font-bold underline">119</a> 또는 <a href="tel:112" className="text-rose-300 font-bold underline">112</a>에 연락하세요.</li>
          </ul>
        </div>

        {/* ⚠️ 이 안내는 실제 동작과 반드시 일치해야 한다 (거짓 고지 금지) */}
        {notifiesParent ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
            <p className="text-xs text-amber-200/90 leading-relaxed">
              처음에 약속한 대로, <strong>이 답은 엄마·아빠 폰으로 알림이 갔어요.</strong> 숨기려는 게 아니라
              미리 말해둔 거고, 네가 걱정돼서예요. 점수나 다른 검사 내용은 여전히 너만 봐요.
              <br /><br />
              이 앱은 AI 조력자라 훈련된 상담사가 아니고 진단도 하지 않아요.
              그래서 <strong>실제 전문가·어른에게 연결되는 것</strong>이 가장 중요해요.
            </p>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
            <p className="text-xs text-amber-200/90 leading-relaxed">
              이 앱은 AI 조력자예요. 훈련된 상담사가 아니고 진단도 하지 않아요.
              그래서 <strong>실제 전문가에게 연결되는 것</strong>이 가장 중요해요.
              이 결과는 가족에게 공유되지 않아요 — 말하고 싶을 때 직접 이야기하면 돼요.
            </p>
          </div>
        )}

        <button onClick={onClose} className="w-full py-3 rounded-2xl bg-slate-700 font-bold text-sm">
          확인했어요, 닫기
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-3">
          이 화면은 언제든 상담 탭에서 다시 볼 수 있어요.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// ⓘ 검사 설명 — 어떤 검사인지 알고 받도록
// ============================================================
function InfoPanel({ test, onStart, onClose }) {
  const i = test.info || {}
  const rows = [
    { icon: '🔍', label: '어떤 검사인가요?', text: i.what },
    { icon: '👤', label: '누가 만들었나요?', text: i.who },
    { icon: '🧮', label: '어떻게 채점하나요?', text: i.how },
    { icon: '⚠️', label: '한계 — 꼭 알아두세요', text: i.limit, warn: true },
    { icon: '📄', label: '출처·사용 권한', text: i.license },
  ].filter((r) => r.text)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      <div className="max-w-md mx-auto p-5 pb-10">
        <div className="flex items-center justify-between mb-4 pt-2">
          <h2 className="font-bold flex items-center gap-2">
            <span className="text-xl">{test.emoji}</span> {test.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 text-sm">닫기 ✕</button>
        </div>

        <div className="flex gap-2 mb-4">
          <span className="text-[11px] bg-slate-800 border border-slate-600 rounded-full px-2.5 py-1">
            {test.questions.length}문항
          </span>
          <span className="text-[11px] bg-slate-800 border border-slate-600 rounded-full px-2.5 py-1">
            약 {test.minutes}분
          </span>
          <span className="text-[11px] bg-slate-800 border border-slate-600 rounded-full px-2.5 py-1">
            {test.period}
          </span>
          {test.kind === 'profile' && (
            <span className="text-[11px] bg-violet-600/30 border border-violet-500/50 text-violet-200 rounded-full px-2.5 py-1">
              점수 아님 · 프로필
            </span>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {rows.map((r) => (
            <div key={r.label} className={`rounded-2xl p-3.5 border ${r.warn ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/60 border-slate-700'}`}>
              <div className={`text-xs font-bold mb-1.5 ${r.warn ? 'text-amber-300' : 'text-slate-400'}`}>
                {r.icon} {r.label}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{r.text}</p>
            </div>
          ))}
          {i.note && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3.5">
              <p className="text-sm text-sky-200 leading-relaxed">💡 {i.note}</p>
            </div>
          )}
        </div>

        {/* 프로필형이면 무엇을 재는지 미리 보여줌 */}
        {test.dimensions && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 mb-4">
            <div className="text-xs font-bold text-slate-400 mb-2">📊 이런 걸 봐요</div>
            <div className="space-y-1.5">
              {test.dimensions.map((d) => (
                <div key={d.key} className="flex items-start gap-2">
                  <span className="text-sm shrink-0">{d.emoji}</span>
                  <div className="text-xs">
                    <span className="font-bold" style={{ color: d.color }}>{d.name}</span>
                    <span className="text-slate-400"> — {d.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onStart} className="w-full py-3.5 rounded-2xl bg-indigo-600 font-bold text-sm mb-2">
          검사 시작하기
        </button>
        <button onClick={onClose} className="w-full py-3 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm">
          나중에
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 프로필형 결과 (빅파이브·SDQ) — 점수가 아니라 "결"을 보여줌
// ============================================================
function ProfileResult({ test, subscores }) {
  return (
    <div className="space-y-3">
      {test.dimensions.map((d) => {
        const s = subscores?.[d.key]
        if (!s) return null
        const desc = s.pct >= 60 ? d.high : s.pct <= 40 ? d.low : null
        return (
          <div key={d.key} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <span>{d.emoji}</span>
                <span style={{ color: d.color }}>{d.name}</span>
              </span>
              <span className="text-xs text-slate-400">{s.raw} / {s.max}</span>
            </div>
            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: d.color }} />
            </div>
            {desc && <p className="text-xs text-slate-300 leading-relaxed">{desc}</p>}
          </div>
        )
      })}
      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
        높은 쪽이 좋은 게 아니에요. 그냥 &ldquo;나는 이런 결의 사람&rdquo;이라는 뜻이에요.
      </p>
    </div>
  )
}

// ============================================================
// 비밀보장의 한계 고지 — 검사 시작 전 반드시 표시
// (하23 상담 윤리: 고지 내용은 실제 동작과 일치해야 한다)
// ============================================================
function ConsentScreen({ test, isChild, onAgree, onCancel }) {
  const c = isChild ? CONFIDENTIALITY.child : CONFIDENTIALITY.parent
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      <div className="max-w-md mx-auto p-5 pb-10">
        <div className="flex items-center justify-between mb-4 pt-2">
          <h2 className="font-bold">{test.emoji} {test.name}</h2>
          <button onClick={onCancel} className="text-slate-400 text-sm">닫기 ✕</button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-4">
          <h3 className="font-bold text-base mb-3">{c.title}</h3>

          <div className="flex gap-3 mb-4">
            <span className="text-xl shrink-0">🔒</span>
            <p className="text-sm text-slate-200 leading-relaxed">{c.private}</p>
          </div>

          {isChild && (
            <div className="flex gap-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <span className="text-xl shrink-0">⚠️</span>
              <p className="text-sm text-amber-100 leading-relaxed">{c.limit}</p>
            </div>
          )}
          {!isChild && (
            <div className="flex gap-3 mb-4">
              <span className="text-xl shrink-0">👨‍👩‍👧‍👦</span>
              <p className="text-sm text-slate-300 leading-relaxed">{c.limit}</p>
            </div>
          )}

          {c.why && (
            <div className="flex gap-3">
              <span className="text-xl shrink-0">💙</span>
              <p className="text-sm text-slate-300 leading-relaxed">{c.why}</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{DISCLAIMER}</p>

        <button onClick={onAgree} className="w-full py-3.5 rounded-2xl bg-indigo-600 font-bold text-sm mb-2">
          알겠어요, 시작할게요
        </button>
        <button onClick={onCancel} className="w-full py-3 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm">
          나중에 할게요
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 검사 진행
// ============================================================
function TestRunner({ test, onDone, onCancel }) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const total = test.questions.length
  const pct = Math.round((idx / total) * 100)

  function pick(v) {
    const next = [...answers]
    next[idx] = v
    setAnswers(next)
    if (idx + 1 < total) setTimeout(() => setIdx(idx + 1), 140)
    else setTimeout(() => onDone(next), 140)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      <div className="max-w-md mx-auto p-5">
        <div className="flex items-center justify-between mb-3 pt-2">
          <button onClick={onCancel} className="text-slate-400 text-sm">← 그만두기</button>
          <span className="text-xs text-slate-400">{idx + 1} / {total}</span>
        </div>

        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-5">
          <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: test.color }} />
        </div>

        <p className="text-xs text-slate-500 mb-1">{test.period}</p>
        <h2 className="text-lg font-bold leading-snug mb-6 min-h-[3.5rem]">{test.questions[idx]}</h2>

        <div className="space-y-2">
          {test.scale.map((s) => (
            <button
              key={s.v}
              onClick={() => pick(s.v)}
              className={`w-full py-3.5 px-4 rounded-2xl text-left text-sm font-medium border-2 transition active:scale-[0.98] ${
                answers[idx] === s.v ? 'border-white bg-slate-700' : 'border-slate-700 bg-slate-800/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)} className="w-full mt-4 py-2.5 text-sm text-slate-400">
            ← 이전 문항
          </button>
        )}

        <p className="text-[11px] text-slate-600 mt-6 leading-relaxed">{DISCLAIMER}</p>
      </div>
    </div>
  )
}

// ============================================================
// 결과 화면
// ============================================================
function ResultView({ test, result, onShare, onClose, isShared }) {
  const isProfile = test.kind === 'profile'
  const tone = TONE_STYLE[result.level?.tone || 'ok']
  const pct = isProfile ? 0 : Math.round((result.score / test.max) * 100)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      <div className="max-w-md mx-auto p-5 pb-10">
        <div className="flex items-center justify-between mb-4 pt-2">
          <h2 className="font-bold">{test.emoji} {test.name} 결과</h2>
          <button onClick={onClose} className="text-slate-400 text-sm">닫기 ✕</button>
        </div>

        {isProfile ? (
          <div className="mb-4">
            <ProfileResult test={test} subscores={result.subscores} />
          </div>
        ) : (
          <div className={`${tone.bg} border-2 ${tone.border} rounded-2xl p-5 mb-4 text-center`}>
            <div className="text-5xl font-black mb-1" style={{ color: test.color }}>
              {displayScore(test.key, result.score)}
            </div>
            <div className="text-xs text-slate-400 mb-3">/ {displayMax(test.key)}점</div>
            <div className={`text-xl font-bold ${tone.text}`}>{result.level.label}</div>
            <div className="h-2 bg-slate-900/60 rounded-full overflow-hidden mt-4">
              <div className="h-full" style={{ width: `${pct}%`, background: test.color }} />
            </div>
          </div>
        )}

        {!isProfile && (
          <div className="bg-slate-800/60 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold mb-2">💡 다음 단계</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{result.level.next}</p>
            {test.note && <p className="text-xs text-slate-500 mt-2">{test.note}</p>}
          </div>
        )}

        {/* 중등도 이상이면 상담 자원 안내 */}
        {!isProfile && (result.level.tone === 'warn' || result.level.tone === 'alert') && (
          <div className="bg-slate-800/60 border border-slate-600 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold mb-2">🤝 도움받을 수 있는 곳</h3>
            <div className="space-y-2">
              <a href="tel:15770199" className="flex items-center justify-between bg-slate-900 rounded-xl p-3">
                <div>
                  <div className="font-bold text-sm">1577-0199</div>
                  <div className="text-[11px] text-slate-400">정신건강 위기상담 · 24시간</div>
                </div>
                <span>📞</span>
              </a>
              <a href={CENTER_FINDER.url} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-slate-900 rounded-xl p-3">
                <div>
                  <div className="font-bold text-sm">{CENTER_FINDER.name}</div>
                  <div className="text-[11px] text-slate-400">{CENTER_FINDER.desc}</div>
                </div>
                <span>🔗</span>
              </a>
            </div>
          </div>
        )}

        {/* 가족 공유 — 위기 결과는 불가 */}
        {result.crisis ? (
          <div className="bg-slate-800/60 border border-slate-600 rounded-2xl p-4 mb-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              🔒 이 결과는 가족 공유가 되지 않아요. 먼저 전문가와 이야기해보시고,
              가족에게는 직접 말하고 싶을 때 말해주세요.
            </p>
          </div>
        ) : (
          <button
            onClick={onShare}
            className={`w-full py-3 rounded-2xl font-bold text-sm mb-3 border-2 ${
              isShared ? 'bg-violet-600 border-violet-400' : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            {isShared ? '✓ 가족회의에서 나누기 (공유됨)' : '👨‍👩‍👧‍👦 가족회의에서 나누기'}
          </button>
        )}

        <p className="text-[11px] text-slate-600 leading-relaxed mb-4">{DISCLAIMER}</p>
        <button onClick={onClose} className="w-full py-3 rounded-2xl bg-slate-700 font-bold text-sm">닫기</button>
      </div>
    </div>
  )
}

// ============================================================
// 메인
// ============================================================
export default function Counsel() {
  const { user, ownProfile } = useAuth()
  const navigate = useNavigate()
  // 실제 로그인 계정 기준 — 미리보기 모드로 다른 사람 결과가 섞이지 않게
  const myKey = ownProfile?.member_key
  const isParent = PARENT_KEYS.includes(myKey)
  const iNotifyParents = notifiesParents(myKey) // 자녀 계정인가

  const [tab, setTab] = useState('tests')      // tests | mine | family | alerts
  const [results, setResults] = useState([])
  const [sharedRows, setSharedRows] = useState([])
  const [alerts, setAlerts] = useState([])     // 부모 전용: 자녀 위기
  const [info, setInfo] = useState(null)       // ⓘ 설명 화면에 띄울 test
  const [consent, setConsent] = useState(null) // 고지 화면에 띄울 test
  const [running, setRunning] = useState(null) // test object
  const [viewing, setViewing] = useState(null) // { test, result, row }
  const [crisis, setCrisis] = useState(false)
  const [msg, setMsg] = useState('')
  const [showHotlines, setShowHotlines] = useState(false)

  async function refresh() {
    if (!user?.id) return
    const [mine, shared, al] = await Promise.all([
      listMyResults(user.id).catch(() => []),
      listSharedResults().catch(() => []),
      isParent ? listChildCrisis().catch(() => []) : Promise.resolve([]),
    ])
    setResults(mine)
    setSharedRows(shared)
    setAlerts(al)
  }
  useEffect(() => {
    refresh().catch((e) => setMsg('⚠️ ' + friendlyCounselError(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, myKey])

  const latest = useMemo(() => latestByTest(results), [results])

  // 검사 완료 → 채점 → 위기 우선 → 저장 → 결과
  async function handleDone(test, answers) {
    const scored = scoreTest(test.key, answers)
    setRunning(null)

    // ⚠️ 하23 규칙: 위기문항 양성이면 점수 설명보다 먼저 위기개입
    if (scored.crisis) setCrisis(true)

    try {
      const row = await saveResult({ userId: user.id, memberKey: myKey, testKey: test.key, answers })

      // 위기 신호 → 부모에게 즉시 푸시 (검사 전 아이에게 미리 고지된 동작).
      // 실패해도 흐름을 막지 않는다 — 위기 알림 탭에는 어차피 뜬다.
      if (scored.crisis && iNotifyParents) notifyParentsOfCrisis(row.id)

      await refresh()
      if (!scored.crisis) setViewing({ test, result: scored, row })
      else setViewing({ test, result: scored, row, deferred: true })
    } catch (e) {
      setMsg('⚠️ ' + friendlyCounselError(e))
    }
  }

  async function toggleShare(row) {
    try {
      await setShared(row.id, !row.shared, row.crisis)
      await refresh()
      setViewing((v) => (v ? { ...v, row: { ...v.row, shared: !row.shared } } : v))
      setMsg(!row.shared ? '👨‍👩‍👧‍👦 가족회의에서 볼 수 있게 공유했어요.' : '공유를 해제했어요.')
    } catch (e) {
      setMsg('⚠️ ' + friendlyCounselError(e))
    }
  }

  async function removeRow(id) {
    try {
      await deleteResult(id)
      await refresh()
    } catch (e) {
      setMsg('⚠️ ' + friendlyCounselError(e))
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">🧠 마음 상담</h1>
      </header>

      {/* 상시 안내 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 mb-3">
        <p className="text-[11px] text-slate-400 leading-relaxed">{DISCLAIMER}</p>
      </div>

      {/* 위기 자원은 항상 접근 가능 */}
      <button
        onClick={() => setShowHotlines((s) => !s)}
        className="w-full bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 mb-4 text-left"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-rose-200">🆘 지금 많이 힘들다면 — 상담 전화</span>
          <span className="text-rose-300 text-xs">{showHotlines ? '접기 ▲' : '펼치기 ▼'}</span>
        </div>
        {showHotlines && (
          <div className="mt-3 space-y-2">
            {HOTLINES.map((h) => (
              <a key={h.num} href={`tel:${h.num.replace(/-/g, '')}`} className="flex items-center justify-between bg-slate-900 rounded-xl p-2.5">
                <div>
                  <div className="font-bold text-sm">{h.num} <span className="text-slate-400 font-normal text-xs">{h.name}</span></div>
                  <div className="text-[10px] text-slate-500">{h.desc}</div>
                </div>
                <span className="text-sm">📞</span>
              </a>
            ))}
            <a href={CHAT_HELP.url} target="_blank" rel="noreferrer" className="block bg-slate-900 rounded-xl p-2.5">
              <div className="font-bold text-sm text-sky-300">💬 {CHAT_HELP.name}</div>
              <div className="text-[10px] text-slate-500">{CHAT_HELP.desc}</div>
            </a>
          </div>
        )}
      </button>

      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

      {/* 탭 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { k: 'tests',  t: '검사하기' },
          { k: 'mine',   t: `내 기록${results.length ? ` (${results.length})` : ''}` },
          { k: 'family', t: `가족 나눔${sharedRows.length ? ` (${sharedRows.length})` : ''}` },
          // 부모 전용 — 자녀에게 미리 고지된 위기 알림
          ...(isParent ? [{ k: 'alerts', t: `🚨 위기 알림${alerts.length ? ` (${alerts.length})` : ''}`, urgent: alerts.some((a) => !a.parent_seen_at) }] : []),
        ].map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`py-2 rounded-xl text-sm font-bold border ${
              tab === x.k
                ? 'bg-indigo-600 border-indigo-500'
                : x.urgent
                  ? 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse'
                  : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            {x.t}
          </button>
        ))}
      </div>

      {/* ── 검사하기 ── */}
      {tab === 'tests' && (
        <div className="space-y-5">
          {TEST_GROUPS.map((g) => (
            <div key={g.name}>
              <div className="mb-2">
                <h3 className="text-sm font-bold text-slate-200">{g.name}</h3>
                <p className="text-[11px] text-slate-500">{g.desc}</p>
              </div>
              <div className="space-y-2">
                {g.keys.map((k) => {
                  const t = TESTS[k]
                  const last = latest[t.key]
                  return (
                    <div key={t.key} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{t.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm">{t.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {t.questions.length}문항 · 약 {t.minutes}분
                            {t.kind === 'profile' && <span className="text-violet-300"> · 프로필형</span>}
                            {t.forChildren && <span className="text-emerald-300"> · 청소년용</span>}
                          </div>
                          {last && (
                            <div className="text-[11px] mt-1" style={{ color: t.color }}>
                              최근: {last.level_key === 'profile'
                                ? '프로필 결과'
                                : `${displayScore(t.key, last.score)}/${displayMax(t.key)}점 · ${last.level_label}`}
                              <span className="text-slate-600"> ({last.created_at.slice(5, 10)})</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2.5">
                        <button
                          onClick={() => setInfo(t)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 text-[11px] font-bold text-slate-300"
                        >
                          ⓘ 어떤 검사예요?
                        </button>
                        <button
                          onClick={() => setConsent(t)}
                          className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-[11px] font-bold"
                        >
                          검사하기
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {/* ⚠️ 이 안내는 실제 동작과 일치해야 한다 */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-3 mt-2">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              🔒 검사 결과는 <strong className="text-slate-300">기본적으로 나만 볼 수 있어요.</strong> 가족과 나누고 싶은 결과만
              직접 &ldquo;가족회의에서 나누기&rdquo;를 눌러 공유하면 돼요.
              {iNotifyParents && (
                <>
                  <br /><br />
                  ⚠️ <strong className="text-amber-300">딱 하나 예외</strong> — 스스로를 해치고 싶다는 답을 하면
                  그때는 엄마·아빠 폰으로 바로 알림이 가요. 숨기려는 게 아니라 미리 말해두는 거예요.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── 내 기록 ── */}
      {tab === 'mine' && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">아직 검사 기록이 없어요.</p>
          ) : (
            results.map((r) => {
              const t = TESTS[r.test_key]
              const lvl = t?.levels.find((l) => l.key === r.level_key)
              const tone = TONE_STYLE[lvl?.tone || 'ok']
              return (
                <div key={r.id} className={`${tone.bg} border ${tone.border} rounded-2xl p-3`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{t?.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {r.created_at.slice(0, 10)}
                        {r.level_key !== 'profile' && ` · ${displayScore(r.test_key, r.score)}/${displayMax(r.test_key)}점`}
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${tone.text}`}>{r.level_label}</span>
                    <button onClick={() => removeRow(r.id)} className="text-slate-500 text-sm ml-1">🗑</button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {r.crisis ? (
                      <span className="text-[10px] text-rose-300">🔒 비공개 고정 (위기 신호)</span>
                    ) : (
                      <button
                        onClick={() => toggleShare(r)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${
                          r.shared ? 'bg-violet-600' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {r.shared ? '✓ 가족 공유중' : '가족회의에서 나누기'}
                      </button>
                    )}
                    <button
                      onClick={() => setViewing({
                        test: t,
                        result: { score: r.score, max: r.max_score, level: lvl, crisis: r.crisis, subscores: r.subscores },
                        row: r,
                      })}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300"
                    >
                      결과 보기
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── 가족 나눔 (가족회의용) ── */}
      {tab === 'family' && (
        <div>
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-3 mb-3">
            <p className="text-xs text-violet-200/90 leading-relaxed">
              👨‍👩‍👧‍👦 가족이 <strong>직접 공유하기로 선택한</strong> 결과만 보여요.
              가족회의에서 &ldquo;요즘 어땠어?&rdquo; 하고 이야기를 시작하는 데 써보세요.
              점수로 평가하지 말고, <strong>마음을 물어봐주는 것</strong>이 목적이에요.
            </p>
          </div>
          {sharedRows.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">아직 공유된 결과가 없어요.</p>
          ) : (
            <div className="space-y-2">
              {sharedRows.map((r) => {
                const t = TESTS[r.test_key]
                const lvl = t?.levels.find((l) => l.key === r.level_key)
                const tone = TONE_STYLE[lvl?.tone || 'ok']
                return (
                  <div key={r.id} className={`${tone.bg} border ${tone.border} rounded-2xl p-3`}>
                    <div className="flex items-center gap-2">
                      <Avatar k={r.member_key} size={26} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold">{nameOf(r.member_key)} · {t?.name}</div>
                        <div className="text-[11px] text-slate-400">{r.created_at.slice(0, 10)} · {r.score}/{r.max_score}점</div>
                      </div>
                      <span className={`text-xs font-bold ${tone.text}`}>{r.level_label}</span>
                    </div>
                    {r.note && <p className="text-xs text-slate-300 mt-2 bg-slate-900/50 rounded-lg p-2">💬 {r.note}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {/* 가족회의 대화 가이드 */}
          <div className="bg-slate-800/60 rounded-2xl p-4 mt-4">
            <h3 className="text-sm font-bold mb-2">🗣️ 가족회의 대화 팁</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <li>· &ldquo;점수가 왜 이래?&rdquo; ❌ → &ldquo;요즘 어떤 게 제일 힘들었어?&rdquo; ⭕</li>
              <li>· 조언하려 하기보다 <strong>끝까지 들어주기</strong>부터.</li>
              <li>· &ldquo;그럴 수도 있지&rdquo;로 넘기지 않기 — 감정을 그대로 인정해주기.</li>
              <li>· 0~10점으로 물어보기: &ldquo;지금 기분이 몇 점이야? 1점 올리려면 뭐가 필요해?&rdquo;</li>
              <li>· 힘들다고 하면 <strong>믿음이 부족해서가 아니에요</strong> — 필요하면 전문가와 연결해주세요.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── 부모 전용: 자녀 위기 알림 (자녀에게 미리 고지된 범위) ── */}
      {tab === 'alerts' && isParent && (
        <div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 mb-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              아이들에게 <strong className="text-white">&ldquo;스스로를 해치고 싶다는 답을 하면 엄마·아빠한테 알려줄 거야&rdquo;</strong>라고
              미리 말하고 받은 검사예요. 여기 뜨는 건 그 약속에 해당하는 경우입니다.
              <br /><br />
              <span className="text-slate-400">평상시 점수(우울·불안·자존감·스트레스)는 아이 본인만 봅니다. 여기엔 안 떠요.</span>
            </p>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">😌</div>
              <p className="text-sm text-emerald-200 font-bold mb-1">위기 신호가 없어요</p>
              <p className="text-xs text-slate-400">아이들이 검사에서 자해·죽음에 대한 답을 한 적이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((r) => {
                const t = TESTS[r.test_key]
                const isNew = !r.parent_seen_at
                return (
                  <div key={r.id} className={`rounded-2xl p-4 border-2 ${isNew ? 'bg-rose-500/15 border-rose-500/50' : 'bg-slate-800/60 border-slate-700'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar k={r.member_key} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">
                          {nameOf(r.member_key)}
                          {isNew && <span className="ml-2 text-[10px] bg-rose-600 px-1.5 py-0.5 rounded-full">NEW</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{t?.name} · {r.created_at.slice(0, 16).replace('T', ' ')}</div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-3 mb-3">
                      <p className="text-xs text-rose-200 leading-relaxed">
                        &ldquo;차라리 죽는 것이 낫겠다고 생각하거나 어떤 식으로든 자신을 해칠 것이라고 생각함&rdquo;
                        문항에 <strong>응답이 있었어요.</strong>
                      </p>
                    </div>

                    <div className="bg-slate-900/40 rounded-xl p-3 mb-3">
                      <p className="text-xs font-bold text-slate-200 mb-1.5">🤝 지금 하실 것</p>
                      <ul className="text-xs text-slate-300 space-y-1 leading-relaxed">
                        <li>· <strong>오늘 안에</strong> 아이와 단둘이 이야기해주세요. 조용하고 편한 자리에서요.</li>
                        <li>· &ldquo;검사에서 봤어. 많이 힘들었구나. 얘기해줄 수 있어?&rdquo; — 놀라거나 혼내지 않기.</li>
                        <li>· &ldquo;왜 그런 생각을 해?&rdquo; ❌ → 그냥 <strong>끝까지 들어주기</strong> ⭕</li>
                        <li>· 아이는 이 알림이 갈 걸 <strong>미리 알고 답했어요.</strong> 도움을 요청한 것일 수 있어요.</li>
                        <li>· 전문가 상담을 함께 알아봐주세요. 혼자 판단하지 마세요.</li>
                      </ul>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <a href="tel:109" className="flex-1 py-2.5 rounded-xl bg-rose-600 text-center text-sm font-bold">📞 109 상담</a>
                      <a href="tel:15770199" className="flex-1 py-2.5 rounded-xl bg-slate-700 text-center text-sm font-bold">1577-0199</a>
                      <a href="tel:1388" className="flex-1 py-2.5 rounded-xl bg-slate-700 text-center text-sm font-bold">1388</a>
                    </div>

                    {isNew && (
                      <button
                        onClick={async () => {
                          try { await markParentSeen(r.id); await refresh(); setMsg('확인 표시했어요.') }
                          catch (e) { setMsg('⚠️ ' + friendlyCounselError(e)) }
                        }}
                        className="w-full py-2 rounded-xl bg-slate-700 text-xs font-bold text-slate-300"
                      >
                        ✓ 아이와 이야기했어요
                      </button>
                    )}
                    {!isNew && (
                      <p className="text-[10px] text-slate-500 text-center">
                        ✓ {r.parent_seen_at.slice(0, 10)} 확인함
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 오버레이들 */}
      {info && (
        <InfoPanel
          test={info}
          onStart={() => { setConsent(info); setInfo(null) }}
          onClose={() => setInfo(null)}
        />
      )}
      {consent && (
        <ConsentScreen
          test={consent}
          isChild={iNotifyParents}
          onAgree={() => { setRunning(consent); setConsent(null) }}
          onCancel={() => setConsent(null)}
        />
      )}
      {running && (
        <TestRunner
          test={running}
          onDone={(answers) => handleDone(running, answers)}
          onCancel={() => setRunning(null)}
        />
      )}
      {crisis && <CrisisScreen notifiesParent={iNotifyParents} onClose={() => setCrisis(false)} />}
      {/* 프로필형(빅파이브·SDQ)은 level 이 null 이므로 조건에서 걸러지면 안 된다 */}
      {viewing && !crisis && viewing.test && (viewing.result?.level || viewing.result?.subscores) && (
        <ResultView
          test={viewing.test}
          result={viewing.result}
          isShared={!!viewing.row?.shared}
          onShare={() => toggleShare(viewing.row)}
          onClose={() => setViewing(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
