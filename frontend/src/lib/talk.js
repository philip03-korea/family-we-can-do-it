import { supabase } from './supabase'

// ============================================================
// 가족 대화 — 감정 일기 / 강점 찾기
// 감정 일기는 기본 비공개. 본인이 공유를 켠 것만 가족이 본다.
// ============================================================

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const todayYmd = today

/** 오늘 일기 저장(하루 1개, 덮어쓰기) */
export async function saveDiary({ userId, memberKey, mood, note, date = today() }) {
  const { data, error } = await supabase
    .from('emotion_diary')
    .upsert(
      { user_id: userId, member_key: memberKey, entry_date: date, mood, note },
      { onConflict: 'user_id,entry_date' },
    )
    .select()
  if (error) throw error
  return data?.[0]
}

/** 내 일기 (최근순) */
export async function listMyDiary(userId, limit = 60) {
  const { data, error } = await supabase
    .from('emotion_diary')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

/** 가족이 공유한 일기 */
export async function listSharedDiary(limit = 40) {
  const { data, error } = await supabase
    .from('emotion_diary')
    .select('*')
    .eq('shared', true)
    .order('entry_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function setDiaryShared(id, shared) {
  const { error } = await supabase.from('emotion_diary').update({ shared }).eq('id', id)
  if (error) throw error
}

export async function deleteDiary(id) {
  const { error } = await supabase.from('emotion_diary').delete().eq('id', id)
  if (error) throw error
}

// ── 강점 찾기 ──────────────────────────────────────────────
/** 누군가에게 강점을 골라줌 */
export async function giveStrengths({ userId, fromMember, toMember, strengths, note }) {
  const { data, error } = await supabase
    .from('strength_notes')
    .insert({ from_user_id: userId, from_member: fromMember, to_member: toMember, strengths, note })
    .select()
  if (error) throw error
  return data?.[0]
}

/** 전체 강점 노트 (가족 공용) */
export async function listStrengths() {
  const { data, error } = await supabase
    .from('strength_notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteStrength(id) {
  const { error } = await supabase.from('strength_notes').delete().eq('id', id)
  if (error) throw error
}

export function friendlyTalkError(e) {
  const m = (e?.message || '') + (e?.details || '') + (e?.code || '')
  if (/emotion_diary|strength_notes|relation|42P01|schema cache|404/i.test(m)) {
    return '대화 기능 테이블이 아직 없어요. database/step14_subscores_and_talk.sql 을 실행해 주세요.'
  }
  return e?.message || '알 수 없는 오류'
}
