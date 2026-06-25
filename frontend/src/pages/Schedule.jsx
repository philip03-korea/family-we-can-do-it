import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { FAMILY } from '../data/family'
import { loadSchedule, saveSchedule, defaultDoc } from '../lib/schedule'
import { getPushEnabled, enablePush } from '../lib/push'
import {
  SCHED_MEMBER,
  todayISO,
  getDayProgress,
  setTaskStatus,
  clearTask,
  awardDayComplete,
} from '../lib/scheduleProgress'
import {
  TYPES,
  TYPE_KEYS,
  DAYS_KO,
  LEGEND_KEYS,
  EMOJI_LIST,
  ck,
  cloneData,
  cloneCust,
  computeSpans,
  findBlock,
  nextTime,
  durText,
  cellDisp,
  computeDayTasks,
  todayColIndex,
} from '../data/schedule'

const nameOf = (k) => FAMILY.find((f) => f.key === k)?.name || k

// 하루 완료 보너스 포인트
const POINTS_ALL_DONE = 20
const POINTS_PARTIAL = 10

// 항목 시작 시각("16:00")을 오늘의 Date 로
function slotDateToday(slot) {
  const [h, m] = slot.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function Schedule() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const myKey = profile?.member_key

  const [data, setData] = useState([])
  const [cust, setCust] = useState({})
  const [memo, setMemo] = useState('')
  const [updatedBy, setUpdatedBy] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  const [manualMode, setManualMode] = useState(false)
  const [anchor, setAnchor] = useState(null) // { col, row } — 편집 패널 대상
  const [iconTarget, setIconTarget] = useState('block') // 'block' | row(number)
  const [undoStack, setUndoStack] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  // 오늘의 할 일 / 완료·미루기
  const day = todayISO()
  const todayCol = todayColIndex()
  const [progress, setProgress] = useState({}) // { slot: 'done' | 'postponed' }
  const [celebrate, setCelebrate] = useState(false)
  const [notifOn, setNotifOn] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')

  const hydrated = useRef(false)
  const saveTimer = useRef(null)
  const reminderTimers = useRef([])
  const firedSlots = useRef(new Set())

  // ── 불러오기 ──────────────────────────────────────
  async function refresh() {
    try {
      const doc = await loadSchedule()
      const d = doc || defaultDoc()
      setData(d.data)
      setCust(d.cust)
      setMemo(d.memo)
      setUpdatedBy(d.updatedBy || null)
      setUpdatedAt(d.updatedAt || null)
      setLoadErr('')
      getDayProgress(day).then(setProgress).catch(() => {})
      // 문서가 아직 없으면(처음) 기본 시간표를 한 번 저장해 가족과 공유
      if (!doc) {
        hydrated.current = true
        try {
          await saveSchedule(d, myKey)
        } catch {
          /* 저장 실패는 autosave 에서 다시 시도 */
        }
      }
    } catch (e) {
      setLoadErr(friendly(e))
      const d = defaultDoc()
      setData(d.data)
      setCust(d.cust)
      setMemo(d.memo)
    } finally {
      setLoading(false)
      // 다음 렌더부터 autosave 허용
      setTimeout(() => {
        hydrated.current = true
      }, 0)
    }
  }

  useEffect(() => {
    refresh()
    // 다른 가족이 수정했을 수 있으니 창에 다시 들어오면 새로고침
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 자동 저장 (가족 공유) ─────────────────────────
  useEffect(() => {
    if (!hydrated.current || loading) return
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await saveSchedule({ data, cust, memo }, myKey)
        setUpdatedBy(myKey)
        setUpdatedAt(new Date().toISOString())
        setSaveState('saved')
      } catch (e) {
        setLoadErr(friendly(e))
        setSaveState('error')
      }
    }, 700)
    return () => saveTimer.current && clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, cust, memo])

  function friendly(e) {
    const m = e?.message || ''
    if (/family_schedule|42P01|schema cache|exist/i.test(m))
      return '계획표 테이블이 아직 없어요. database/step11_schedule.sql 을 먼저 실행해 주세요.'
    if (/row-level security|rls|permission/i.test(m)) return '권한 오류 — 로그인 상태를 확인해 주세요.'
    return m || '오류'
  }

  // ── 편집 헬퍼 ─────────────────────────────────────
  function snapshot() {
    setUndoStack((s) => {
      const next = [...s, { data: cloneData(data), cust: cloneCust(cust) }]
      return next.length > 40 ? next.slice(next.length - 40) : next
    })
  }

  function undo() {
    setUndoStack((s) => {
      if (!s.length) return s
      const prev = s[s.length - 1]
      setData(prev.data)
      setCust(prev.cust)
      return s.slice(0, -1)
    })
  }

  // Ctrl/Cmd+Z 되돌리기
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  const spans = useMemo(() => computeSpans(data, manualMode), [data, manualMode])
  const block = useMemo(
    () => (anchor ? findBlock(data, anchor.col, anchor.row, manualMode) : null),
    [anchor, data, manualMode]
  )

  function openPanel(col, row) {
    setAnchor({ col, row })
    setIconTarget('block')
  }
  function closePanel() {
    setAnchor(null)
  }

  function clearCustAt(obj, r, c) {
    const k = ck(r, c)
    if (obj[k]) delete obj[k]
  }

  // 전체 블록 활동 변경
  function changeBlock(code) {
    if (!block) return
    snapshot()
    const nd = cloneData(data)
    const nc = cloneCust(cust)
    for (let r = block.startRow; r <= block.endRow; r++) {
      nd[r][block.col + 1] = code
      clearCustAt(nc, r, block.col)
    }
    setData(nd)
    setCust(nc)
    setAnchor({ col: block.col, row: block.startRow })
  }

  // 30분 슬롯 하나만 활동 변경
  function changeSlot(row, code) {
    if (!block) return
    snapshot()
    const nd = cloneData(data)
    const nc = cloneCust(cust)
    nd[row][block.col + 1] = code
    clearCustAt(nc, row, block.col)
    setData(nd)
    setCust(nc)
    setAnchor({ col: block.col, row })
  }

  // 전체 블록 텍스트
  function applyBlockText(txt) {
    if (!block) return
    snapshot()
    const nc = cloneCust(cust)
    for (let r = block.startRow; r <= block.endRow; r++) {
      const k = ck(r, block.col)
      nc[k] = { ...(nc[k] || {}), text: txt }
    }
    setCust(nc)
  }

  // 아이콘 적용 (전체 블록 또는 특정 슬롯)
  function applyIcon(em) {
    if (!block) return
    snapshot()
    const nc = cloneCust(cust)
    if (iconTarget === 'block') {
      for (let r = block.startRow; r <= block.endRow; r++) {
        const k = ck(r, block.col)
        nc[k] = { ...(nc[k] || {}), icon: em }
      }
    } else {
      const k = ck(iconTarget, block.col)
      nc[k] = { ...(nc[k] || {}), icon: em }
    }
    setCust(nc)
  }

  // 슬롯 텍스트 직접 수정
  function setSlotText(row, txt) {
    const nc = cloneCust(cust)
    const k = ck(row, block.col)
    nc[k] = { ...(nc[k] || {}), text: txt }
    setCust(nc)
  }

  function addRow() {
    const last = data[data.length - 1]?.[0] || '0:00'
    const [h, m] = last.split(':').map(Number)
    const nm = m === 0 ? 30 : 0
    const nh = nm === 30 ? h : (h + 1) % 24
    const nt = `${nh}:${nm === 0 ? '00' : '30'}`
    snapshot()
    setData([...cloneData(data), [nt, '_', '_', '_', '_', '_', '_', '_']])
  }

  // ── 오늘의 할 일 ──────────────────────────────────
  const tasks = useMemo(() => computeDayTasks(data, cust, todayCol), [data, cust, todayCol])
  const doneCount = tasks.filter((t) => progress[t.slot] === 'done').length
  const resolvedCount = tasks.filter((t) => progress[t.slot]).length
  const allResolved = tasks.length > 0 && resolvedCount === tasks.length
  const allDone = tasks.length > 0 && doneCount === tasks.length

  async function markTask(slot, status) {
    const prev = progress[slot]
    setProgress((p) => ({ ...p, [slot]: status }))
    try {
      await setTaskStatus(day, slot, status)
    } catch (e) {
      setProgress((p) => ({ ...p, [slot]: prev })) // 실패 시 롤백
      setNotifMsg(friendly(e))
    }
  }
  async function undoTask(slot) {
    const prev = progress[slot]
    setProgress((p) => {
      const n = { ...p }
      delete n[slot]
      return n
    })
    try {
      await clearTask(day, slot)
    } catch (e) {
      setProgress((p) => ({ ...p, [slot]: prev }))
      setNotifMsg(friendly(e))
    }
  }
  async function finishDay() {
    if (!allResolved) return
    try {
      await awardDayComplete(day, allDone ? POINTS_ALL_DONE : POINTS_PARTIAL)
    } catch {
      /* 포인트 적립 실패는 치명적이지 않음 */
    }
    setCelebrate(true)
    try {
      navigator.vibrate?.([120, 60, 120, 60, 240])
    } catch {
      /* 진동 미지원 무시 */
    }
  }

  // ── 시간대별 알림 (앱이 열려 있을 때 로컬 알림 + 진동) ──
  useEffect(() => {
    reminderTimers.current.forEach(clearTimeout)
    reminderTimers.current = []
    if (loading) return
    const now = Date.now()
    for (const t of tasks) {
      if (progress[t.slot]) continue // 이미 완료/미루기면 알림 안 함
      const at = slotDateToday(t.slot).getTime()
      const diff = at - now
      if (diff <= 0 || diff > 24 * 3600 * 1000) continue
      const id = setTimeout(() => {
        if (firedSlots.current.has(t.slot)) return
        firedSlots.current.add(t.slot)
        try {
          navigator.vibrate?.([200, 100, 200])
        } catch {
          /* noop */
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`⏰ ${t.startTime} ${t.icon || ''} ${t.label || '일정'}`.trim(), {
              body: `${t.label || '일정'} 할 시간이에요! 끝나면 완료 체크 ✅`,
              icon: '/icon-192.png',
              tag: `sched-${t.slot}`,
            })
          } catch {
            /* noop */
          }
        }
      }, diff)
      reminderTimers.current.push(id)
    }
    return () => {
      reminderTimers.current.forEach(clearTimeout)
      reminderTimers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, progress, loading])

  // 푸시(알림) 켜짐 여부 확인
  useEffect(() => {
    getPushEnabled().then(setNotifOn).catch(() => {})
  }, [])

  async function toggleNotif() {
    try {
      if (!notifOn) {
        await enablePush({ userId: profile?.id, memberKey: myKey })
        setNotifOn(true)
        setNotifMsg('🔔 알림을 켰어요. 시간대별로 잊지 않게 알려드릴게요!')
      } else {
        setNotifMsg('알림은 대시보드 ⚙️ 설정에서 끌 수 있어요.')
      }
    } catch (e) {
      setNotifMsg(e?.message || '알림을 켜지 못했어요.')
    }
  }

  // ── 렌더 ──────────────────────────────────────────
  const canEdit = !!myKey
  const blockText = block ? cellDisp(data, cust, block.startRow, block.col).text : ''

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">🗓️ 하람 주간 계획표</h1>
      </header>
      <p className="text-xs text-slate-400 mb-3">
        가족 모두가 함께 보는 시간표예요. 칸을 탭하면 편집할 수 있고, 수정 내용은 자동으로 가족 전체에게 저장돼요.
      </p>

      {/* 상태/도구 줄 */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="text-slate-500">
          {saveState === 'saving' && '⏳ 저장 중…'}
          {saveState === 'saved' && '✅ 저장됨 (가족 공유)'}
          {saveState === 'error' && '⚠️ 저장 실패'}
          {saveState === 'idle' && updatedBy && `최근 수정: ${nameOf(updatedBy)} · ${timeAgo(updatedAt)}`}
        </span>
        <button onClick={refresh} className="ml-auto text-slate-400 underline">새로고침</button>
      </div>

      {loadErr && <p className="text-xs text-amber-300 mb-3">⚠️ {loadErr}</p>}

      {/* ── 오늘의 할 일 ── */}
      {!loading && (
        <div className="bg-slate-800/70 border border-indigo-500/40 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-bold">✅ 오늘의 할 일</h2>
            <span className="text-xs text-slate-400">
              {day.slice(5).replace('-', '/')} ({DAYS_KO[todayCol]})
            </span>
            <button
              onClick={toggleNotif}
              className={`ml-auto text-xs px-2.5 py-1 rounded-full font-bold ${notifOn ? 'bg-emerald-600/80 text-white' : 'bg-slate-700 text-slate-200'}`}
            >
              {notifOn ? '🔔 알림 켜짐' : '🔔 알림 켜기'}
            </button>
          </div>

          {notifMsg && <p className="text-[11px] text-amber-300 mb-2">{notifMsg}</p>}

          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">오늘은 체크할 일정이 없어요. 푹 쉬어요 😴</p>
          ) : (
            <>
              {/* 진행률 */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>완료 {doneCount} · 미룸 {resolvedCount - doneCount} / 총 {tasks.length}</span>
                  <span>{Math.round((resolvedCount / tasks.length) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(resolvedCount / tasks.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* 항목 목록 */}
              <ul className="space-y-1.5">
                {tasks.map((t) => {
                  const st = progress[t.slot]
                  return (
                    <li
                      key={t.slot}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                        st === 'done'
                          ? 'bg-emerald-900/30 border-emerald-600/40'
                          : st === 'postponed'
                          ? 'bg-slate-700/40 border-slate-600'
                          : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <span className="text-base shrink-0">{t.icon || '•'}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-bold ${st === 'postponed' ? 'text-slate-400 line-through' : ''}`}>
                          {t.label || '일정'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.startTime} ~ {t.endTime}
                        </div>
                      </div>
                      {st ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs font-bold ${st === 'done' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {st === 'done' ? '완료 ✅' : '미룸 ⏭'}
                          </span>
                          <button onClick={() => undoTask(t.slot)} className="text-[11px] text-slate-400 underline">
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => markTask(t.slot, 'done')}
                            className="text-xs font-bold bg-emerald-600 px-2.5 py-1.5 rounded-lg"
                          >
                            완료
                          </button>
                          <button
                            onClick={() => markTask(t.slot, 'postponed')}
                            className="text-xs font-bold bg-slate-600 px-2.5 py-1.5 rounded-lg"
                          >
                            미루기
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* 하루 마감 */}
              <button
                onClick={finishDay}
                disabled={!allResolved}
                className={`w-full mt-3 py-2.5 rounded-xl font-bold text-sm ${
                  allResolved ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-500'
                }`}
              >
                {allResolved ? '🌙 하루 마감하기' : `아직 ${tasks.length - resolvedCount}개 남았어요`}
              </button>
              <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                모든 일정을 완료/미루기로 체크해야 하루를 마감할 수 있어요
                {allDone ? ` · 전부 완료 시 ${POINTS_ALL_DONE}P 🎉` : ''}
              </p>
            </>
          )}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={undo}
            disabled={!undoStack.length}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${undoStack.length ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-600'}`}
          >
            ⟵ 되돌리기
          </button>
          <button
            onClick={() => setManualMode((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${manualMode ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-100'}`}
          >
            {manualMode ? '자동 병합 🔒' : '수동 편집 🔓'}
          </button>
          <button onClick={addRow} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 text-slate-100">
            ＋ 행 추가
          </button>
        </div>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {LEGEND_KEYS.map((k) => (
          <span key={k} className="inline-flex items-center gap-1 text-[11px] text-slate-300">
            <i className="inline-block w-3 h-3 rounded-sm" style={{ background: TYPES[k].color }} />
            {TYPES[k].lb}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm text-center py-10">불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-lg">
          <table className="border-collapse w-full text-slate-900" style={{ minWidth: 360 }}>
            <thead>
              <tr>
                <th className="bg-slate-100 text-slate-500 text-[11px] font-bold p-1 sticky left-0 z-10">시간</th>
                {DAYS_KO.map((d, i) => (
                  <th
                    key={d}
                    className={`text-[11px] font-bold p-1 ${i === 5 ? 'text-blue-600' : i === 6 ? 'text-rose-600' : 'text-slate-600'} bg-slate-100`}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((rowArr, r) => (
                <tr key={r}>
                  <td className="bg-slate-50 text-slate-500 text-[10px] font-bold text-center px-1 whitespace-nowrap sticky left-0 z-10">
                    {rowArr[0]}
                  </td>
                  {Array.from({ length: 7 }).map((_, c) => {
                    const sp = spans[c][r]
                    if (sp === 0) return null
                    const disp = cellDisp(data, cust, r, c)
                    return (
                      <td key={c} rowSpan={sp > 1 ? sp : undefined} className="p-0 align-middle">
                        <button
                          onClick={() => openPanel(c, r)}
                          className="w-full h-full min-h-[34px] flex flex-col items-center justify-center px-0.5 py-1 leading-tight active:brightness-90"
                          style={{
                            backgroundColor: disp.color,
                            border: disp.dashed
                              ? '1.5px dashed #cbd5e1'
                              : disp.empty
                              ? '1px dashed #e2e8f0'
                              : '1px solid rgba(255,255,255,0.4)',
                          }}
                        >
                          {disp.icon && <span className="text-sm leading-none">{disp.icon}</span>}
                          {disp.text && <span className="text-[10px] font-bold text-slate-700">{disp.text}</span>}
                          {sp > 1 && !manualMode && <span className="text-[9px] text-slate-500 mt-0.5">{durText(sp)}</span>}
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

      <p className="text-[11px] text-slate-500 mt-2">
        칸을 탭하면 편집 패널이 열려요 · 수동 편집 모드에서는 30분 칸을 하나씩 수정할 수 있어요 · Ctrl+Z 되돌리기
      </p>

      {/* 메모 */}
      <div className="mt-5">
        <h2 className="text-sm font-bold mb-1">📌 메모</h2>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모를 입력하세요…"
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm"
        />
      </div>

      {/* ── 편집 패널 (바텀시트) ── */}
      {block && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={closePanel} />
          <div className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto bg-slate-900 border-t border-slate-700 rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start gap-2 mb-3">
              <div className="min-w-0">
                <div className="font-bold">{DAYS_KO[block.col]}요일</div>
                <div className="text-xs text-slate-400">
                  {data[block.startRow][0]} ~ {nextTime(data, block.endRow)}
                  {!manualMode && `  (${durText(block.endRow - block.startRow + 1)})`}
                </div>
                <div className="text-sm mt-0.5">
                  {(() => {
                    const d = cellDisp(data, cust, block.startRow, block.col)
                    return `${d.icon ? d.icon + ' ' : ''}${d.text || '빈 칸'}`
                  })()}
                </div>
              </div>
              <button onClick={closePanel} className="ml-auto text-slate-400 text-sm">✕ 닫기</button>
            </div>

            {/* 활동 선택 (전체 블록) */}
            <div className="text-xs font-bold text-slate-400 mb-1.5">활동 선택 (전체 블록 변경)</div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {TYPE_KEYS.map((k) => {
                const t = TYPES[k]
                const active = k === block.code
                return (
                  <button
                    key={k}
                    onClick={() => changeBlock(k)}
                    className={`rounded-lg py-1.5 flex flex-col items-center ${active ? 'ring-2 ring-indigo-400' : ''}`}
                    style={{ backgroundColor: t.color, color: '#334155' }}
                  >
                    <span className="text-base leading-none">{t.em || '○'}</span>
                    <span className="text-[9px] font-bold mt-0.5">{t.lb || '비우기'}</span>
                  </button>
                )
              })}
            </div>

            {/* 텍스트 직접 입력 (전체 블록) */}
            <div className="text-xs font-bold text-slate-400 mb-1.5">텍스트 직접 입력 (전체 블록)</div>
            <BlockTextInput key={`${block.col}-${block.startRow}-${block.code}`} initial={blockText} onApply={applyBlockText} />

            {/* 아이콘 선택 */}
            <div className="text-xs font-bold text-slate-400 mb-1.5 mt-4 flex items-center gap-2">
              아이콘 선택
              <span className="text-[10px] font-normal text-slate-500">
                대상: {iconTarget === 'block' ? '전체 블록' : `${data[iconTarget][0]} 칸`}
              </span>
              {iconTarget !== 'block' && (
                <button onClick={() => setIconTarget('block')} className="text-[10px] text-indigo-400 underline">
                  전체로
                </button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1 mb-4 max-h-32 overflow-y-auto pr-1">
              {EMOJI_LIST.map(({ em, lb }) => (
                <button
                  key={em + lb}
                  title={lb}
                  onClick={() => applyIcon(em)}
                  className="rounded-lg py-1.5 bg-slate-800 hover:bg-slate-700 flex flex-col items-center"
                >
                  <span className="text-base leading-none">{em}</span>
                  <span className="text-[8px] text-slate-400 mt-0.5">{lb}</span>
                </button>
              ))}
            </div>

            {/* 30분 단위 개별 수정 */}
            <div className="text-xs font-bold text-slate-400 mb-1.5">30분 단위 개별 수정</div>
            <div className="space-y-2">
              {Array.from({ length: block.endRow - block.startRow + 1 }).map((_, i) => {
                const r = block.startRow + i
                const d = cellDisp(data, cust, r, block.col)
                return (
                  <div key={r} className="bg-slate-800/70 rounded-xl p-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-slate-400 w-12 shrink-0">{data[r][0]}</span>
                      <button
                        onClick={() => setIconTarget(r)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconTarget === r ? 'ring-2 ring-indigo-400' : ''} bg-slate-700`}
                        title="이 칸 아이콘 선택 (위 아이콘 목록에서 고르기)"
                      >
                        {d.icon || '🙂'}
                      </button>
                      <SlotTextInput key={`${r}-${d.text}`} initial={d.text} onChange={(v) => setSlotText(r, v)} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {TYPE_KEYS.map((tk) => {
                        const tt = TYPES[tk]
                        const active = tk === data[r][block.col + 1]
                        return (
                          <button
                            key={tk}
                            onClick={() => changeSlot(r, tk)}
                            title={tt.lb || '비우기'}
                            className={`w-6 h-6 rounded text-xs flex items-center justify-center ${active ? 'ring-2 ring-indigo-500' : ''}`}
                            style={{ backgroundColor: tt.color, color: '#334155' }}
                          >
                            {tt.em || (tk === '_' ? '○' : '—')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* 하루 완료 축하 */}
      {celebrate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6" onClick={() => setCelebrate(false)}>
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-7 max-w-xs text-center">
            <div className="text-5xl mb-2">{allDone ? '🎉' : '👏'}</div>
            <h2 className="text-xl font-bold mb-1">{allDone ? '오늘 일정 전부 완료!' : '오늘 하루 마감 완료!'}</h2>
            <p className="text-sm text-slate-300 mb-1">
              {allDone
                ? `대단해요 하람! 보너스 ${POINTS_ALL_DONE}P 적립 🪙`
                : `수고했어요! 보너스 ${POINTS_PARTIAL}P 적립 🪙 (다음엔 전부 완료 도전!)`}
            </p>
            <p className="text-xs text-slate-500 mb-4">내일도 차근차근 해봐요 💪</p>
            <button onClick={() => setCelebrate(false)} className="w-full py-2.5 rounded-xl bg-indigo-600 font-bold">
              좋아요!
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// 전체 블록 텍스트 입력 (적용 버튼)
function BlockTextInput({ initial, onApply }) {
  const [v, setV] = useState(initial || '')
  return (
    <div className="flex gap-2">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="원하는 텍스트 입력…"
        className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none text-sm"
      />
      <button onClick={() => onApply(v)} className="px-3 py-2 rounded-lg bg-indigo-600 text-sm font-bold shrink-0">
        전체 적용
      </button>
    </div>
  )
}

// 슬롯 텍스트 입력 (입력 끝나면 반영)
function SlotTextInput({ initial, onChange }) {
  const [v, setV] = useState(initial || '')
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== (initial || '') && onChange(v)}
      placeholder="텍스트…"
      className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 outline-none text-xs"
    />
  )
}
