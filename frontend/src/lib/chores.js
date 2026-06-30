import { supabase } from './supabase'
import { ROTATION } from '../data/chores'

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
 * - rotate: pool 을 (요일순서 + 주차)에 따라 순환해 매주 담당이 바뀜
 * - perMember: members 각자 본인 몫(같은 날 여러 명)
 * - biweekly: 2주에 1번만 생성
 * 기존 그 주 데이터는 지우고 다시 만든다(완료 기록도 초기화).
 */
export async function generateRotation(weekStart) {
  await supabase.from('chores').delete().eq('week_start', weekStart)
  const wIdx = weekIndex(weekStart)
  const mk = (dayIdx, c, assignee) => ({
    week_start: weekStart,
    due_date: addDays(weekStart, dayIdx),
    title: c.title,
    category: c.category,
    points: c.points,
    assignee_key: assignee,
    done: false,
  })

  const rows = []
  for (const c of ROTATION) {
    if (c.biweekly && wIdx % 2 !== 0) continue
    if (c.type === 'perMember') {
      for (const dayIdx of c.days) for (const m of c.members) rows.push(mk(dayIdx, c, m))
    } else {
      c.days.forEach((dayIdx, occ) => {
        const assignee = c.pool[(occ + wIdx) % c.pool.length]
        rows.push(mk(dayIdx, c, assignee))
      })
    }
  }
  const { error } = await supabase.from('chores').insert(rows)
  if (error) throw error
  return rows.length
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
