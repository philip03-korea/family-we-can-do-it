import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStudyQueue } from '../lib/db'
import { speak, isTTSSupported } from '../lib/tts'
import { LEVELS, LEVEL_ORDER } from '../data/family'

// 진행 상태 라벨
function statusOf(progress) {
  if (!progress) return { label: '새 단어', cls: 'text-slate-400' }
  const due = progress.due_at <= new Date().toISOString()
  if (due) return { label: '복습 필요', cls: 'text-amber-400' }
  return { label: '학습됨', cls: 'text-emerald-400' }
}

export default function Words() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [level, setLevel] = useState(profile?.level || 'B')
  const [words, setWords] = useState([])
  const [progressById, setProgressById] = useState({})
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getStudyQueue(user.id, level, 9999)
      .then(({ words, progressById }) => {
        if (!alive) return
        setWords(words)
        setProgressById(progressById)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [user.id, level])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return words
    return words.filter(
      (w) => w.term.toLowerCase().includes(s) || (w.meaning_ko || '').includes(s),
    )
  }, [q, words])

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">
          ← 대시보드
        </button>
        <h1 className="text-xl font-bold">단어장</h1>
      </header>

      {/* 레벨 탭 */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {LEVEL_ORDER.map((code) => (
          <button
            key={code}
            onClick={() => setLevel(code)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold shrink-0 ${
              level === code ? LEVELS[code].bg + ' text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="단어 또는 뜻 검색"
        className="w-full px-4 py-2.5 mb-4 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm"
      />

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-10">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-10">
          단어가 없어요. (seed_words.sql 실행 여부 확인)
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((w) => {
            const st = statusOf(progressById[w.id])
            return (
              <li key={w.id} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{w.term}</span>
                      {w.pos && <span className="text-xs text-slate-500">{w.pos}</span>}
                    </div>
                    <p className="text-slate-300 text-sm">{w.meaning_ko}</p>
                    {w.example_en && (
                      <p className="text-slate-500 text-xs mt-1 truncate">{w.example_en}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => speak(w.term)}
                      disabled={!isTTSSupported()}
                      className="bg-slate-700 w-9 h-9 rounded-full disabled:opacity-40"
                      aria-label="듣기"
                    >
                      🔊
                    </button>
                    <span className={`text-[10px] ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
