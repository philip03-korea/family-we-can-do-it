import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getWeeklyTopic,
  getFamilyOverview,
  getRecentFamilyMessages,
  sendFamilyMessage,
  sendAiFamilyMessage,
  subscribeFamilyMessages,
} from '../lib/db'
import { speak, isTTSSupported } from '../lib/tts'
import { listenOnce, isSTTSupported } from '../lib/stt'
import { scoreFeedback } from '../lib/feedback'
import { chat, fami } from '../lib/ai'
import { FAMILY, LEVELS } from '../data/family'

const emojiOf = (key) => (key === 'ai' ? '🤖' : FAMILY.find((f) => f.key === key)?.emoji || '🙂')

// @멘션을 강조 표시
function renderText(text) {
  return String(text || '')
    .split(/(@[\w가-힣]+)/g)
    .map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="text-indigo-300 font-semibold">
          {part}
        </span>
      ) : (
        part
      ),
    )
}

export default function Family() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [topic, setTopic] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [correction, setCorrection] = useState(null) // {fixed, ko, changed}
  const [practice, setPractice] = useState(null) // {score, transcript}
  const [aiError, setAiError] = useState('')
  const [micLang, setMicLang] = useState('ko-KR') // 한국어로 말하면 한글로 입력 → ✨AI로 영어 변환
  const [famiBusy, setFamiBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const endRef = useRef(null)
  const famiAutoRef = useRef(false)
  const sttOk = isSTTSupported()
  const level = profile?.level || 'C'

  // 🤖 패미(AI 가족) — 주제·최근 대화를 보고 대화를 이끔
  async function summonFami() {
    if (famiBusy) return
    setFamiBusy(true)
    setAiError('')
    try {
      const recent = messages.slice(-8).map((m) => ({ name: m.display_name || '가족', text: m.text }))
      const names = members.map((mm) => mm.display_name).filter(Boolean)
      const topicText = topic ? `${topic.title} — ${topic.prompt_en || ''}` : ''
      const text = await fami({ topic: topicText, recent, members: names })
      if (text) await sendAiFamilyMessage({ text })
    } catch (e) {
      setAiError(e.message)
    } finally {
      setFamiBusy(false)
    }
  }

  useEffect(() => {
    getWeeklyTopic().then(setTopic).catch(() => {})
    getFamilyOverview().then(setMembers).catch(() => {})
    getRecentFamilyMessages()
      .then((m) => setMessages(m))
      .catch(() => {})
      .finally(() => setLoaded(true))

    const channel = subscribeFamilyMessages((msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 채팅이 비어 있으면 패미가 먼저 대화를 시작 (1회)
  useEffect(() => {
    if (loaded && messages.length === 0 && !famiAutoRef.current) {
      famiAutoRef.current = true
      summonFami()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, messages.length])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(textArg) {
    const text = (textArg ?? input).trim()
    if (!text) return
    setInput('')
    setCorrection(null)
    setPractice(null)
    setAiError('')
    try {
      await sendFamilyMessage({
        userId: user.id,
        displayName: profile?.display_name || '가족',
        memberKey: profile?.member_key,
        text,
      })
      // 본인 메시지는 실시간 이벤트로 다시 들어오므로 별도 추가 안 함
    } catch (e) {
      setInput(text)
    }
  }

  // 🎤 말로 입력 (선택 언어로 인식 → 텍스트). 한국어면 한글로 입력되고 ✨AI로 영어 변환.
  async function speakInput() {
    if (!sttOk) return
    setListening(true)
    setAiError('')
    try {
      const { transcript } = await listenOnce({ lang: micLang })
      setInput(transcript)
    } catch (e) {
      setAiError(e.message)
    } finally {
      setListening(false)
    }
  }

  // ✨ AI 도움 — 한국어→영어 번역 / 질문 답변 / 영어 문장 교정
  async function getCorrection() {
    const text = input.trim()
    if (!text || busy) return
    setBusy(true)
    setAiError('')
    setPractice(null)
    try {
      const res = await chat({ level, message: text })
      const fixed = (res.correction || '').trim()
      const english = (res.english || '').trim()
      // 연습/전송할 영어: 교정된 영어 > 번역/모범 영어 > 원문
      const target = fixed || english || text
      const changed =
        (!!fixed && fixed.toLowerCase() !== text.toLowerCase()) ||
        (!!english && english.toLowerCase() !== text.toLowerCase())
      setCorrection({
        fixed: target,
        ek: (res.english_ko || '').trim(),
        ko: res.correction_ko || (changed ? '어순·문법을 자연스럽게 다듬었어요.' : '👍 자연스러운 문장이에요!'),
        changed,
        reply: (res.reply || '').trim(),
      })
    } catch (e) {
      setAiError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // 🎤 교정문 다시 따라 읽기 (발음 점수)
  async function practiceRead(target) {
    if (!sttOk) return
    setListening(true)
    try {
      const { transcript } = await listenOnce({ lang: 'en-US' })
      const t = target.toLowerCase().replace(/[.,!?;:"']/g, '').split(/\s+/).filter(Boolean)
      const s = new Set(transcript.toLowerCase().replace(/[.,!?;:"']/g, '').split(/\s+/).filter(Boolean))
      const score = t.length ? Math.round((t.filter((w) => s.has(w)).length / t.length) * 100) : 0
      setPractice({ score, transcript, fb: scoreFeedback(score) })
    } catch (e) {
      setAiError(e.message)
    } finally {
      setListening(false)
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-4 flex flex-col">
      <header className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">
          ← 대시보드
        </button>
        <h1 className="text-xl font-bold">👨‍👩‍👧‍👦 우리 가족</h1>
      </header>

      {/* 이번 주 토론 주제 */}
      {topic && (
        <div className="bg-level-d rounded-3xl p-5 mb-5 shadow-lg">
          <p className="text-white/80 text-xs">이번 주 공통 토론 주제</p>
          <h2 className="text-2xl font-black text-white mt-1">{topic.title}</h2>
          {topic.prompt_en && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-white/90">{topic.prompt_en}</p>
              <button
                onClick={() => speak(topic.prompt_en)}
                disabled={!isTTSSupported()}
                className="text-white/80 bg-black/20 px-2 py-1 rounded-full text-xs shrink-0"
              >
                🔊
              </button>
            </div>
          )}
          {topic.prompt_ko && <p className="text-white/70 text-sm mt-1">{topic.prompt_ko}</p>}
          {Array.isArray(topic.questions) && topic.questions.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {topic.questions.map((q, i) => (
                <li key={i} className="bg-black/15 rounded-lg px-3 py-2 text-white text-sm flex items-center justify-between gap-2">
                  <span>{q}</span>
                  <button onClick={() => speak(q)} className="text-white/70 text-xs shrink-0">🔊</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 가족 현황 */}
      <h2 className="text-lg font-bold mb-3">가족 현황</h2>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {members.map((m) => (
          <div key={m.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emojiOf(m.member_key)}</span>
              <div className="min-w-0">
                <div className="font-bold truncate">{m.display_name}</div>
                <div className="text-xs text-slate-400">
                  레벨 {m.level}
                  {m.toefl_track ? ' · TOEFL' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-orange-400">🔥 {m.streak}일</span>
              <span className="text-slate-400">오늘 {m.todayReviews}개</span>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-slate-500 text-sm col-span-2">아직 가족 구성원이 없어요.</p>
        )}
      </div>

      {/* 가족 채팅 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">가족 채팅 <span className="text-xs text-slate-500 font-normal">· 실시간</span></h2>
        <button
          onClick={summonFami}
          disabled={famiBusy}
          className="text-xs bg-indigo-600/30 border border-indigo-500/40 text-indigo-100 px-3 py-1.5 rounded-full disabled:opacity-50"
          title="패미가 대화를 이어줘요"
        >
          {famiBusy ? '🤖 …' : '🤖 패미야 이어줘'}
        </button>
      </div>
      <div className="flex-1 min-h-[240px] bg-slate-800/40 rounded-2xl border border-slate-700 p-3 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">첫 메시지를 남겨보세요 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === user.id && !m.is_ai
          return (
            <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <div className="max-w-[85%]">
                {!mine && (
                  <span className={`text-xs ml-1 ${m.is_ai ? 'text-indigo-300 font-medium' : 'text-slate-400'}`}>
                    {emojiOf(m.member_key)} {m.display_name}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    mine
                      ? 'bg-level-c text-white'
                      : m.is_ai
                      ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-50'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  {renderText(m.text)}
                  {m.is_ai && (
                    <button onClick={() => speak(m.text)} disabled={!isTTSSupported()} className="block mt-1 text-indigo-200/70 text-xs">
                      🔊 듣기
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* AI 교정 결과 */}
      {correction && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
          <div className="flex items-start justify-between gap-2">
            {correction.reply && <p className="text-slate-200 text-sm mb-1 flex-1">💬 {correction.reply}</p>}
            <button onClick={() => { setCorrection(null); setPractice(null) }} className="shrink-0 text-slate-400 text-lg leading-none px-1" aria-label="닫기">
              ✖
            </button>
          </div>
          <p className="text-amber-200 text-sm">
            {correction.changed ? '✨ 영어로' : '👍 좋아요'}: <span className="font-medium">{correction.fixed}</span>
            {correction.ek && <span className="text-amber-100/80"> ({correction.ek})</span>}
          </p>
          {correction.ko && <p className="text-slate-400 text-xs mt-1">{correction.ko}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => speak(correction.fixed)} disabled={!isTTSSupported()} className="text-xs bg-slate-700 px-3 py-1.5 rounded-full disabled:opacity-40">
              🔊 듣기
            </button>
            {sttOk && (
              <button onClick={() => practiceRead(correction.fixed)} disabled={listening} className={`text-xs px-3 py-1.5 rounded-full ${listening ? 'bg-rose-600' : 'bg-slate-700'}`}>
                {listening ? '🎙 듣는 중…' : '🎤 따라 읽기'}
              </button>
            )}
            {correction.changed && (
              <button onClick={() => setInput(correction.fixed)} className="text-xs bg-amber-500/30 text-amber-100 px-3 py-1.5 rounded-full">
                ⤵️ 이 문장으로 바꾸기
              </button>
            )}
            <button onClick={() => handleSend(correction.fixed)} className="text-xs bg-level-c px-3 py-1.5 rounded-full font-bold">
              교정문 전송
            </button>
          </div>
          {practice && (
            <p className="text-xs mt-2 text-slate-300">
              발음 <span className={practice.fb.good ? 'text-emerald-400' : 'text-amber-400'}>{practice.score}/100점</span> · {practice.fb.msg}
              <br />
              <span className="text-slate-500">인식: "{practice.transcript}"</span>
            </p>
          )}
        </div>
      )}
      {aiError && <p className="text-amber-300 text-xs mt-2">⚠️ {aiError}</p>}

      {sttOk && (
        <div className="flex items-center gap-1.5 mt-3 text-xs">
          <span className="text-slate-500">🎤 말하기 언어:</span>
          <button
            onClick={() => setMicLang('ko-KR')}
            className={`px-2.5 py-1 rounded-full ${micLang === 'ko-KR' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            한국어
          </button>
          <button
            onClick={() => setMicLang('en-US')}
            className={`px-2.5 py-1 rounded-full ${micLang === 'en-US' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            English
          </button>
          {micLang === 'ko-KR' && <span className="text-slate-500">→ ✨AI로 영어 변환</span>}
        </div>
      )}

      <div className="flex gap-2 mt-2 items-center">
        {sttOk && (
          <button
            onClick={speakInput}
            disabled={listening || busy}
            className={`w-11 h-11 shrink-0 rounded-full disabled:opacity-40 ${listening ? 'bg-rose-600' : 'bg-slate-700'}`}
            aria-label="말로 입력"
          >
            🎤
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={sttOk ? '메시지 (🎤 말하기 가능)' : '메시지 (영어로 연습해도 좋아요)'}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-slate-800 border border-slate-700 focus:border-indigo-500 outline-none text-sm"
        />
        <button onClick={getCorrection} disabled={!input.trim() || busy} className="shrink-0 bg-slate-700 px-3 rounded-full text-sm disabled:opacity-40" title="AI 번역·교정·질문">
          {busy ? '…' : '✨AI'}
        </button>
        <button onClick={() => handleSend()} disabled={!input.trim()} className="shrink-0 bg-level-c px-4 rounded-full font-bold disabled:opacity-40">
          전송
        </button>
      </div>
      <p className="text-slate-500 text-[11px] mt-2 text-center">
        한국어로 써도 ✨AI 가 영어로 바꿔줘요 · @이름 으로 가족을 부르고 · 🤖패미가 대화를 이어줘요
      </p>
    </div>
  )
}
