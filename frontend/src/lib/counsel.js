import { supabase } from './supabase'
import { scoreTest, TESTS, CHILD_KEYS } from '../data/counsel'

// ============================================================
// 심리검사 결과 저장/조회 (하23)
//
// 개인정보 원칙:
//  · 결과는 기본 비공개(shared=false). 본인이 명시적으로 공유해야 가족이 봄.
//  · 위기문항 양성(crisis=true) 결과는 공유 불가 — DB check 제약으로도 강제됨.
// ============================================================

/** 검사 결과 채점 + 저장 */
export async function saveResult({ userId, memberKey, testKey, answers }) {
  const { score, max, level, crisis } = scoreTest(testKey, answers)
  const row = {
    user_id: userId,
    member_key: memberKey,
    test_key: testKey,
    score,
    max_score: max,
    level_key: level.key,
    level_label: level.label,
    answers,
    crisis,
    shared: false,
  }
  const { data, error } = await supabase.from('counsel_results').insert(row).select()
  if (error) throw error
  return { ...(data?.[0] || row), level }
}

/** 내 결과 전체 (최신순) */
export async function listMyResults(userId) {
  const { data, error } = await supabase
    .from('counsel_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** 가족이 공유한 결과 (가족회의용) — shared=true 만 조회됨(RLS) */
export async function listSharedResults() {
  const { data, error } = await supabase
    .from('counsel_results')
    .select('*')
    .eq('shared', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * 부모 전용 — 자녀의 위기 결과 목록 (검사 화면에 미리 고지된 범위)
 * RLS: crisis=true && member_key in (자녀) && 요청자가 부모일 때만 조회됨.
 * 평상시 점수는 조회되지 않는다.
 */
export async function listChildCrisis() {
  const { data, error } = await supabase
    .from('counsel_results')
    .select('*')
    .eq('crisis', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  // 본인(부모) 것은 제외 — 자녀 위기만
  return (data || []).filter((r) => CHILD_KEYS.includes(r.member_key))
}

/** 부모가 확인함 표시 (대화 후 정리용) */
export async function markParentSeen(id) {
  const { error } = await supabase
    .from('counsel_results')
    .update({ parent_seen_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** 가족 공유 on/off — 위기 결과는 앱에서도 차단 */
export async function setShared(id, shared, isCrisis = false) {
  if (shared && isCrisis) {
    throw new Error('위기 신호가 있는 결과는 공유할 수 없어요. 먼저 전문가와 상담해주세요.')
  }
  const { error } = await supabase.from('counsel_results').update({ shared }).eq('id', id)
  if (error) throw error
}

/** 가족회의용 메모 저장 */
export async function setNote(id, note) {
  const { error } = await supabase.from('counsel_results').update({ note }).eq('id', id)
  if (error) throw error
}

/** 결과 삭제 */
export async function deleteResult(id) {
  const { error } = await supabase.from('counsel_results').delete().eq('id', id)
  if (error) throw error
}

/** 검사별 최근 결과 맵 { phq9: row, ... } */
export function latestByTest(results) {
  const map = {}
  for (const r of results) if (!map[r.test_key]) map[r.test_key] = r
  return map
}

/** 추이(같은 검사 시간순) — 그래프/변화 표시용 */
export function trendOf(results, testKey) {
  return results
    .filter((r) => r.test_key === testKey)
    .slice()
    .reverse()
    .map((r) => ({ date: r.created_at.slice(0, 10), score: r.score, max: r.max_score, label: r.level_label }))
}

export const testOf = (key) => TESTS[key]

/** 테이블 없을 때 친절한 안내 */
export function friendlyCounselError(e) {
  const m = (e?.message || '') + (e?.details || '') + (e?.code || '')
  if (/counsel_results|relation|exist|42P01|schema cache|404/i.test(m)) {
    return '심리상담 테이블이 아직 없어요. Supabase SQL Editor에서 database/step12_counsel_church.sql 을 실행해 주세요.'
  }
  if (/counsel_crisis_never_shared/i.test(m)) {
    return '위기 신호가 있는 결과는 공유할 수 없어요. 먼저 전문가와 상담해주세요.'
  }
  return e?.message || '알 수 없는 오류'
}
