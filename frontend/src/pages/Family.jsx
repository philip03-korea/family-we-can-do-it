import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getWeeklyTopic,
  getFamilyOverview,
  getRecentFamilyMessages,
  sendFamilyMessage,
  subscribeFamilyMessages,
} from '../lib/db'
import { speak, isTTSSupported } from '../lib/tts'
import { listenOnce, isSTTSupported } from '../lib/stt'
import { chat } from '../lib/ai'
import { FAMILY, LEVELS } from '../data/family'

const emojiOf = (key) => FAMILY.find((f) => f.key === key)?.emoji || '🙂'

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
  const endRef = useRef(null)
  const sttOk = isSTTSupported()
  const level = profile?.level || 'C'

  useEffect(() => {
    getWeeklyTopic().then(setTopic).catch(() => {})
    getFamilyOverview().then(setMembers).catch(() => {})
    getRecentFamilyMessages().then(setMessages).catch(() => {})

    const channel = subscribeFamilyMessages((msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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

  // 🎤 말로 입력 (영어 음성 → 텍스트)
  async function speakInput() {
    if (!sttOk) return
    setListening(true)
    setAiError('')
    try {
      const { transcript } = await listenOnce({ lang: 'en-US' })
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
      setPractice({ score, transcript })
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
      <h2 className="text-lg font-bold mb-3">가족 채팅 <span className="text-xs text-slate-500 font-normal">· 실시간</span></h2>
      <div className="flex-1 min-h-[240px] bg-slate-800/40 rounded-2xl border border-slate-700 p-3 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">첫 메시지를 남겨보세요 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === user.id
          return (
            <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <div className="max-w-[80%]">
                {!mine && (
                  <span className="text-xs text-slate-400 ml-1">
                    {emojiOf(m.member_key)} {m.display_name}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    mine ? 'bg-level-c text-white' : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  {m.text}
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
          {correction.reply && <p className="text-slate-200 text-sm mb-2">💬 {correction.reply}</p>}
          <p className="text-amber-200 text-sm">
            {correction.changed ? '✨ 영어로' : '👍 좋아요'}: <span className="font-medium">{correction.fixed}</span>
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
              발음 <span className={practice.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{practice.score}점</span> · "{practice.transcript}"
            </p>
          )}
        </div>
      )}
      {aiError && <p className="text-amber-300 text-xs mt-2">⚠️ {aiError}</p>}

      <div className="flex gap-2 mt-3 items-center">
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
        한국어로 써도 ✨AI 가 영어로 바꿔주고, 단어·문장 뜻도 물어보세요 → 🔊듣고 🎤따라 읽기
      </p>
    </div>
  )
}
