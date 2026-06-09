import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { chat } from '../lib/ai'
import { speak, isTTSSupported } from '../lib/tts'
import { listenOnce, isSTTSupported } from '../lib/stt'
import { LEVELS } from '../data/family'

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
        return [...copy, { role: 'assistant', text: res.reply }]
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
            <p className="mb-1">영어로 자유롭게 말해보세요 🎙</p>
            <p className="text-xs text-slate-600 mb-5">무료 Gemini Flash · 응답 캐싱·일일 한도로 비용 관리</p>
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
                {m.role === 'assistant' && (
                  <button
                    onClick={() => speak(m.text)}
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
        <button
          onClick={speakInput}
          disabled={listening || busy || !isSTTSupported()}
          className={`w-12 h-12 rounded-full shrink-0 disabled:opacity-40 ${
            listening ? 'bg-rose-600 relative ripple text-rose-600' : 'bg-slate-700'
          }`}
          aria-label="말하기"
        >
          <span className="relative z-10 text-white">🎤</span>
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="영어로 입력하거나 🎤 눌러 말하기"
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
