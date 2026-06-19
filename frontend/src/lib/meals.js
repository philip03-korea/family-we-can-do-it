import { supabase } from './supabase'

// ============================================================
// 식단표 + 추천/희망 음식 + 공감(투표)
// ============================================================

/** 해당 월(YYYY-MM)의 식단 (날짜 오름차순) */
export async function getMonthMeals(month) {
  const { data, error } = await supabase
    .from('meal_plan')
    .select('*')
    .gte('day', `${month}-01`)
    .lte('day', `${month}-31`)
    .order('day')
  if (error) throw error
  return data || []
}

/** 식단 수정 (부모/누구나) */
export async function saveMeal(day, patch) {
  const { error } = await supabase
    .from('meal_plan')
    .upsert({ day, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'day' })
  if (error) throw error
}

/** 추천/희망 음식 목록 + 공감 수 + 내가 공감했는지 */
export async function listMealWishes(myKey) {
  const [{ data: wishes, error: e1 }, { data: votes, error: e2 }] = await Promise.all([
    supabase.from('meal_wishes').select('*').order('created_at', { ascending: false }),
    supabase.from('meal_wish_votes').select('wish_id, member_key'),
  ])
  if (e1) throw e1
  if (e2) throw e2
  const byWish = {}
  for (const v of votes || []) {
    ;(byWish[v.wish_id] ||= []).push(v.member_key)
  }
  return (wishes || []).map((w) => ({
    ...w,
    voters: byWish[w.id] || [],
    votes: (byWish[w.id] || []).length,
    mine: (byWish[w.id] || []).includes(myKey),
  }))
}

export async function addMealWish({ memberKey, title, note, month }) {
  const { error } = await supabase.from('meal_wishes').insert({
    member_key: memberKey,
    title: title.trim(),
    note: note?.trim() || null,
    month: month || null,
  })
  if (error) throw error
}

/** 공감 토글 (한 사람 한 표) */
export async function toggleMealVote(wishId, memberKey, on) {
  if (on) {
    const { error } = await supabase.from('meal_wish_votes').delete().eq('wish_id', wishId).eq('member_key', memberKey)
    if (error) throw error
  } else {
    const { error } = await supabase.from('meal_wish_votes').insert({ wish_id: wishId, member_key: memberKey })
    if (error && !/duplicate|unique/i.test(error.message || '')) throw error
  }
}

export async function deleteMealWish(id) {
  const { error } = await supabase.from('meal_wishes').delete().eq('id', id)
  if (error) throw error
}
