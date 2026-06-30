import { supabase } from './supabase'

// ============================================================
// 하람 오늘의 할 일 — 완료/미루기 진행상황 (날짜별, 가족 공유)
// schedule_progress 테이블에 (member_key, day, slot) 단위로 저장한다.
// ============================================================

export const SCHED_MEMBER = 'haram' // 하람 계획표

// 로컬(기기) 기준 오늘 날짜 YYYY-MM-DD
export function todayISO(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 해당 날짜의 진행상황 맵 { slot: 'done' | 'postponed' } */
export async function getDayProgress(day, member = SCHED_MEMBER) {
  const { data, error } = await supabase
    .from('schedule_progress')
    .select('slot, status')
    .eq('member_key', member)
    .eq('day', day)
  if (error) throw error
  const map = {}
  for (const r of data || []) map[r.slot] = r.status
  return map
}

/** 한 항목 상태 설정 (done | postponed) */
export async function setTaskStatus(day, slot, status, member = SCHED_MEMBER) {
  const { error } = await supabase.from('schedule_progress').upsert(
    { member_key: member, day, slot, status, updated_at: new Date().toISOString() },
    { onConflict: 'member_key,day,slot' }
  )
  if (error) throw error
}

/** 한 항목 상태 해제 (체크 취소 → 다시 대기) */
export async function clearTask(day, slot, member = SCHED_MEMBER) {
  const { error } = await supabase
    .from('schedule_progress')
    .delete()
    .eq('member_key', member)
    .eq('day', day)
    .eq('slot', slot)
  if (error) throw error
}

/** 하루 완료 보너스 포인트 (같은 날 한 번만 — ref 중복은 무시) */
export async function awardDayComplete(day, points, member = SCHED_MEMBER) {
  const { error } = await supabase.from('point_ledger').insert({
    member_key: member,
    delta: points,
    reason: 'schedule_day',
    ref: `schedule_day:${member}:${day}`,
  })
  if (error && !/duplicate|unique/i.test(error.message || '')) throw error
}
