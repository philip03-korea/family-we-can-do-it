import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BANKS, SUBJECT_MAP, questionsOf } from '../data/exambank'
import { getAttempts, recordAttempt, resetAttempts, summarize } from '../lib/localProgress'
import { speak, stopSpeaking, isTTSSupported } from '../lib/tts'
import BottomNav from '../components/BottomNav'

// 문제은행 — TOEFL · 검정고시를 과목별로 언제든 열어 풀 수 있게.
// 진행 기록은 브라우저(localStorage)에만 남긴다. lib/localProgress.js 참고.
export default function Exams() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const who = profile?.member_key || 'me'

  const [subject, setSubject] = useState(null) // null이면 과목 목록
  const [attempts, setAttempts] = useState({})
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    setAttempts(getAttempts('exam', who))
  }, [who])

  useEffect(() => () => stopSpeaking(), [])

  const questions = useMemo(() => (subject ? questionsOf(subject) : []), [subject])
  const q = questions[idx]

  function openSubject(key) {
    setSubject(key)
    setIdx(0)
    setPicked(null)
    setShowAnswer(false)
  }

  function choose(i) {
    if (picked != null) return
    setPicked(i)
    setAttempts(recordAttempt('exam', who, q.id, i === q.answer))
  }

  function move(delta) {
    stopSpeaking()
    const next = Math.min(Math.max(idx + delta, 0), questions.length - 1)
    setIdx(next)
    setPicked(null)
    setShowAnswer(false)
  }

  // ── 과목 목록
  if (!subject) {
    return (
      <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
        <header className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/g/learn')} className="text-slate-400 text-sm">← 배움</button>
          <h1 className="text-xl font-bold">🗂️ 문제은행</h1>
        </header>
        <p className="text-slate-400 text-sm mb-5">과목을 골라 언제든 풀 수 있어요</p>

        {BANKS.map((bank) => (
          <div key={bank.key} className="mb-6">
            <div className={`${bank.bg} rounded-3xl p-5 mb-3`}>
              <h2 className="text-white font-black text-lg">
                {bank.emoji} {bank.name}
              </h2>
              <p className="text-white/85 text-xs mt-1.5 leading-relaxed">{bank.note}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {bank.subjects.map((s) => {
                const list = questionsOf(s.key)
                const sum = summarize(attempts, list)
                return (
                  <button
                    key={s.key}
                    onClick={() => openSubject(s.key)}
                    className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.emoji}</span>
                      <span className="font-bold text-sm">{s.name}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${sum.total ? (sum.done / sum.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {sum.done}/{sum.total} 풀이
                      {sum.rate != null && <span className="text-emerald-400"> · 정답률 {sum.rate}%</span>}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            if (confirm('풀이 기록을 모두 지울까요?')) setAttempts(resetAttempts('exam', who))
          }}
          className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-sm"
        >
          풀이 기록 초기화
        </button>

        <BottomNav />
      </div>
    )
  }

  // ── 문제 풀이
  const meta = SUBJECT_MAP[subject]
  const sum = summarize(attempts, questions)
  const prev = attempts[q?.id]

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-3">
        <button onClick={() => { stopSpeaking(); setSubject(null) }} className="text-slate-400 text-sm">← 과목</button>
        <h1 className="text-lg font-bold">
          {meta?.emoji} {meta?.name}
        </h1>
        <span className="ml-auto text-xs text-slate-400">
          {idx + 1} / {questions.length}
          {sum.rate != null && ` · ${sum.rate}%`}
        </span>
      </header>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-level-e transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      {q?.task && (
        <p className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1 inline-block mb-2">
          {q.task} · {q.prep}
        </p>
      )}

      {/* 지문 / 듣기 스크립트 */}
      {q?.passage && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
          {q.audio && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => speak(q.passage, { lang: 'en-US', rate: 0.95 })}
                disabled={!isTTSSupported()}
                className="flex-1 py-2.5 rounded-xl bg-level-e font-bold text-sm disabled:opacity-40"
              >
                🎧 들려주기
              </button>
              <button onClick={stopSpeaking} className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm">
                정지
              </button>
            </div>
          )}
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{q.passage}</p>
          {q.audio && <p className="text-[11px] text-slate-500 mt-2">실제 시험에서는 스크립트를 볼 수 없어요. 먼저 듣기만 하고 풀어보세요.</p>}
        </div>
      )}

      {/* 문제 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-3">
        <p className="text-base font-bold whitespace-pre-wrap leading-relaxed">{q?.q}</p>
      </div>

      {/* 객관식 */}
      {q?.type === 'mcq' && (
        <>
          <div className="space-y-2 mb-3">
            {q.choices.map((c, i) => {
              let cls = 'bg-slate-800 border-slate-700'
              if (picked != null) {
                if (i === q.answer) cls = 'bg-emerald-600/30 border-emerald-500'
                else if (i === picked) cls = 'bg-rose-600/30 border-rose-500'
                else cls = 'bg-slate-800 border-slate-700 opacity-60'
              }
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={picked != null}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${cls} flex items-start gap-3`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {'①②③④⑤'[i]}
                  </span>
                  <span className="font-medium text-sm leading-relaxed">{c}</span>
                </button>
              )
            })}
          </div>

          {picked != null && (
            <>
              <p className={`text-center font-bold mb-2 ${picked === q.answer ? 'text-emerald-400' : 'text-rose-400'}`}>
                {picked === q.answer ? '정답이에요! 🎉' : '아쉬워요. 해설을 확인해봐요 💪'}
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
                <p className="text-xs font-bold text-indigo-300 mb-1.5">해설</p>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{q.explain}</p>
              </div>
            </>
          )}

          {picked == null && prev && (
            <p className="text-center text-xs text-slate-500 mb-3">
              지난번엔 {prev.correct ? '맞혔어요 ✅' : '틀렸어요 ❌'} — 다시 풀어보세요
            </p>
          )}
        </>
      )}

      {/* 과제형 (Speaking · Writing) */}
      {q?.type === 'prompt' && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
            <p className="text-xs font-bold text-indigo-300 mb-2">답변 뼈대</p>
            {q.structure.map((s, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed mb-1">{s}</p>
            ))}
          </div>
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full py-3 rounded-2xl bg-slate-800 border border-slate-700 font-medium mb-3"
            >
              💡 이럴 때 조심할 것 보기
            </button>
          ) : (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 mb-3">
              {q.tips.map((t, i) => (
                <p key={i} className="text-sm text-amber-100 leading-relaxed mb-1">· {t}</p>
              ))}
            </div>
          )}
          <p className="text-center text-xs text-slate-500 mb-3">
            실제 답변 녹음·채점은 「🎓 TOEFL」에서 AI 채점으로 할 수 있어요
          </p>
        </>
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
          disabled={idx >= questions.length - 1}
          className="flex-1 py-3.5 rounded-2xl bg-level-e font-bold disabled:opacity-30"
        >
          {idx >= questions.length - 1 ? '마지막 문제예요' : '다음 문제 →'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
