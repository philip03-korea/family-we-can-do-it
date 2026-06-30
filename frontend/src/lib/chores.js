import { supabase } from './supabase'
import { ROTATION } from '../data/chores'
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
 * 자동 로테이션 — 그 주 집안일을 템플릿으로 새로 생성.
 * - 고정(fixed=true)은 보존하고 제외 — 담당이 안 바뀐다.
 * - 나머지는 포인트 합계 기준으로 **공평하게** 분배(현재 부하 최소인 사람에게 우선).
 * - perMember: members 각자 본인 몫(같은 날 여러 명) — 고정 부하에 합산.
 * - biweekly: 2주에 1번만 생성.
 * 고정 외 기존 데이터는 지우고 다시 만든다(완료 기록도 초기화).
 */
export async function generateRotation(weekStart) {
  // 1) 이번 주 기존 집안일 로드 → 유효 고정만 보존, 나머지 삭제
  const existing = await listChores(weekStart)
  const kept = existing.filter((c) => c.fixed && (!c.fixed_until || c.fixed_until >= c.due_date))
  const keptIds = new Set(kept.map((c) => c.id))
  const toDelete = existing.filter((c) => !keptIds.has(c.id)).map((c) => c.id)
  if (toDelete.length) await supabase.from('chores').delete().in('id', toDelete)

  const wIdx = weekIndex(weekStart)
  const memberKeys = FAMILY.map((f) => f.key)

  // 2) 공평 분배 기준이 되는 현재 부하(고정 포함)
  const load = {}
  for (const k of memberKeys) load[k] = 0
  for (const c of kept) if (load[c.assignee_key] != null) load[c.assignee_key] += c.points

  // 고정으로 이미 덮인 (집안일·날짜) 조합 — 템플릿에서 제외
  const coveredFixed = new Set(kept.map((c) => `${c.title}__${c.due_date}`))

  const mk = (dueDate, c, assignee) => ({
    week_start: weekStart,
    due_date: dueDate,
    title: c.title,
    category: c.category,
    points: c.points,
    assignee_key: assignee,
    done: false,
    fixed: false,
    fixed_until: null,
  })

  const rows = []
  for (const c of ROTATION) {
    if (c.biweekly && wIdx % 2 !== 0) continue
    if (c.type === 'perMember') {
      for (const dayIdx of c.days) {
        const due = addDays(weekStart, dayIdx)
        for (const m of c.members) {
          if (coveredFixed.has(`${c.title}__${due}`)) continue
          rows.push(mk(due, c, m))
          if (load[m] != null) load[m] += c.points
        }
      }
    } else {
      for (const dayIdx of c.days) {
        const due = addDays(weekStart, dayIdx)
        if (coveredFixed.has(`${c.title}__${due}`)) continue
        // 공평: pool 중 현재 부하가 가장 적은 사람. 동률은 주차에 따라 회전.
        const pool = c.pool
        const order = pool.map((_, i) => pool[(i + wIdx) % pool.length])
        let best = order[0]
        for (const m of order) if ((load[m] ?? Infinity) < (load[best] ?? Infinity)) best = m
        rows.push(mk(due, c, best))
        if (load[best] != null) load[best] += c.points
      }
    }
  }
  if (rows.length) {
    const { error } = await supabase.from('chores').insert(rows)
    if (error) throw error
  }
  return rows.length
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
