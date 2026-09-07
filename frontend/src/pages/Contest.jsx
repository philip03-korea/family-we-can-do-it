import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CONTESTS, TOPICS, problemsOf, checkAnswer, TOTAL_PROBLEMS } from '../data/mathcontest'
import { getAttempts, recordAttempt, resetAttempts, summarize } from '../lib/localProgress'
import BottomNav from '../components/BottomNav'

const LEVEL_LABEL = { 1: '기본', 2: '중급', 3: '심화' }
const LEVEL_TONE = { 1: 'text-emerald-400', 2: 'text-amber-400', 3: 'text-rose-400' }

// 수학 경시 — 대회 정보 + 분야별 연습 문제.
// 답을 직접 써넣고, 막히면 힌트 → 풀이 순서로 열어 본다.
export default function Contest() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const who = profile?.member_key || 'me'

  const [tab, setTab] = useState('solve') // solve | info
  const [topic, setTopic] = useState('number')
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null) // null | true | false
  const [showHint, setShowHint] = useState(false)
  const [showSol, setShowSol] = useState(false)
  const [attempts, setAttempts] = useState({})

  useEffect(() => {
    setAttempts(getAttempts('contest', who))
  }, [who])

  const problems = useMemo(() => problemsOf(topic), [topic])
  const p = problems[idx]
  const sum = summarize(attempts, problems)

  function reset() {
    setInput('')
    setResult(null)
    setShowHint(false)
    setShowSol(false)
  }

  function submit(e) {
    e?.preventDefault()
    if (!input.trim() || result != null) return
    const ok = checkAnswer(input, p.answer)
    setResult(ok)
    setAttempts(recordAttempt('contest', who, p.id, ok))
    if (!ok) setShowHint(true)
  }

  function move(delta) {
    const next = Math.min(Math.max(idx + delta, 0), problems.length - 1)
    setIdx(next)
    reset()
  }

  function pickTopic(key) {
    setTopic(key)
    setIdx(0)
    reset()
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/g/learn')} className="text-slate-400 text-sm">← 배움</button>
        <h1 className="text-xl font-bold">🏆 수학 경시</h1>
      </header>
      <p className="text-slate-400 text-sm mb-4">문제 {TOTAL_PROBLEMS}개 · 힌트를 먼저 보고 풀이는 마지막에</p>

      <div className="grid grid-cols-2 gap-1.5 mb-5">
        {[['solve', '✏️ 문제 풀기'], ['info', '📋 대회 정보']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`py-2.5 rounded-xl text-sm font-bold ${tab === k ? 'bg-level-b text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <>
          <p className="text-[12px] leading-relaxed text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-3.5 py-2.5 mb-4">
            ⚠️ 일정·요강은 해마다 바뀌어요. 참가 전에 주최 측 공고를 꼭 확인하세요.
          </p>
          <div className="space-y-2.5">
            {CONTESTS.map((c) => (
              <div key={c.key} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="font-bold">{c.name}</h3>
                  <span className="ml-auto text-[11px] text-slate-500">{c.level}</span>
                </div>
                <p className="text-xs text-indigo-300 mb-1">{c.host} · {c.format}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{c.note}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* 분야 탭 */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {TOPICS.map((t) => (
              <button
                key={t.key}
                onClick={() => pickTopic(t.key)}
                className={`py-2 rounded-xl text-xs font-bold ${topic === t.key ? 'bg-level-b text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                <span className="block text-base leading-none mb-0.5">{t.emoji}</span>
                {t.name}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">{TOPICS.find((t) => t.key === topic)?.desc}</p>
            <p className="text-xs text-slate-400">
              {sum.done}/{sum.total} 풀이
              {sum.rate != null && <span className="text-emerald-400"> · {sum.rate}%</span>}
            </p>
          </div>

          {p && (
            <>
              <div className="bg-level-b rounded-3xl p-6 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/70 text-xs">문제 {idx + 1} / {problems.length}</span>
                  <span className={`ml-auto text-xs font-bold bg-black/25 px-2 py-0.5 rounded-full text-white`}>
                    {LEVEL_LABEL[p.level]}
                  </span>
                </div>
                <p className="text-lg font-bold text-white whitespace-pre-wrap leading-relaxed">{p.q}</p>
              </div>

              <form onSubmit={submit} className="flex gap-2 mb-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={result != null}
                  placeholder="답을 입력하세요"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-base outline-none focus:border-indigo-500 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={result != null || !input.trim()}
                  className="px-5 py-3.5 rounded-2xl bg-level-b font-bold disabled:opacity-40"
                >
                  확인
                </button>
              </form>

              {result === true && (
                <p className="text-center font-bold text-emerald-400 mb-3">정답이에요! 🎉</p>
              )}
              {result === false && (
                <p className="text-center font-bold text-rose-400 mb-3">
                  아쉬워요. 정답은 <span className="text-white">{p.answer}</span> 예요
                </p>
              )}

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setShowHint((s) => !s)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-medium"
                >
                  {showHint ? '힌트 숨기기' : '💡 힌트'}
                </button>
                <button
                  onClick={() => setShowSol((s) => !s)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-medium"
                >
                  {showSol ? '풀이 숨기기' : '🧩 풀이'}
                </button>
              </div>

              {showHint && (
                <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 mb-3">
                  <p className="text-xs font-bold text-amber-300 mb-1">힌트</p>
                  <p className="text-sm text-amber-100 leading-relaxed whitespace-pre-wrap">{p.hint}</p>
                </div>
              )}
              {showSol && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
                  <p className="text-xs font-bold text-indigo-300 mb-1">풀이</p>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{p.solution}</p>
                  <p className="text-sm text-emerald-400 font-bold mt-2">정답: {p.answer}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => move(-1)}
                  disabled={idx === 0}
                  className="px-5 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  onClick={() => move(1)}
                  disabled={idx >= problems.length - 1}
                  className="flex-1 py-3.5 rounded-2xl bg-level-b font-bold disabled:opacity-30"
                >
                  {idx >= problems.length - 1 ? '이 분야 끝!' : '다음 문제 →'}
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm('풀이 기록을 모두 지울까요?')) setAttempts(resetAttempts('contest', who))
                }}
                className="w-full mt-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm"
              >
                풀이 기록 초기화
              </button>
            </>
          )}
        </>
      )}

      <BottomNav />
    </div>
  )
}
