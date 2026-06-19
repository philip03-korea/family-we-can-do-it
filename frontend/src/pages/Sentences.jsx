import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWords } from '../lib/db'
import { speak, isTTSSupported } from '../lib/tts'
import { LEVELS, LEVEL_ORDER } from '../data/family'
import BottomNav from '../components/BottomNav'

// 문장 읽기 — 레벨별 예문을 보여주고, 탭하면 뜻이 나옴
export default function Sentences() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const level = (params.get('level') || profile?.level || 'B').toUpperCase()
  const lv = LEVELS[level] || LEVELS.B

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({}) // id -> 뜻 표시 여부

  useEffect(() => {
    let alive = true
    setLoading(true)
    setOpen({})
    getWords({ level, category: 'general' })
      .then((ws) => {
        if (!alive) return
        setItems(ws.filter((w) => w.example_en))
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [level])

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-3">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">📖 문장 읽기</h1>
      </header>
      <p className="text-xs text-slate-400 mb-3">문장을 읽어보고, 탭하면 뜻이 나와요. 🔊로 들어볼 수도 있어요.</p>

      {/* 레벨 탭 */}
      <div className="flex gap-1.5 overflow-x-auto mb-4">
        {LEVEL_ORDER.map((code) => (
          <button
            key={code}
            onClick={() => setParams({ level: code })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold ${level === code ? LEVELS[code].bg + ' text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {code} {LEVELS[code].label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-10">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-10">이 레벨의 문장이 아직 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((w) => {
            const shown = open[w.id]
            return (
              <li key={w.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [w.id]: !o[w.id] }))}
                    className="flex-1 text-left"
                  >
                    <p className="text-base text-slate-100">{w.example_en}</p>
                    {shown ? (
                      <p className="text-sm text-emerald-300 mt-1.5">{w.example_ko || w.meaning_ko}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">👆 탭하면 뜻 보기</p>
                    )}
                  </button>
                  <button
                    onClick={() => speak(w.example_en)}
                    disabled={!isTTSSupported()}
                    className="shrink-0 w-9 h-9 rounded-full bg-slate-700 disabled:opacity-40"
                    aria-label="듣기"
                  >
                    🔊
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <BottomNav />
    </div>
  )
}
