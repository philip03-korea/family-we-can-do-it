import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendFamilyMessage } from '../lib/db'
import {
  listChores,
  getGoals,
  generateRotation,
  assignChore,
  setChoreDone,
  computeProgress,
  weekStartMonday,
  addDays,
  todayYmd,
} from '../lib/chores'
import { FAMILY } from '../data/family'
import { DAY_LABELS, DEFAULT_GOALS, REWARD_TEXT, STREAK_BONUS_TEXT, PARENT_KEYS } from '../data/chores'

const emojiOf = (key) => FAMILY.find((f) => f.key === key)?.emoji || '·'
const nameOf = (key) => FAMILY.find((f) => f.key === key)?.name || '미지정'
const CYCLE = [...FAMILY.map((f) => f.key), null] // 수동 지정 시 순환 + 미지정

export default function Chores() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const myKey = profile?.member_key
  const isParent = PARENT_KEYS.includes(myKey)

  const [week, setWeek] = useState(weekStartMonday())
  const [chores, setChores] = useState([])
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [edit, setEdit] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function refresh() {
    const [c, g] = await Promise.all([listChores(week), getGoals().catch(() => DEFAULT_GOALS)])
    setChores(c)
    if (g && Object.keys(g).length) setGoals(g)
  }
  useEffect(() => {
    refresh().catch((e) => setMsg(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])

  const today = todayYmd()
  const progress = useMemo(() => computeProgress(chores), [chores])

  // 제목별 × 요일별 그리드 (한 칸에 여러 명 가능: 방 청소·신발 빨래)
  const grid = useMemo(() => {
    const titles = []
    const map = {}
    for (const c of chores) {
      if (!map[c.title]) {
        map[c.title] = { title: c.title, days: {} }
        titles.push(c.title)
      }
      const di = Math.round((new Date(c.due_date) - new Date(week)) / 86400000)
      ;(map[c.title].days[di] ||= []).push(c)
    }
    return titles.map((t) => map[t])
  }, [chores, week])

  const myToday = chores.filter((c) => c.assignee_key === myKey && c.due_date === today)
  const myDonePts = progress[myKey]?.done || 0
  const myGoal = goals[myKey] || 100

  // 부모용: 오늘(또는 그 이전) 미완료
  const incomplete = chores.filter((c) => !c.done && c.due_date <= today && c.assignee_key && !PARENT_KEYS.includes(c.assignee_key))

  async function doRotate() {
    if (!confirm('이번 주 당번표를 자동으로 새로 짭니다. (기존 완료 기록 초기화)')) return
    setBusy(true)
    setMsg('')
    try {
      await generateRotation(week)
      await refresh()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function cycleAssign(chore) {
    const idx = CYCLE.indexOf(chore.assignee_key)
    const next = CYCLE[(idx + 1) % CYCLE.length]
    try {
      await assignChore(chore.id, next)
      setChores((cs) => cs.map((c) => (c.id === chore.id ? { ...c, assignee_key: next } : c)))
    } catch (e) {
      setMsg(e.message)
    }
  }

  async function toggle(chore) {
    try {
      await setChoreDone(chore.id, !chore.done)
      setChores((cs) =>
        cs.map((c) => (c.id === chore.id ? { ...c, done: !c.done, completed_at: !c.done ? new Date().toISOString() : null } : c)),
      )
    } catch (e) {
      setMsg(e.message)
    }
  }

  async function nudge(c) {
    try {
      await sendFamilyMessage({
        userId: user.id,
        displayName: profile?.display_name || '부모님',
        memberKey: myKey,
        text: `🧹 @${nameOf(c.assignee_key)} "${c.title}" 아직 안 했어요! 부탁해요 🙏`,
      })
      setMsg('가족 채팅으로 알림을 보냈어요.')
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">🧹 집안일</h1>
      </header>

      {/* 주 이동 */}
      <div className="flex items-center justify-between mb-4 bg-slate-800/60 rounded-xl px-3 py-2">
        <button onClick={() => setWeek(addDays(week, -7))} className="text-slate-400 px-2">‹</button>
        <span className="text-sm">
          {week === weekStartMonday() ? '이번 주' : ''} {week} ~ {addDays(week, 6)}
        </span>
        <button onClick={() => setWeek(addDays(week, 7))} className="text-slate-400 px-2">›</button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 mb-4">
        <button onClick={doRotate} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-indigo-600 font-medium text-sm disabled:opacity-50">
          🔄 자동 로테이션
        </button>
        <button
          onClick={() => setEdit((e) => !e)}
          className={`flex-1 py-2.5 rounded-xl font-medium text-sm border ${
            edit ? 'bg-amber-600 border-amber-500' : 'bg-slate-800 border-slate-600 text-slate-300'
          }`}
        >
          ✏️ 수동 지정 {edit ? '완료' : ''}
        </button>
      </div>
      {edit && <p className="text-xs text-amber-300 mb-3">표의 칸을 탭하면 담당자가 순서대로 바뀝니다.</p>}
      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

      {/* 주간 당번표 */}
      {grid.length === 0 ? (
        <div className="bg-slate-800/60 rounded-2xl p-6 text-center text-slate-400 text-sm mb-6">
          아직 당번표가 없어요.<br />“🔄 자동 로테이션”으로 시작해 보세요.
        </div>
      ) : (
        <div className="bg-slate-800/60 rounded-2xl p-3 mb-6 overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="text-slate-400 text-[11px]">
                <th className="text-left p-1 w-[60px]">집안일</th>
                {DAY_LABELS.map((d, i) => (
                  <th key={d} className={`p-1 ${i === 5 ? 'text-amber-400' : i === 6 ? 'text-rose-400' : ''}`}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row) => (
                <tr key={row.title} className="border-t border-slate-700">
                  <td className="p-1.5 text-[11px] text-slate-300">{row.title}</td>
                  {DAY_LABELS.map((_, di) => {
                    const cs = row.days[di]
                    if (!cs || cs.length === 0) return <td key={di} className="text-center p-0.5"><span className="text-slate-700">·</span></td>
                    if (cs.length === 1) {
                      const c = cs[0]
                      return (
                        <td key={di} className="text-center p-0.5">
                          <button
                            onClick={() => edit && cycleAssign(c)}
                            className={`w-7 h-7 rounded-lg ${edit ? 'bg-slate-700' : ''} ${c.done ? 'opacity-40' : ''}`}
                          >
                            {emojiOf(c.assignee_key)}
                          </button>
                        </td>
                      )
                    }
                    return (
                      <td key={di} className="text-center p-0.5">
                        <div className="flex flex-wrap justify-center gap-0.5 text-[10px] leading-none">
                          {cs.map((c) => (
                            <span key={c.id} className={c.done ? 'opacity-40' : ''}>{emojiOf(c.assignee_key)}</span>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 오늘 내 할 일 */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">오늘 내 할 일 {emojiOf(myKey)}</h2>
        <span className="text-sm text-violet-300">{myDonePts} / {myGoal}P</span>
      </div>
      <div className="bg-slate-800/60 rounded-2xl p-3 mb-2">
        {myToday.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">오늘 내 당번은 없어요 😊</p>
        ) : (
          myToday.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c)}
              className="w-full flex items-center gap-3 py-2.5 border-b border-slate-700 last:border-0 text-left"
            >
              <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500' : 'border-2 border-slate-500'}`}>
                {c.done && <span className="text-emerald-950 text-sm">✓</span>}
              </span>
              <span className={`flex-1 text-sm ${c.done ? 'line-through text-slate-500' : ''}`}>{c.title}</span>
              <span className={`text-xs ${c.done ? 'text-emerald-400' : 'text-slate-400'}`}>+{c.points}P</span>
            </button>
          ))
        )}
      </div>

      {/* 보상 진행도 */}
      <div className="bg-slate-800/60 rounded-2xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-1.5">
          <span>🎁 이번 주 보상까지</span>
          <span className="text-violet-300">{myDonePts} / {myGoal}P</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden mb-2">
          <div className="bg-violet-400 h-full" style={{ width: `${Math.min(100, (myDonePts / myGoal) * 100)}%` }} />
        </div>
        <p className="text-xs text-slate-400">{REWARD_TEXT}</p>
        <p className="text-xs text-slate-500 mt-1">{STREAK_BONUS_TEXT}</p>
      </div>

      {/* 가족별 완료 현황 */}
      <h2 className="text-lg font-bold mb-2">가족별 이번 주 완료 현황</h2>
      <div className="bg-slate-800/60 rounded-2xl p-4 mb-6 space-y-3">
        {FAMILY.map((f) => {
          const p = progress[f.key] || { done: 0, total: 0, doneCount: 0, totalCount: 0 }
          const pct = p.total ? Math.round((p.done / p.total) * 100) : 0
          const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
          return (
            <div key={f.key}>
              <div className="flex justify-between text-xs mb-1">
                <span>{f.emoji} {f.name}</span>
                <span className="text-slate-400">{p.doneCount}/{p.totalCount}개 · {pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className={`${color} h-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 부모 전용: 미완료 알림 */}
      {isParent && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
          <h2 className="text-base font-bold mb-2 text-rose-200">⏰ 미완료 알림 (부모 전용)</h2>
          {incomplete.length === 0 ? (
            <p className="text-slate-400 text-sm">밀린 집안일이 없어요. 👏</p>
          ) : (
            <ul className="space-y-2">
              {incomplete.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {emojiOf(c.assignee_key)} {nameOf(c.assignee_key)} · {c.title}
                    <span className="text-slate-500 text-xs"> ({c.due_date.slice(5)})</span>
                  </span>
                  <button onClick={() => nudge(c)} className="text-xs bg-rose-600 px-2.5 py-1 rounded-full shrink-0">
                    콕 찌르기
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
