import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendFamilyMessage } from '../lib/db'
import {
  listChores,
  listOverdue,
  getGoals,
  generateRotation,
  generateMonthRotation,
  listMonthChores,
  getMonthScores,
  assignChore,
  createChore,
  deleteChore,
  setChoreDone,
  setChoreFixed,
  addFixedChore,
  computeProgress,
  weekStartMonday,
  addDays,
  ymd,
  todayYmd,
} from '../lib/chores'
import { addChorePoints, removeChorePoints } from '../lib/rewards'
import { FAMILY, colorOf, textOnColor } from '../data/family'
import { DAY_LABELS, DEFAULT_GOALS, REWARD_TEXT, STREAK_BONUS_TEXT, PARENT_KEYS } from '../data/chores'
import BottomNav from '../components/BottomNav'

const monthOf = (ymdStr) => ymdStr.slice(0, 7)
const monthLabel = (mo) => `${Number(mo.slice(5))}월`
function addMonth(mo, n) {
  const [y, m] = mo.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const prevMonth = (mo) => addMonth(mo, -1)
const medalOf = (i) => ['🥇', '🥈', '🥉'][i] || `${i + 1}위`

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
  const [selectedKey, setSelectedKey] = useState(null)
  const [picker, setPicker] = useState(null)
  const [undo, setUndo] = useState(null) // { label, action }

  // 보기 모드(주간/월간) + 월별 데이터
  const [viewMode, setViewMode] = useState('week') // 'week' | 'month'
  const [month, setMonth] = useState(monthOf(todayYmd()))
  const [monthChores, setMonthChores] = useState([])
  const [scores, setScores] = useState({}) // 이번(보는) 달 점수
  const [award, setAward] = useState(null) // 지난달 시상 팝업 { month, ranking }

  // 되돌리기 자동 사라짐 (5초)
  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), 5000)
    return () => clearTimeout(t)
  }, [undo])

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

  // 보는 달의 집안일(달력) + 점수(순위) 로드
  async function refreshMonth(mo = month) {
    const [mc, sc] = await Promise.all([
      listMonthChores(mo).catch(() => []),
      getMonthScores(mo).catch(() => ({})),
    ])
    setMonthChores(mc)
    setScores(sc)
  }
  useEffect(() => {
    refreshMonth(month).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // 매월 초 시상 팝업 — 새 달에 처음 열면 지난달 순위를 축하 팝업으로
  useEffect(() => {
    const thisMonth = monthOf(todayYmd())
    const last = prevMonth(thisMonth)
    const shownKey = `famtalk_award_shown_${last}`
    if (localStorage.getItem(shownKey)) return
    getMonthScores(last)
      .then((sc) => {
        const ranking = FAMILY.map((f) => ({ key: f.key, ...(sc[f.key] || { points: 0, count: 0 }) }))
          .filter((r) => r.points > 0)
          .sort((a, b) => b.points - a.points)
        if (ranking.length >= 1) {
          setAward({ month: last, ranking })
          localStorage.setItem(shownKey, '1')
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // 이번(보는) 달 순위 — 점수 내림차순
  const monthRanking = useMemo(
    () =>
      FAMILY.map((f) => ({ key: f.key, name: f.name, color: f.color, ...(scores[f.key] || { points: 0, count: 0 }) }))
        .sort((a, b) => b.points - a.points),
    [scores],
  )

  // 월간 달력 — 그 달을 월요일 시작 주 단위로 나눈 6주 격자
  const calendar = useMemo(() => {
    const firstYmd = `${month}-01`
    const start = weekStartMonday(new Date(firstYmd + 'T00:00:00'))
    const byDay = {}
    for (const c of monthChores) (byDay[c.due_date] ||= []).push(c)
    const weeks = []
    let cur = start
    for (let w = 0; w < 6; w++) {
      const days = []
      for (let d = 0; d < 7; d++) {
        const cell = cur
        days.push({ date: cell, inMonth: monthOf(cell) === month, items: byDay[cell] || [] })
        cur = addDays(cur, 1)
      }
      weeks.push(days)
      // 다음 주 월요일이 이미 다음 달이면 종료 (그 달을 덮는 최소 주 수)
      if (monthOf(cur) !== month) break
    }
    return weeks
  }, [month, monthChores])

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
      await refreshMonth()
      setMsg(`✅ 이번 주 자동 로테이션 완료 — ${n}개 배정.`)
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  // 한 달치 미리 공평하게 배정
  async function doRotateMonth() {
    if (!window.confirm(`${monthLabel(month)} 한 달치를 새로 공평하게 배정할까요?\n(고정 규칙: 분리수거 수·일=하울·하람, 안방화장실=아빠 / 이미 완료한 기록·직접 만든 고정은 유지)`)) return
    setBusy(true)
    setMsg(`${monthLabel(month)} 한 달치 배정 중…`)
    try {
      const n = await generateMonthRotation(month)
      await refreshMonth()
      await refresh()
      setMsg(`✅ ${monthLabel(month)} 한 달치 배정 완료 — ${n}개 집안일.`)
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

  // 고정/해제 — fixed=true면 자동 로테이션에서 제외(담당 고정)
  async function toggleFixed(chore, untilDate) {
    const next = !chore.fixed
    try {
      await setChoreFixed(chore.id, next, next ? (untilDate || chore.due_date) : null)
      setChores((cs) =>
        cs.map((c) => (c.id === chore.id ? { ...c, fixed: next, fixed_until: next ? (untilDate || chore.due_date) : null } : c)),
      )
      setMsg(next ? `📌 "${chore.title}" 고정됨 — 자동 로테이션에서 제외돼요.` : `고정 해제됨`)
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
    }
  }

  // 고정 집안일 추가 — 오늘~untilDate 매일 같은 담당으로 생성
  async function addFixed({ assigneeKey, title, points, untilDate }) {
    try {
      const n = await addFixedChore({ assigneeKey, title, points, startDate: today, untilDate })
      await refresh()
      setMsg(`📌 "${title}" 고정 ${n}일치 추가됨 (${today} ~ ${untilDate}).`)
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
    }
  }

  async function toggle(chore) {
    const next = !chore.done
    try {
      await setChoreDone(chore.id, next)
      if (next) await addChorePoints(chore)
      else await removeChorePoints(chore.id)
      setChores((cs) =>
        cs.map((c) => (c.id === chore.id ? { ...c, done: next, completed_at: next ? new Date().toISOString() : null } : c)),
      )
      // 밀린 목록에 있던 항목이면: 완료 시 제거
      setOverdue((os) => (next ? os.filter((c) => c.id !== chore.id) : os))
      setUndo({ label: next ? `"${chore.title}" 완료 처리됨` : `"${chore.title}" 미완료로 변경`, action: async () => {
        await setChoreDone(chore.id, !next)
        if (!next) await addChorePoints(chore)
        else await removeChorePoints(chore.id)
        setChores((cs) =>
          cs.map((c) => (c.id === chore.id ? { ...c, done: !next, completed_at: !next ? new Date().toISOString() : null } : c)),
        )
      }})
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
      setUndo({ label: `"${chore.title}" 완료 처리됨 (밀린 일)`, action: async () => {
        await setChoreDone(chore.id, false)
        await removeChorePoints(chore.id)
        setOverdue((os) => [...os, { ...chore, done: false }].sort((a, b) => a.due_date.localeCompare(b.due_date)))
        setChores((cs) =>
          cs.map((c) => (c.id === chore.id ? { ...c, done: false, completed_at: null } : c)),
        )
      }})
    } catch (e) {
      setMsg('⚠️ ' + friendlyError(e))
    }
  }

  async function nudge(c) {
    if (!user?.id) { setMsg('⚠️ 로그인이 필요해요.'); return }
    try {
      await sendFamilyMessage({
        userId: user.id,
        displayName: profile?.display_name || '부모님',
        memberKey: myKey,
        text: `🧹 @${nameOf(c.assignee_key)} "${c.title}" 아직 안 했어요! 부탁해요 🙏`,
      })
      setUndo({ label: `✅ ${nameOf(c.assignee_key)}에게 콕 찔렀어요!`, action: null })
    } catch (e) {
      const em = e?.message || ''
      if (/row-level security|policy|permission|RLS/i.test(em)) {
        setMsg('⚠️ 메시지 권한 오류 — Supabase RLS 정책을 확인해 주세요.')
      } else {
        setMsg('⚠️ 콕 찌르기 실패: ' + em)
      }
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">🧹 집안일</h1>
      </header>

      {/* 주간 / 월간 보기 토글 */}
      <div className="flex gap-1 mb-3 bg-slate-800/60 rounded-xl p-1">
        {[
          ['week', '주간 보기'],
          ['month', '월간 달력'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${viewMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {viewMode === 'week' ? (
        <>
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
            <button onClick={doRotate} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-slate-700 border border-slate-600 font-medium text-sm disabled:opacity-50">
              🔄 이번 주만
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
        </>
      ) : (
        <>
          {/* 월 이동 */}
          <div className="flex items-center justify-between mb-3 bg-slate-800/60 rounded-xl px-3 py-2">
            <button onClick={() => setMonth(addMonth(month, -1))} className="text-slate-400 px-2">‹</button>
            <span className="text-sm font-bold">
              {month.slice(0, 4)}년 {monthLabel(month)}
              {month === monthOf(todayYmd()) ? ' (이번 달)' : ''}
            </span>
            <button onClick={() => setMonth(addMonth(month, 1))} className="text-slate-400 px-2">›</button>
          </div>

          {/* 한 달치 자동 배정 */}
          <button
            onClick={doRotateMonth}
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-indigo-600 font-bold text-sm mb-2 disabled:opacity-50"
          >
            📅 {monthLabel(month)} 한 달치 자동 배정 (공평 분배)
          </button>
          <p className="text-[11px] text-slate-500 mb-3">
            📌 고정: 분리수거 수·일 = 하울·하람 / 안방화장실 = 아빠 · 나머지는 포인트 기준 공평 분배
          </p>
        </>
      )}
      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

      {viewMode === 'week' && (
      <>
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
          today={today}
          onReassign={reassign}
          onToggle={toggle}
          onRemove={removeChore}
          onToggleFixed={toggleFixed}
          onAddFixed={addFixed}
          onClose={() => setSelectedKey(null)}
        />
      )}

      {/* 주간 당번표 */}
      {grid.length === 0 ? (
        <div className="bg-slate-800/60 rounded-2xl p-6 text-center text-slate-400 text-sm mb-6">
          아직 당번표가 없어요.<br />“월간 달력 → 📅 한 달치 자동 배정”으로 시작해 보세요.
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
                    const openPicker = () => {
                      if (!edit) return
                      const sample = cs?.[0] || {}
                      setPicker({
                        title: row.title,
                        dayIdx: di,
                        dueDate: addDays(week, di),
                        category: sample.category || '기타',
                        points: sample.points || 10,
                      })
                    }
                    if (!cs || cs.length === 0) {
                      return (
                        <td key={di} className="text-center p-0.5">
                          <button onClick={openPicker} className={edit ? 'w-7 h-7 rounded-full border-2 border-dashed border-slate-600 text-slate-600 text-xs hover:border-white' : ''}>
                            {edit ? '+' : '·'}
                          </button>
                        </td>
                      )
                    }
                    if (cs.length === 1) {
                      const c = cs[0]
                      return (
                        <td key={di} className="text-center p-0.5">
                          <button onClick={openPicker} className={`relative inline-block ${edit ? 'ring-2 ring-white/40 rounded-full' : ''}`}>
                            <Avatar k={c.assignee_key} size={26} dim={c.done} />
                            {c.fixed && <span className="absolute -top-1.5 -right-1.5 text-[10px]" title="고정">📌</span>}
                          </button>
                        </td>
                      )
                    }
                    return (
                      <td key={di} className="text-center p-0.5">
                        <button onClick={openPicker} className={edit ? 'ring-2 ring-white/40 rounded-lg p-0.5' : ''}>
                          <div className="flex flex-wrap justify-center gap-0.5">
                            {cs.map((c) => (
                              <Avatar key={c.id} k={c.assignee_key} size={16} dim={c.done} />
                            ))}
                          </div>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {/* 월간 달력 보기 */}
      {viewMode === 'month' && (
        <MonthCalendar weeks={calendar} month={month} today={today} />
      )}

      {/* 이번(보는) 달 순위 — 경쟁 보드 */}
      <div className="bg-slate-800/60 border border-amber-500/30 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">🏆 {monthLabel(month)} 집안일 순위</h2>
          <button
            onClick={() => {
              const last = prevMonth(monthOf(todayYmd()))
              getMonthScores(last).then((sc) => {
                const ranking = FAMILY.map((f) => ({ key: f.key, ...(sc[f.key] || { points: 0, count: 0 }) }))
                  .filter((r) => r.points > 0)
                  .sort((a, b) => b.points - a.points)
                if (ranking.length) setAward({ month: last, ranking })
                else setMsg('지난달 완료 기록이 아직 없어요.')
              })
            }}
            className="text-[11px] text-amber-300 underline"
          >
            지난달 시상 보기
          </button>
        </div>
        {monthRanking.every((r) => r.points === 0) ? (
          <p className="text-sm text-slate-400 text-center py-2">아직 완료한 집안일이 없어요. 먼저 시작해봐요! 💪</p>
        ) : (
          <ul className="space-y-2">
            {monthRanking.map((r, i) => {
              const top = monthRanking[0].points || 1
              const rank = r.points === 0 ? '·' : medalOf(i)
              return (
                <li key={r.key} className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm">{rank}</span>
                  <Avatar k={r.key} size={22} />
                  <span className="text-sm font-bold w-10" style={{ color: r.color }}>{r.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.points / top) * 100}%`, background: r.color }} />
                  </div>
                  <span className="text-xs text-violet-300 w-14 text-right">{r.points}P·{r.count}개</span>
                </li>
              )
            })}
          </ul>
        )}
        <p className="text-[11px] text-slate-500 mt-2">매월 1일, 지난달 1·2·3위를 축하 팝업으로 알려줘요 🎉</p>
      </div>

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

      {/* 다중 배정 팝업 */}
      {picker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setPicker(null)}>
          <div className="bg-slate-800 rounded-t-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{picker.title} · {DAY_LABELS[picker.dayIdx]}요일</h3>
              <button onClick={() => setPicker(null)} className="text-slate-400">✕</button>
            </div>
            <p className="text-xs text-slate-400 mb-3">담당할 사람을 탭하세요 (여러 명 가능)</p>
            <div className="flex gap-3 justify-center mb-4">
              {FAMILY.map((f) => {
                const existing = chores.find(
                  (c) => c.title === picker.title && c.due_date === picker.dueDate && c.assignee_key === f.key
                )
                const isOn = !!existing
                return (
                  <button
                    key={f.key}
                    onClick={async () => {
                      try {
                        if (isOn) {
                          await deleteChore(existing.id)
                          setChores((cs) => cs.filter((c) => c.id !== existing.id))
                          const undoData = { ...existing }
                          setUndo({ label: `${nameOf(f.key)} 제거됨`, action: async () => {
                            const restored = await createChore({ weekStart: week, dueDate: picker.dueDate, title: picker.title, category: picker.category, points: picker.points, assigneeKey: f.key })
                            if (restored) setChores((cs) => [...cs, restored])
                          }})
                        } else {
                          const newC = await createChore({ weekStart: week, dueDate: picker.dueDate, title: picker.title, category: picker.category, points: picker.points, assigneeKey: f.key })
                          if (newC) {
                            setChores((cs) => [...cs, newC])
                            setUndo({ label: `${nameOf(f.key)} 배정됨`, action: async () => {
                              await deleteChore(newC.id)
                              setChores((cs) => cs.filter((c) => c.id !== newC.id))
                            }})
                          }
                        }
                      } catch (e) { setMsg('⚠️ ' + friendlyError(e)) }
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${
                      isOn ? 'border-emerald-400 bg-emerald-600/20' : 'border-slate-600 bg-slate-700/50'
                    }`}
                  >
                    <Avatar k={f.key} size={36} />
                    <span className="text-[11px] font-bold" style={{ color: f.color }}>{f.name}</span>
                    <span className="text-[10px]">{isOn ? '✓ 배정됨' : '탭하여 추가'}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setPicker(null)} className="w-full py-2.5 rounded-xl bg-indigo-600 font-bold text-sm">완료</button>
          </div>
        </div>
      )}

      {/* 되돌리기 바 */}
      {undo && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-700 border border-slate-500 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl animate-pulse-once max-w-sm">
          <span className="text-sm flex-1">{undo.label}</span>
          {undo.action && (
            <button
              onClick={async () => { try { await undo.action() } catch {} setUndo(null) }}
              className="text-sm font-bold text-amber-300 bg-slate-600 px-3 py-1.5 rounded-lg"
            >
              ↩ 되돌리기
            </button>
          )}
          <button onClick={() => setUndo(null)} className="text-slate-400 text-xs">✕</button>
        </div>
      )}

      {/* 매월 초 시상 팝업 */}
      {award && <AwardPopup award={award} onClose={() => setAward(null)} />}

      <BottomNav />
    </div>
  )
}

// 월간 달력 — 주 단위 격자, 각 날짜 칸에 담당 아바타
function MonthCalendar({ weeks, month, today }) {
  const [openDay, setOpenDay] = useState(null)
  const dayItems = openDay ? weeks.flat().find((d) => d.date === openDay)?.items || [] : []
  return (
    <div className="bg-slate-800/60 rounded-2xl p-2 mb-6">
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`text-center text-[11px] font-bold py-1 ${i === 5 ? 'text-amber-400' : i === 6 ? 'text-rose-400' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>
      {weeks.map((wk, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
          {wk.map((cell) => {
            const done = cell.items.filter((c) => c.done).length
            const isToday = cell.date === today
            return (
              <button
                key={cell.date}
                onClick={() => cell.items.length && setOpenDay(cell.date)}
                className={`min-h-[52px] rounded-lg p-1 flex flex-col items-stretch text-left border ${
                  isToday ? 'border-indigo-400' : 'border-transparent'
                } ${cell.inMonth ? 'bg-slate-900/60' : 'bg-slate-900/20 opacity-40'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-300' : 'text-slate-400'}`}>{Number(cell.date.slice(8))}</span>
                  {cell.items.length > 0 && <span className="text-[8px] text-slate-500">{done}/{cell.items.length}</span>}
                </div>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {cell.items.slice(0, 5).map((c) => (
                    <Avatar key={c.id} k={c.assignee_key} size={13} dim={c.done} />
                  ))}
                  {cell.items.length > 5 && <span className="text-[8px] text-slate-500">+{cell.items.length - 5}</span>}
                </div>
              </button>
            )
          })}
        </div>
      ))}

      {/* 날짜 상세 */}
      {openDay && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={() => setOpenDay(null)}>
          <div className="bg-slate-800 rounded-t-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{openDay.slice(5).replace('-', '/')} 집안일</h3>
              <button onClick={() => setOpenDay(null)} className="text-slate-400">✕</button>
            </div>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto">
              {dayItems.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <Avatar k={c.assignee_key} size={22} dim={c.done} />
                  <span className={`font-bold ${c.done ? 'line-through text-slate-500' : ''}`} style={{ color: colorOf(c.assignee_key) }}>{nameOf(c.assignee_key)}</span>
                  <span className={`flex-1 ${c.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {c.fixed && '📌 '}{c.title}
                  </span>
                  <span className="text-xs text-slate-400">+{c.points}P{c.done ? ' ✓' : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// 매월 초 시상 팝업 — 지난달 1·2·3위 축하
function AwardPopup({ award, onClose }) {
  const top3 = award.ranking.slice(0, 3)
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-400/50 rounded-3xl p-6 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-4xl mb-1">🏆</div>
        <h2 className="text-lg font-bold mb-1">{monthLabel(award.month)} 집안일 시상식</h2>
        <p className="text-xs text-slate-400 mb-4">지난달 가장 열심히 한 가족을 축하해요! 🎉</p>
        <div className="space-y-2 mb-4">
          {top3.map((r, i) => (
            <div
              key={r.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i === 0 ? 'bg-amber-500/20 border border-amber-400/50' : 'bg-slate-800'}`}
            >
              <span className="text-2xl">{medalOf(i)}</span>
              <Avatar k={r.key} size={30} />
              <span className="font-bold flex-1 text-left" style={{ color: colorOf(r.key) }}>{nameOf(r.key)}</span>
              <span className="text-sm text-violet-300 font-bold">{r.points}P</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-amber-200 mb-4 font-bold">
          🎉 {nameOf(top3[0].key)} 축하해요! 이번 달도 화이팅! 💪
        </p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-900 font-bold">확인 🎊</button>
      </div>
    </div>
  )
}

// 이름 클릭 시: 그 사람의 집안일 목록 + 담당 변경/완료/삭제/고정
function MemberChores({ memberKey, chores, dayIndexOf, today, onReassign, onToggle, onRemove, onToggleFixed, onAddFixed, onClose }) {
  // 고정 토글용 만료일(각 집안일마다) — 기본 7일 뒤
  const [fixUntil, setFixUntil] = useState({})
  // 고정 추가 폼
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPoints, setNewPoints] = useState(10)
  const [newUntil, setNewUntil] = useState(addDays(today, 6))

  const untilFor = (c) => fixUntil[c.id] || (c.fixed_until && c.fixed_until >= c.due_date ? c.fixed_until : addDays(c.due_date, 6))

  return (
    <div className="bg-slate-800/60 border border-indigo-500/40 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold flex items-center gap-2"><Avatar k={memberKey} size={22} /> {nameOf(memberKey)}의 집안일</h2>
        <button onClick={onClose} className="text-slate-400 text-sm">닫기 ✕</button>
      </div>

      {chores.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-3">맡은 집안일이 없어요. 아래 표/자동 로테이션·고정 추가로 배정해요.</p>
      ) : (
        <ul className="space-y-2">
          {chores.map((c) => (
            <li key={c.id} className={`rounded-xl p-3 ${c.fixed ? 'bg-violet-900/40 border border-violet-500/40' : 'bg-slate-900'}`}>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => onToggle(c)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500' : 'border-2 border-slate-500'}`}
                >
                  {c.done && <span className="text-emerald-950 text-sm">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${c.done ? 'line-through text-slate-500' : ''}`}>
                  {c.fixed && <span className="text-violet-300 mr-1">📌</span>}
                  {DAY_LABELS[dayIndexOf(c.due_date)] || ''}요일 · {c.title}
                </span>
                <span className="text-xs text-slate-400">+{c.points}P</span>
                <button onClick={() => onRemove(c.id)} className="text-slate-500 text-sm ml-1" aria-label="삭제">🗑</button>
              </div>

              {/* 고정 토글 + 만료일 */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {c.fixed ? (
                  <>
                    <span className="text-[11px] text-violet-300">📌 고정됨 · {c.fixed_until || '무기한'}까지</span>
                    <button onClick={() => onToggleFixed(c)} className="text-[11px] bg-slate-700 px-2 py-1 rounded-lg text-slate-300">고정 해제</button>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-500">📌 고정(로테이션 제외):</span>
                    <input
                      type="date"
                      value={untilFor(c)}
                      min={c.due_date}
                      onChange={(e) => setFixUntil((m) => ({ ...m, [c.id]: e.target.value }))}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-[11px]"
                    />
                    <button onClick={() => onToggleFixed(c, untilFor(c))} className="text-[11px] bg-violet-600 px-2 py-1 rounded-lg font-bold">까지 고정</button>
                  </>
                )}
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

      {/* 고정 집안일 추가 */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} className="w-full py-2 rounded-xl bg-violet-600/80 text-sm font-bold">📌 고정 집안일 추가</button>
        ) : (
          <div className="bg-slate-900 rounded-xl p-3 space-y-2">
            <p className="text-xs text-violet-300 font-bold">📌 {nameOf(memberKey)}에게 고정 배정 (오늘 ~ 만료일 매일)</p>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="집안일 이름 (예: 강아지 산책)"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-400">포인트</label>
              <input type="number" value={newPoints} min={1} onChange={(e) => setNewPoints(+e.target.value)} className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm" />
              <label className="text-[11px] text-slate-400 ml-1">만료일</label>
              <input type="date" value={newUntil} min={today} onChange={(e) => setNewUntil(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!newTitle.trim()) return
                  onAddFixed({ assigneeKey: memberKey, title: newTitle.trim(), points: newPoints, untilDate: newUntil })
                  setNewTitle(''); setShowAdd(false)
                }}
                className="flex-1 py-2 rounded-lg bg-violet-600 text-sm font-bold"
              >
                추가
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-slate-700 text-sm">취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
