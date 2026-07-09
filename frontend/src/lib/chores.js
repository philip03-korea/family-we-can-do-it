import { supabase } from './supabase'
import { ROTATION, FIXED_RULES, FIXED_TITLES } from '../data/chores'
import { FAMILY } from '../data/family'

// ============================================================
// 집안일 데이터 접근 + 자동 로테이션 로직
// ============================================================

// 이번 주 월요일(로컬) → 'YYYY-MM-DD'
export function weekStartMonday(base = new Date()) {
  const d = new Date(base)
  const dow = (d.getDay() + 6) % 7 // 월=0 ... 일=6
  d.setDate(d.getDate() - dow)
  return ymd(d)
}

export function ymd(d) {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export function addDays(ymdStr, n) {
  const d = new Date(ymdStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return ymd(d)
}

export function todayYmd() {
  return ymd(new Date())
}

/** 그 주의 모든 집안일 */
export async function listChores(weekStart) {
  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .eq('week_start', weekStart)
    .order('due_date')
    .order('id')
  if (error) throw error
  return data || []
}

/**
 * 밀린(지난 날·이전 주 포함) 미완료 집안일.
 * 주차와 무관하게 due_date < 기준일이면서 아직 안 한 것을 모두 가져온다.
 * → "오늘 못 했어도 언제든 다시 완료 체크" 용.
 */
export async function listOverdue(assigneeKey, before = todayYmd()) {
  let q = supabase
    .from('chores')
    .select('*')
    .eq('done', false)
    .lt('due_date', before)
    .order('due_date')
  if (assigneeKey) q = q.eq('assignee_key', assigneeKey)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

/** 가족별 주간 목표 */
export async function getGoals() {
  const { data, error } = await supabase.from('chore_goals').select('*')
  if (error) throw error
  const map = {}
  for (const g of data || []) map[g.member_key] = g.weekly_goal
  return map
}

// 기준 월요일(2026-01-05)로부터의 주차 인덱스 — 로테이션 시프트/격주 판단용
function weekIndex(weekStart) {
  const ref = new Date('2026-01-05T00:00:00')
  return Math.round((new Date(weekStart + 'T00:00:00') - ref) / (7 * 86400000))
}

/**
 * 배정 계획 생성 코어 — 여러 주(weekStarts)에 대해 공평하게 배정.
 * - FIXED_RULES(분리수거 수·일=하울·하람, 안방화장실=아빠)를 항상 고정(fixed)으로 먼저 깔고,
 *   그 부하를 반영한 뒤 나머지를 포인트 기준 공평 분배(현재 부하 최소인 사람 우선).
 * - keep: 보존할 기존 고정 집안일(부하·중복 방지 기준).
 * - inMonth(due): 이 날짜를 포함할지 (주간=항상 true, 월간=해당 월만).
 * - fixedUntil: 규칙 고정 행의 fixed_until 값.
 * 각 due 는 하나의 weekStart 에서만 생성되도록 inMonth 로 필터.
 */
function buildPlan({ weekStarts, keep, inMonth, fixedUntil }) {
  const memberKeys = FAMILY.map((f) => f.key)
  const load = {}
  for (const k of memberKeys) load[k] = 0
  for (const c of keep) if (load[c.assignee_key] != null) load[c.assignee_key] += c.points

  const covered = new Set(keep.map((c) => `${c.title}__${c.due_date}`))
  const rows = []
  const pushRow = (weekStart, due, tmpl, assignee, fixed) => {
    const key = `${tmpl.title}__${due}`
    if (covered.has(key)) return
    covered.add(key)
    rows.push({
      week_start: weekStart,
      due_date: due,
      title: tmpl.title,
      category: tmpl.category,
      points: tmpl.points,
      assignee_key: assignee,
      done: false,
      fixed: !!fixed,
      fixed_until: fixed ? fixedUntil : null,
    })
    if (load[assignee] != null) load[assignee] += tmpl.points
  }

  for (const weekStart of weekStarts) {
    const wIdx = weekIndex(weekStart)

    // 1) 고정 규칙 먼저 (부하 선반영)
    for (const fr of FIXED_RULES) {
      for (const [dayIdx, who] of Object.entries(fr.byDay)) {
        const due = addDays(weekStart, Number(dayIdx))
        if (!inMonth(due)) continue
        pushRow(weekStart, due, fr, who, true)
      }
    }

    // 2) 나머지 공평 분배
    for (const c of ROTATION) {
      if (c.biweekly && wIdx % 2 !== 0) continue
      if (c.type === 'perMember') {
        for (const dayIdx of c.days) {
          const due = addDays(weekStart, dayIdx)
          if (!inMonth(due)) continue
          for (const m of c.members) pushRow(weekStart, due, c, m, false)
        }
      } else {
        for (const dayIdx of c.days) {
          const due = addDays(weekStart, dayIdx)
          if (!inMonth(due)) continue
          const pool = c.pool
          const order = pool.map((_, i) => pool[(i + wIdx) % pool.length])
          let best = order[0]
          for (const m of order) if ((load[m] ?? Infinity) < (load[best] ?? Infinity)) best = m
          pushRow(weekStart, due, c, best, false)
        }
      }
    }
  }
  return rows
}

// 규칙 고정(FIXED_RULES) 제목은 재생성 시 항상 다시 깐다. 사용자가 손수 만든 고정은 보존.
function keepFixed(existing) {
  return existing.filter((c) => c.fixed && !FIXED_TITLES.includes(c.title) && (!c.fixed_until || c.fixed_until >= c.due_date))
}

async function insertChunks(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('chores').insert(rows.slice(i, i + 500))
    if (error) throw error
  }
}

/**
 * 자동 로테이션 (한 주) — 그 주를 템플릿으로 새로 생성.
 * 규칙 고정은 새로 깔고, 사용자 고정은 보존, 나머지는 공평 분배.
 */
export async function generateRotation(weekStart) {
  const existing = await listChores(weekStart)
  const kept = keepFixed(existing)
  const keptIds = new Set(kept.map((c) => c.id))
  const toDelete = existing.filter((c) => !keptIds.has(c.id)).map((c) => c.id)
  if (toDelete.length) await supabase.from('chores').delete().in('id', toDelete)

  const rows = buildPlan({
    weekStarts: [weekStart],
    keep: kept,
    inMonth: () => true,
    fixedUntil: addDays(weekStart, 6),
  })
  await insertChunks(rows)
  return rows.length
}

/**
 * 한 달치 자동 배정 — 그 달 전체를 미리 공평하게 짜준다.
 * 그 달에 걸치는 모든 주를 이어서 계산해 월 전체 부하가 공평해지도록 분배.
 * 규칙 고정(분리수거 수·일=하울·하람, 안방화장실=아빠)은 한 달 내내 고정으로 깔림.
 * month: 'YYYY-MM'
 */
export async function generateMonthRotation(month) {
  const first = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const last = ymd(new Date(y, m, 0)) // 그 달 마지막 날

  const { data: existing, error: e1 } = await supabase
    .from('chores')
    .select('*')
    .gte('due_date', first)
    .lte('due_date', last)
  if (e1) throw e1

  const kept = keepFixed(existing || [])
  const keptIds = new Set(kept.map((c) => c.id))
  const toDelete = (existing || []).filter((c) => !keptIds.has(c.id)).map((c) => c.id)
  for (let i = 0; i < toDelete.length; i += 500) {
    if (toDelete.length) await supabase.from('chores').delete().in('id', toDelete.slice(i, i + 500))
  }

  // 그 달에 걸치는 주(월요일)들
  const weekStarts = []
  let ws = weekStartMonday(new Date(first + 'T00:00:00'))
  const lastWs = weekStartMonday(new Date(last + 'T00:00:00'))
  while (ws <= lastWs) {
    weekStarts.push(ws)
    ws = addDays(ws, 7)
  }

  const inMonth = (due) => due >= first && due <= last
  const rows = buildPlan({ weekStarts, keep: kept, inMonth, fixedUntil: last })
  await insertChunks(rows)
  return rows.length
}

/** 한 달 전체 집안일 (달력 보기용) */
export async function listMonthChores(month) {
  const first = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const last = ymd(new Date(y, m, 0))
  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .gte('due_date', first)
    .lte('due_date', last)
    .order('due_date')
    .order('id')
  if (error) throw error
  return data || []
}

/**
 * 월별 점수 — 완료한 집안일 포인트를 사람별 합산 (경쟁·시상용).
 * 완료 시각(completed_at)이 그 달이면 그 달 점수로. (밀린 일을 이번 달에 하면 이번 달 점수)
 * completed_at 이 없으면 due_date 기준.
 * month: 'YYYY-MM' → { member_key: { points, count } }
 */
export async function getMonthScores(month) {
  const first = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const nextFirst = ymd(new Date(y, m, 1)) // 다음 달 1일
  const { data, error } = await supabase
    .from('chores')
    .select('assignee_key, points, completed_at, due_date')
    .eq('done', true)
    .or(
      `and(completed_at.gte.${first},completed_at.lt.${nextFirst}),and(completed_at.is.null,due_date.gte.${first},due_date.lt.${nextFirst})`,
    )
  if (error) throw error
  const by = {}
  for (const c of data || []) {
    const k = c.assignee_key || '미지정'
    by[k] ||= { points: 0, count: 0 }
    by[k].points += c.points
    by[k].count += 1
  }
  return by
}

/**
 * 고정 집안일 추가 — startDate~untilDate 매일 같은 담당으로 고정 생성.
 * 자동 로테이션에서 제외된다(fixed=true).
 */
export async function addFixedChore({ assigneeKey, title, points = 10, category = '고정', startDate = todayYmd(), untilDate }) {
  if (!untilDate || untilDate < startDate) untilDate = startDate
  const rows = []
  let d = startDate
  for (let i = 0; i < 366 && d <= untilDate; i++) {
    rows.push({
      week_start: weekStartMonday(new Date(d + 'T00:00:00')),
      due_date: d,
      title,
      category,
      points,
      assignee_key: assigneeKey,
      done: false,
      fixed: true,
      fixed_until: untilDate,
    })
    d = addDays(d, 1)
  }
  if (!rows.length) return 0
  const { error } = await supabase.from('chores').insert(rows)
  if (error) throw error
  return rows.length
}

/** 기존 집안일 고정/해제 (해제 시 fixed_until도 비움) */
export async function setChoreFixed(id, fixed, fixedUntil = null) {
  const { error } = await supabase
    .from('chores')
    .update({ fixed, fixed_until: fixed ? fixedUntil : null })
    .eq('id', id)
  if (error) throw error
}

/** 담당자 변경 (수동 지정) */
export async function assignChore(id, assigneeKey) {
  const { error } = await supabase.from('chores').update({ assignee_key: assigneeKey }).eq('id', id)
  if (error) throw error
}

/** 새 집안일 추가 (빈 칸에 배정할 때) */
export async function createChore({ weekStart, dueDate, title, category, points, assigneeKey }) {
  const { data, error } = await supabase.from('chores').insert({
    week_start: weekStart,
    due_date: dueDate,
    title,
    category: category || '기타',
    points: points || 10,
    assignee_key: assigneeKey,
    done: false,
  }).select()
  if (error) throw error
  return data?.[0]
}

/** 집안일 삭제 */
export async function deleteChore(id) {
  const { error } = await supabase.from('chores').delete().eq('id', id)
  if (error) throw error
}

/** 완료 체크 토글 */
export async function setChoreDone(id, done) {
  const { error } = await supabase
    .from('chores')
    .update({ done, completed_at: done ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

/** 집안일 목록으로 가족별 진행도(완료/전체 포인트) 계산 */
export function computeProgress(chores) {
  const by = {}
  for (const c of chores) {
    const k = c.assignee_key || '미지정'
    by[k] ||= { total: 0, done: 0, totalCount: 0, doneCount: 0 }
    by[k].total += c.points
    by[k].totalCount += 1
    if (c.done) {
      by[k].done += c.points
      by[k].doneCount += 1
    }
  }
  return by
}
