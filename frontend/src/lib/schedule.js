import { supabase } from './supabase'
import { DEFAULT_DATA, cloneData } from '../data/schedule'

// ============================================================
// 가족 공유 주간 계획표 — Supabase 저장/불러오기
// family_schedule 테이블에 가족당 하나의 문서(JSONB)를 공유한다.
// (localStorage 가 아니라 DB라서 가족 모두 같은 표를 본다)
// ============================================================

const SCHEDULE_ID = 'haram' // 하람 주간 계획표 (가족 공유)

/** 기본 문서 */
export function defaultDoc() {
  return { data: cloneData(DEFAULT_DATA), cust: {}, memo: '' }
}

/** 계획표 불러오기 — 없으면 null (호출부에서 기본값 처리) */
export async function loadSchedule(id = SCHEDULE_ID) {
  const { data, error } = await supabase
    .from('family_schedule')
    .select('doc, updated_at, updated_by')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const doc = data.doc || {}
  return {
    data: Array.isArray(doc.data) && doc.data.length ? doc.data : cloneData(DEFAULT_DATA),
    cust: doc.cust && typeof doc.cust === 'object' ? doc.cust : {},
    memo: typeof doc.memo === 'string' ? doc.memo : '',
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  }
}

/** 계획표 저장 (upsert) — 가족 누구나 수정 가능, 마지막 수정자 기록 */
export async function saveSchedule(doc, memberKey, id = SCHEDULE_ID) {
  const { error } = await supabase.from('family_schedule').upsert(
    {
      id,
      doc: { data: doc.data, cust: doc.cust, memo: doc.memo },
      updated_by: memberKey || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (error) throw error
}

export { SCHEDULE_ID }
