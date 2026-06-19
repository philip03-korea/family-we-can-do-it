import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMonthMeals, listMealWishes, addMealWish, toggleMealVote } from '../lib/meals'
import { FAMILY, colorOf, textOnColor } from '../data/family'
import BottomNav from '../components/BottomNav'

const MONTHS = [
  { key: '2026-06', label: '6월' },
  { key: '2026-07', label: '7월' },
]
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const nameOf = (k) => FAMILY.find((f) => f.key === k)?.name || k

function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

export default function Meals() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const myKey = profile?.member_key
  const today = new Date().toISOString().slice(0, 10)

  const [month, setMonth] = useState(today >= '2026-07-01' ? '2026-07' : '2026-06')
  const [meals, setMeals] = useState([])
  const [weekIdx, setWeekIdx] = useState(0)
  const [wishes, setWishes] = useState([])
  const [form, setForm] = useState(null) // {title, note}
  const [msg, setMsg] = useState('')

  async function refreshWishes() {
    setWishes(await listMealWishes(myKey).catch(() => []))
  }
  useEffect(() => {
    getMonthMeals(month).then(setMeals).catch((e) => setMsg(friendly(e)))
    setWeekIdx(0)
  }, [month])
  useEffect(() => {
    refreshWishes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myKey])

  function friendly(e) {
    if (/meal_plan|meal_wish|exist|schema cache|42P01/i.test(e?.message || ''))
      return '식단 테이블이 아직 없어요. database/step9_meals.sql 을 먼저 실행해 주세요.'
    return e?.message || '오류'
  }

  // 주차별 그룹
  const weeks = useMemo(() => {
    const map = new Map()
    for (const m of meals) {
      const k = mondayOf(m.day)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(m)
    }
    return [...map.entries()].sort().map(([mon, days]) => ({ mon, days }))
  }, [meals])

  const week = weeks[weekIdx]

  async function submitWish() {
    if (!form?.title?.trim()) return
    try {
      await addMealWish({ memberKey: myKey, title: form.title, note: form.note, month })
      setForm(null)
      await refreshWishes()
    } catch (e) {
      setMsg(friendly(e))
    }
  }
  async function vote(w) {
    try {
      await toggleMealVote(w.id, myKey, w.mine)
      await refreshWishes()
    } catch (e) {
      setMsg(friendly(e))
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">🍚 식단표</h1>
      </header>
      <p className="text-xs text-emerald-300/90 mb-3">🥗 5인 가족 건강식단 — 잡곡·채소·단백질 중심, 저당/당뇨친화 (1인 약 1,800kcal)</p>

      {/* 월 선택 */}
      <div className="flex gap-2 mb-3">
        {MONTHS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMonth(m.key)}
            className={`flex-1 py-2.5 rounded-xl font-bold ${month === m.key ? 'bg-level-d text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {msg && <p className="text-xs text-amber-300 mb-3">⚠️ {msg}</p>}

      {/* 주차 선택 */}
      {weeks.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto mb-3">
          {weeks.map((w, i) => (
            <button
              key={w.mon}
              onClick={() => setWeekIdx(i)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold ${weekIdx === i ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {i + 1}주
            </button>
          ))}
        </div>
      )}

      {/* 일별 식단 */}
      <div className="space-y-2 mb-8">
        {week?.days.map((d) => {
          const dt = new Date(d.day + 'T00:00:00')
          const isToday = d.day === today
          return (
            <div key={d.day} className={`rounded-2xl p-3 border ${isToday ? 'bg-level-d/20 border-indigo-400' : 'bg-slate-800/60 border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold">{Number(d.day.slice(8))}일 ({DOW[dt.getDay()]})</span>
                {isToday && <span className="text-[11px] bg-indigo-600 px-2 py-0.5 rounded-full">오늘</span>}
              </div>
              <div className="grid grid-cols-[40px_1fr] gap-x-2 gap-y-1 text-sm">
                <span className="text-amber-300">아침</span><span className="text-slate-200">{d.breakfast || '—'}</span>
                {d.lunch ? (<><span className="text-emerald-300">점심</span><span className="text-slate-200">{d.lunch}</span></>) : null}
                <span className="text-sky-300">저녁</span><span className="text-slate-200">{d.dinner || '—'}</span>
              </div>
              {d.note && <p className="text-[11px] text-emerald-300/90 mt-1.5">🥗 {d.note}</p>}
            </div>
          )
        })}
        {weeks.length === 0 && !msg && <p className="text-slate-400 text-sm text-center py-8">식단이 없어요.</p>}
      </div>

      {/* 추천·희망 음식 */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">🙋 추천·희망 음식</h2>
        {!form && (
          <button onClick={() => setForm({ title: '', note: '' })} className="text-sm bg-level-d px-3 py-1.5 rounded-full font-medium">+ 추천하기</button>
        )}
      </div>
      <p className="text-slate-500 text-xs mb-3">먹고 싶은 음식을 올리면 가족이 공감(♥)으로 투표해요</p>

      {form && (
        <div className="bg-slate-800/60 border border-indigo-500/40 rounded-2xl p-4 space-y-2 mb-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="먹고 싶은 음식 (예: 마라탕)"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm"
          />
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="한마디 (선택)"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm"
          />
          <div className="flex gap-2">
            <button onClick={submitWish} className="flex-1 py-2 rounded-lg bg-indigo-600 text-sm font-bold">올리기</button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded-lg bg-slate-700 text-sm">취소</button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {wishes.map((w) => (
          <li key={w.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold">{w.title}</div>
                <div className="text-xs text-slate-400">
                  <span style={{ color: colorOf(w.member_key) }}>● </span>{nameOf(w.member_key)} 추천{w.note ? ` · ${w.note}` : ''}
                </div>
              </div>
              <button
                onClick={() => vote(w)}
                className={`shrink-0 px-3 py-2 rounded-xl text-sm font-bold ${w.mine ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-200'}`}
              >
                ♥ {w.votes}
              </button>
            </div>
            {/* 공감한 사람 색상 점 */}
            {w.voters.length > 0 && (
              <div className="flex gap-1 mt-2">
                {w.voters.map((vk) => (
                  <span key={vk} title={nameOf(vk)} className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold"
                    style={{ backgroundColor: colorOf(vk), color: textOnColor(vk) }}>
                    {nameOf(vk).slice(-1)}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
        {wishes.length === 0 && <li className="text-slate-500 text-sm text-center py-4">아직 추천이 없어요. 먼저 올려보세요!</li>}
      </ul>

      <BottomNav />
    </div>
  )
}
