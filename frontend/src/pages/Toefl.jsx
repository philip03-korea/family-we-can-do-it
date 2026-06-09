import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getToeflPrompts, scoreToefl, saveToeflAttempt, getToeflHistory } from '../lib/toefl'
import { listenOnce, isSTTSupported } from '../lib/stt'
import { speak, isTTSSupported } from '../lib/tts'

const SECTIONS = [
  { key: 'speaking', label: '🗣 Speaking' },
  { key: 'writing', label: '✍️ Writing' },
  { key: 'reading', label: '📖 Reading' },
]

export default function Toefl() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState('speaking')
  const [history, setHistory] = useState([])

  useEffect(() => {
    getToeflHistory(user.id).then(setHistory).catch(() => {})
  }, [user.id])

  // 하울(TOEFL 트랙) 전용
  if (profile && !profile.toefl_track) {
    return (
      <Wrap onBack={() => navigate('/')}>
        <div className="text-center text-slate-400 mt-16">
          <div className="text-5xl mb-3">🎓</div>
          <p className="font-bold text-lg text-slate-200">TOEFL 트랙 전용</p>
          <p className="text-sm mt-1">이 메뉴는 하울(TOEFL 준비)만 사용해요.</p>
        </div>
      </Wrap>
    )
  }

  function refreshHistory() {
    getToeflHistory(user.id).then(setHistory).catch(() => {})
  }

  return (
    <Wrap onBack={() => navigate('/')}>
      <div className="flex gap-2 mb-5">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${
              section === s.key ? 'bg-level-e text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'reading' ? (
        <ReadingSection userId={user.id} onSaved={refreshHistory} />
      ) : (
        <ProductionSection section={section} userId={user.id} onSaved={refreshHistory} />
      )}

      {/* 기록 */}
      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold mb-2">최근 기록</h3>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-slate-300 capitalize">{h.section}</span>
                <span className="font-bold text-level-e text-emerald-400">
                  {h.score}/{h.max_score || 30}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Wrap>
  )
}

