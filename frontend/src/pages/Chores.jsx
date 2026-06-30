import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendFamilyMessage } from '../lib/db'
import {
  listChores,
  listOverdue,
  getGoals,
  generateRotation,
  assignChore,
  deleteChore,
  setChoreDone,
  computeProgress,
  weekStartMonday,
  addDays,
  todayYmd,
} from '../lib/chores'
import { addChorePoints, removeChorePoints } from '../lib/rewards'
import { FAMILY, colorOf, textOnColor } from '../data/family'
import { DAY_LABELS, DEFAULT_GOALS, REWARD_TEXT, STREAK_BONUS_TEXT, PARENT_KEYS } from '../data/chores'
import BottomNav from '../components/BottomNav'

const emojiOf = (key) => FAMILY.find((f) => f.key === key)?.emoji || '·'
const nameOf = (key) => FAMILY.find((f) => f.key === key)?.name || '미지정'

// 색상 아바타 (구성원 구분용)
function Avatar({ k, size = 28, dim = false }) {
  if (!k) return <span className="text-slate-600">·</span>
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: colorOf(k), color: textOnColor(k), opacity: dim ? 0.45 : 1, fontSize: size * 0.5 }}
      title={nameOf(k)}
    >
      {emojiOf(k)}
    </span>
  )
}
const CYCLE = [...FAMILY.map((f) => f.key), null] // 수동 지정 시 순환 + 미지정

