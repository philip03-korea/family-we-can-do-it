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

/** 가족별 주간 목표 */
export async function getGoals() {
  const { data, error } = await supabase.from('chore_goals').select('*')
  if (error) throw error
  const map = {}
  for (const g of data || []) map[g.member_key] = g.weekly_goal
  return map
}

/**
 * 자동 로테이션 — 그 주 집안일을 템플릿으로 새로 생성.
 * 기존 그 주 데이터는 지우고 다시 만든다(완료 기록도 초기화).
 */
export async function generateRotation(weekStart) {
  await supabase.from('chores').delete().eq('week_start', weekStart)
  const rows = []
  for (const c of ROTATION) {
    c.days.forEach((dayIdx, occurrence) => {
      const assignee = c.pool[occurrence % c.pool.length]
      rows.push({
        week_start: weekStart,
        due_date: addDays(weekStart, dayIdx),
        title: c.title,
        category: c.category,
        points: c.points,
        assignee_key: assignee,
        done: false,
      })
    })
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