// Speaking / Writing 공통 (AI 채점)
function ProductionSection({ section, userId, onSaved }) {
  const [prompts, setPrompts] = useState([])
  const [sel, setSel] = useState(null)
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setResult(null)
    setText('')
    getToeflPrompts(section).then((p) => {
      setPrompts(p)
      setSel(p[0] || null)
    })
  }, [section])

  async function record() {
    setListening(true)
    setError('')
    try {
      const { transcript } = await listenOnce({ lang: 'en-US' })
      setText((t) => (t ? t + ' ' : '') + transcript)
    } catch (e) {
      setError(e.message)
    } finally {
      setListening(false)
    }
  }

  async function grade() {
    if (!text.trim() || !sel) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const res = await scoreToefl({ section, prompt: sel.prompt, response: text })
      setResult(res)
      await saveToeflAttempt({
        userId,
        section,
        promptId: sel.id,
        promptText: sel.prompt,
        response: text,
        score: res.score,
        feedback: {
          score_reason: res.score_reason,
          strengths: res.strengths,
          improvements: res.improvements,
          corrected_sample: res.corrected_sample,
        },
      }).catch(() => {})
      onSaved?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* 문제 선택 */}
      {prompts.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {prompts.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSel(p)
                setResult(null)
                setText('')
              }}
              className={`px-3 py-1.5 rounded-full text-xs shrink-0 ${
                sel?.id === p.id ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {sel && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-slate-200">{sel.prompt}</p>
            <button onClick={() => speak(sel.prompt)} disabled={!isTTSSupported()} className="text-slate-400 shrink-0">
              🔊
            </button>
          </div>
        </div>
      )}

      {/* 응답 입력 */}
      {section === 'speaking' && isSTTSupported() && (
        <button
          onClick={record}
          disabled={listening}
          className={`w-full py-3 rounded-xl font-medium mb-2 ${
            listening ? 'bg-rose-600 relative ripple text-rose-600' : 'bg-slate-700'
          }`}
        >
          <span className="relative z-10 text-white">
            {listening ? '🎙 녹음 중…' : '🎤 말하기 (음성→텍스트)'}
          </span>
        </button>
      )}
      {section === 'speaking' && !isSTTSupported() && (
        <p className="text-slate-400 text-xs mb-2">
          ℹ️ 이 기기(아이폰 등)는 음성인식을 지원하지 않아요. 답변을 아래에 <b>직접 입력</b>하면 동일하게 AI 채점을 받을 수 있어요.
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={section === 'writing' ? 8 : 4}
        placeholder={
          section === 'speaking'
            ? isSTTSupported()
              ? '말한 내용이 여기에 표시됩니다 (수정 가능)'
              : '답변을 영어로 입력하세요'
            : '여기에 에세이를 작성하세요'
        }
        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm"
      />
      <div className="text-right text-xs text-slate-500 mt-1">{text.trim().split(/\s+/).filter(Boolean).length} 단어</div>

      <button
        onClick={grade}
        disabled={busy || !text.trim()}
        className="w-full mt-2 py-3 rounded-xl bg-level-e font-bold disabled:opacity-40"
      >
        {busy ? 'AI 채점 중…' : '🤖 AI 채점 받기'}
      </button>

      {error && <p className="text-amber-300 text-sm mt-3">⚠️ {error}</p>}

      {result && (
        <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black text-emerald-400">{result.score}</span>
            <span className="text-slate-400">/ 30</span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{result.score_reason}</p>
          {result.strengths?.length > 0 && (
            <Block title="👍 잘한 점" items={result.strengths} cls="text-emerald-300" />
          )}
          {result.improvements?.length > 0 && (
            <Block title="🔧 개선할 점" items={result.improvements} cls="text-amber-300" />
          )}
          {result.corrected_sample && (
            <div className="mt-3 bg-slate-900 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">개선 예시</p>
              <p className="text-sm text-slate-200">{result.corrected_sample}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Block({ title, items, cls }) {
  return (
    <div className="mb-2">
      <p className="text-xs text-slate-400 mb-1">{title}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className={`text-sm ${cls}`}>
            • {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Reading (로컬 채점, AI 불필요 = 0원)
function ReadingSection({ userId, onSaved }) {
  const [prompt, setPrompt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getToeflPrompts('reading').then((p) => {
      setPrompt(p[0] || null)
      setAnswers({})
      setSubmitted(false)
    })
  }, [])

  if (!prompt) return <p className="text-slate-500 text-sm">읽기 문제가 없어요. (step6.sql 실행 확인)</p>
  const questions = prompt.questions || []
  const correct = questions.filter((q, i) => answers[i] === q.answer).length

  async function submit() {
    setSubmitted(true)
    const score = questions.length ? Math.round((correct / questions.length) * 30) : 0
    await saveToeflAttempt({
      userId,
      section: 'reading',
      promptId: prompt.id,
      promptText: prompt.title,
      response: JSON.stringify(answers),
      score,
      feedback: { correct, total: questions.length },
    }).catch(() => {})
    onSaved?.()
  }

  return (
    <div>
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">{prompt.title}</h3>
          <button onClick={() => speak(prompt.passage)} disabled={!isTTSSupported()} className="text-slate-400">🔊</button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{prompt.passage}</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="font-medium mb-2 text-sm">{i + 1}. {q.q}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const chosen = answers[i] === oi
                const isAnswer = q.answer === oi
                let cls = 'bg-slate-800 border-slate-700'
                if (submitted) {
                  if (isAnswer) cls = 'bg-emerald-600/30 border-emerald-500'
                  else if (chosen) cls = 'bg-rose-600/30 border-rose-500'
                } else if (chosen) cls = 'bg-slate-600 border-slate-400'
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${cls}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full mt-4 py-3 rounded-xl bg-level-e font-bold disabled:opacity-40"
        >
          채점하기
        </button>
      ) : (
        <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-400">
            {correct}/{questions.length} 정답
          </p>
          <p className="text-slate-400 text-sm mt-1">환산 점수 약 {Math.round((correct / questions.length) * 30)}/30</p>
        </div>
      )}
    </div>
  )
}

function Wrap({ children, onBack }) {
  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-24">
      <header className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">🎓 TOEFL 트랙</h1>
      </header>
      {children}
    </div>
  )
}