export default function Chores() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const myKey = profile?.member_key
  const isParent = PARENT_KEYS.includes(myKey)

  const [week, setWeek] = useState(weekStartMonday())
  const [chores, setChores] = useState([])
  const [overdue, setOverdue] = useState([]) // 밀린(지난 날·이전 주) 미완료 — 언제든 체크
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [edit, setEdit] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [selectedKey, setSelectedKey] = useState(null) // 이름 클릭 → 그 사람 집안일 편집

  const dayIndexOf = (dueDate) => Math.round((new Date(dueDate) - new Date(week)) / 86400000)

  async function refresh() {
    const [c, g, od] = await Promise.all([
      listChores(week),
      getGoals().catch(() => DEFAULT_GOALS),
      myKey ? listOverdue(myKey).catch(() => []) : Promise.resolve([]),
    ])
    setChores(c)
    setOverdue(od)
    if (g && Object.keys(g).length) setGoals(g)
  }
  useEffect(() => {
    refresh().catch((e) => setMsg('⚠️ ' + friendlyError(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, myKey])

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

  function friendlyError(e) {
    const m = (e?.message || '') + (e?.details || '') + (e?.code || '')
    if (/chores|relation|exist|42P01|schema cache|404/i.test(m)) {
      return '집안일 테이블이 아직 없어요. Supabase SQL Editor에서 database/step7_chores.sql 을 먼저 실행해 주세요.'
    }
    return e?.message || '알 수 없는 오류'
  }

  async function doRotate() {
    setBusy(true)
    setMsg('당번표 생성 중…')
    try {
      const n = await generateRotation(week)
      await refresh()
      setMsg(`✅ 자동 로테이션 완료 — ${n}개 집안일이 배정됐어요.`)
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
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
      setMsg('⚠️ ' + friendlyError(e))
    }
  }

  async function reassign(choreId, key) {
    try {
      await assignChore(choreId, key)
      setChores((cs) => cs.map((c) => (c.id === choreId ? { ...c, assignee_key: key } : c)))
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
    }
  }

  async function removeChore(choreId) {
    try {
      await deleteChore(choreId)
      setChores((cs) => cs.filter((c) => c.id !== choreId))
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
    }
  }

  async function toggle(chore) {
    const next = !chore.done
    try {
      await setChoreDone(chore.id, next)
      // 포인트 지갑 적립/취소
      if (next) await addChorePoints(chore)
      else await removeChorePoints(chore.id)
      setChores((cs) =>
        cs.map((c) => (c.id === chore.id ? { ...c, done: next, completed_at: next ? new Date().toISOString() : null } : c)),
      )
      // 밀린 목록에 있던 항목이면: 완료 시 제거
      setOverdue((os) => (next ? os.filter((c) => c.id !== chore.id) : os))
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
    }
  }

  // 밀린(다른 주일 수 있음) 집안일 완료 처리 — chores state 밖이라 별도 핸들러
  async function completeOverdue(chore) {
    try {
      await setChoreDone(chore.id, true)
      await addChorePoints(chore)
      setOverdue((os) => os.filter((c) => c.id !== chore.id))
      // 마침 보고 있는 주에 속한 항목이면 표/현황도 갱신
      setChores((cs) =>
        cs.map((c) => (c.id === chore.id ? { ...c, done: true, completed_at: new Date().toISOString() } : c)),
      )
      setMsg('✅ 밀린 집안일을 완료 처리했어요. 포인트가 적립됐어요!')
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
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
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
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

      {/* 가족 칩 — 이름을 누르면 그 사람 집안일 목록/수정 */}
      <p className="text-xs text-slate-500 mb-2">이름을 누르면 그 사람의 집안일을 보고 수정할 수 있어요</p>
      <div className="flex gap-2 mb-4">
        {FAMILY.map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedKey(selectedKey === f.key ? null : f.key)}
            className={`flex-1 rounded-xl py-2 text-center border-2`}
            style={{ borderColor: selectedKey === f.key ? f.color : 'transparent', background: '#1e293b' }}
          >
            <div className="mx-auto"><Avatar k={f.key} size={30} /></div>
            <div className="text-[11px] font-bold mt-1" style={{ color: f.color }}>{f.name}</div>
          </button>
        ))}
      </div>

      {/* 선택한 사람의 집안일 편집 패널 */}
      {selectedKey && (
        <MemberChores
          memberKey={selectedKey}
          chores={chores.filter((c) => c.assignee_key === selectedKey).sort((a, b) => a.due_date.localeCompare(b.due_date))}
          dayIndexOf={dayIndexOf}
          onReassign={reassign}
          onToggle={toggle}
          onRemove={removeChore}
          onClose={() => setSelectedKey(null)}
        />
      )}

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
                          <button onClick={() => edit && cycleAssign(c)} className={edit ? 'ring-2 ring-white/40 rounded-full' : ''}>
                            <Avatar k={c.assignee_key} size={26} dim={c.done} />
                          </button>
                        </td>
                      )
                    }
                    return (
                      <td key={di} className="text-center p-0.5">
                        <div className="flex flex-wrap justify-center gap-0.5">
                          {cs.map((c) => (
                            <Avatar key={c.id} k={c.assignee_key} size={16} dim={c.done} />
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

      {/* 밀린 내 할 일 — 지난 날·이전 주, 언제든 다시 완료 체크 */}
      {overdue.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold flex items-center gap-2 text-amber-300">
              🔴 밀린 할 일 <Avatar k={myKey} size={24} />
            </h2>
            <span className="text-xs text-amber-400/80">{overdue.length}개 · 지금 체크 가능</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
            <p className="text-xs text-amber-200/80 mb-2">예전에 못 끝낸 집안일이에요. 지금 했다면 체크하면 포인트가 적립돼요.</p>
            {overdue.map((c) => (
              <button
                key={c.id}
                onClick={() => completeOverdue(c)}
                className="w-full flex items-center gap-3 py-2.5 border-b border-amber-500/20 last:border-0 text-left"
              >
                <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 border-amber-400/70">
                  <span className="text-amber-300 text-xs">✓</span>
                </span>
                <span className="flex-1 text-sm">{c.title}</span>
                <span className="text-xs text-amber-300/80">{c.due_date.slice(5)}</span>
                <span className="text-xs text-violet-300">+{c.points}P</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 오늘 내 할 일 */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">오늘 내 할 일 <Avatar k={myKey} size={24} /></h2>
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
                <span className="flex items-center gap-1.5"><Avatar k={f.key} size={18} /><span className="font-bold" style={{ color: f.color }}>{f.name}</span></span>
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
                  <span className="flex items-center gap-1.5">
                    <Avatar k={c.assignee_key} size={18} /> {nameOf(c.assignee_key)} · {c.title}
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

      <BottomNav />
    </div>
  )
}

// 이름 클릭 시: 그 사람의 집안일 목록 + 담당 변경/완료/삭제
function MemberChores({ memberKey, chores, dayIndexOf, onReassign, onToggle, onRemove, onClose }) {
  return (
    <div className="bg-slate-800/60 border border-indigo-500/40 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold flex items-center gap-2"><Avatar k={memberKey} size={22} /> {nameOf(memberKey)}의 집안일</h2>
        <button onClick={onClose} className="text-slate-400 text-sm">닫기 ✕</button>
      </div>

      {chores.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-3">맡은 집안일이 없어요. 아래 표/자동 로테이션으로 배정해요.</p>
      ) : (
        <ul className="space-y-2">
          {chores.map((c) => (
            <li key={c.id} className="bg-slate-900 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => onToggle(c)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500' : 'border-2 border-slate-500'}`}
                >
                  {c.done && <span className="text-emerald-950 text-sm">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${c.done ? 'line-through text-slate-500' : ''}`}>
                  {DAY_LABELS[dayIndexOf(c.due_date)] || ''}요일 · {c.title}
                </span>
                <span className="text-xs text-slate-400">+{c.points}P</span>
                <button onClick={() => onRemove(c.id)} className="text-slate-500 text-sm ml-1" aria-label="삭제">🗑</button>
              </div>
              {/* 담당 바꾸기 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 mr-1">담당 변경:</span>
                {FAMILY.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => onReassign(c.id, f.key)}
                    className={`rounded-full ${f.key === c.assignee_key ? 'ring-2 ring-white' : 'opacity-60'}`}
                  >
                    <Avatar k={f.key} size={26} />
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
