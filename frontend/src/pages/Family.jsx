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
import { FAMILY, LEVELS } from '../data/family'

const emojiOf = (key) => FAMILY.find((f) => f.key === key)?.emoji || '🙂'

export default function Family() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [topic, setTopic] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

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

  async function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
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

      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지 (영어로 연습해도 좋아요)"
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-800 border border-slate-700 focus:border-indigo-500 outline-none text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-level-c px-5 rounded-full font-bold disabled:opacity-40"
        >
          전송
        </button>
      </div>
    </div>
  )
}
