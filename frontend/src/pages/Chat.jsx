import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { chat } from '../lib/ai'
import { speak, isTTSSupported } from '../lib/tts'
import { listenOnce, isSTTSupported } from '../lib/stt'
import { LEVELS } from '../data/family'

// 관심사별 대화/질문 시작점 (아이들 흥미 기반)
const INTEREST_TOPICS = {
  webtoon: ['What webtoon are you reading these days?', 'Who is your favorite actor and why?', 'Tell me about the drama Weak Hero.', 'Describe your favorite webtoon character.'],
  football: ['Why do you love Barcelona?', 'Who is the greatest football player ever?', 'Talk about the last match you watched.', 'What makes a great striker?'],
  kpop_rap: ['Who is your favorite Korean rapper?', 'What makes a good rap flow?', 'Describe a song you love right now.', 'What is your favorite punchline?'],
  games: ['What game are you playing now?', 'Describe your favorite game character.', 'How do you survive in ARK?', 'Tell me about your best match.'],
}
const INTEREST_BY_MEMBER = { haeum: ['webtoon'], haul: ['football', 'kpop_rap'], haram: ['games'] }

// 레벨별 대화 시작 주제 (무료, 정적)
const TOPICS = {
  A: ['Say hello', 'My family', 'Colors I like'],
  B: ['My day', 'Food I like', 'My weekend'],
  C: ['Travel plans', 'Order at a cafe', 'Ask for directions'],
  D: ['My opinion on movies', 'A recent experience', 'Future plans'],
  E: ['Pros and cons of AI', 'A book I read', 'Environment issues'],
  F: ['Debate: remote work', 'A complex idea', 'Current events'],
}

export default function Chat() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const level = profile?.level || 'C'
  const levelBg = LEVELS[level]?.bg || 'bg-level-c'
  const sttOk = isSTTSupported() // iPhone(iOS)은 false → 마이크 숨기고 타이핑으로

  const [messages, setMessages] = useState([]) // {role:'user'|'assistant', text, correction?, correction_ko?}
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [usage, setUsage] = useState(null) // {usageToday, limit}
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg || busy) return
    setError('')
    setInput('')
    const history = messages.map((m) => ({ role: m.role, text: m.text }))
    setMessages((m) => [...m, { role: 'user', text: msg }])
    setBusy(true)
    try {
      const res = await chat({ level, message: msg, history })
      setUsage({ usageToday: res.usageToday, limit: res.limit })
      // 사용자 메시지에 교정 붙이기
      setMessages((m) => {
        const copy = [...m]
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'user') {
            copy[i] = { ...copy[i], correction: res.correction, correction_ko: res.correction_ko }
            break
          }
        }
        return [...copy, { role: 'assistant', text: res.reply, english: res.english, english_ko: res.english_ko }]
      })
      if (isTTSSupported()) speak(res.reply)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function speakInput() {
    if (!isSTTSupported()) return
    setListening(true)
    try {
      const { transcript } = await listenOnce({ lang: 'en-US' })
      await send(transcript)
    } catch (e) {
      setError(e.message)
    } finally {
      setListening(false)
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center gap-3 p-4 border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">
          ← 대시보드
        </button>
        <h1 className="font-bold flex-1">💬 AI 회화 <span className="text-slate-500 text-sm font-normal">· 레벨 {level}</span></h1>
        {usage && (
          <span className="text-xs text-slate-500" title="오늘 사용량 / 무료 한도">
            {usage.usageToday}/{usage.limit}
          </span>
        )}
      </header>

      {/* 메시지 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-8">
            <p className="mb-1">영어로 말하거나, 한국어로 써도 영어로 알려줘요 🎙</p>
            <p className="text-xs text-slate-600 mb-5">예: "도서관 가고 싶어요" · "apple이 무슨 뜻이야?" · "이거 영어로 어떻게 말해?"</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(TOPICS[level] || TOPICS.C).map((t) => (
                <button
                  key={t}
                  onClick={() => send(`Let's talk about: ${t}`)}
                  className="bg-slate-800 px-3 py-2 rounded-full text-sm"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* 관심사 주제 (좋아하는 분야로 영어 대화) */}
            {(INTEREST_BY_MEMBER[profile?.member_key] || []).flatMap((c) => INTEREST_TOPICS[c] || []).length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-slate-500 mb-2">🎯 내 관심사로 이야기하기</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(INTEREST_BY_MEMBER[profile?.member_key] || [])
                    .flatMap((c) => INTEREST_TOPICS[c] || [])
                    .map((t) => (
                      <button key={t} onClick={() => send(t)} className="bg-indigo-600/20 border border-indigo-500/40 px-3 py-2 rounded-full text-sm text-indigo-100">
                        {t}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className="max-w-[85%]">
              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  m.role === 'user' ? levelBg + ' text-white' : 'bg-slate-800 text-slate-100'
                }`}
              >
                <p>{m.text}</p>
                {m.role === 'assistant' && m.english && (
                  <button
                    onClick={() => speak(m.english)}
                    className="mt-2 block w-full text-left bg-black/25 rounded-lg px-2.5 py-1.5 text-sm"
                    title="이 영어 문장 듣기"
                  >
                    🔊 영어로: <span className="font-medium">{m.english}</span>
                    {m.english_ko && <span className="text-white/70"> ({m.english_ko})</span>}
                  </button>
                )}
                {m.role === 'assistant' && (
                  <button
                    onClick={() => speak(m.english || m.text)}
                    className="text-white/60 text-xs mt-1 hover:text-white"
                  >
                    🔊 다시 듣기
                  </button>
                )}
              </div>
              {/* 교정 */}
              {m.role === 'user' && m.correction && (
                <div className="mt-1 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-sm">
                  <span className="text-amber-300">✏️ {m.correction}</span>
                  {m.correction_ko && <p className="text-slate-400 text-xs mt-0.5">{m.correction_ko}</p>}
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && <div className="text-slate-500 text-sm">AI가 생각 중…</div>}
        {error && <div className="text-amber-300 text-sm bg-amber-500/10 rounded-xl p-3">⚠️ {error}</div>}
        <div ref={endRef} />
      </div>

      {/* 입력 */}
      <div className="p-3 border-t border-slate-800 flex gap-2 sticky bottom-0 bg-slate-900">
        {sttOk && (
          <button
            onClick={speakInput}
            disabled={listening || busy}
            className={`w-12 h-12 rounded-full shrink-0 disabled:opacity-40 ${
              listening ? 'bg-rose-600 relative ripple text-rose-600' : 'bg-slate-700'
            }`}
            aria-label="말하기"
          >
            <span className="relative z-10 text-white">🎤</span>
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={sttOk ? '영어·한국어로 말하거나 질문하기 🎤' : '영어·한국어로 입력하거나 질문하기'}
          className="flex-1 px-4 rounded-full bg-slate-800 border border-slate-700 focus:border-indigo-500 outline-none"
        />
        <button
          onClick={() => send()}
          disabled={busy || !input.trim()}
          className={`${levelBg} px-5 rounded-full font-bold disabled:opacity-40`}
        >
          전송
        </button>
      </div>
    </div>
  )
}
