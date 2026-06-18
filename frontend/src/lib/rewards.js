import { supabase } from './supabase'

// ============================================================
// 보상 상점 + 포인트 지갑 (외부 API 없음, 전부 Supabase)
// 잔액 = point_ledger.delta 합계 (member_key 기준)
// ============================================================

// ---- 포인트 지갑 ----
export async function getBalance(memberKey) {
  const { data, error } = await supabase.from('point_ledger').select('delta').eq('member_key', memberKey)
  if (error) throw error
  return (data || []).reduce((s, r) => s + r.delta, 0)
}

/** 전 가족 잔액 맵 */
export async function getAllBalances() {
  const { data, error } = await supabase.from('point_ledger').select('member_key, delta')
  if (error) throw error
  const m = {}
  for (const r of data || []) m[r.member_key] = (m[r.member_key] || 0) + r.delta
  return m
}

// ---- 집안일 완료 시 포인트 적립/취소 (Chores에서 호출) ----
export async function addChorePoints(chore) {
  const { error } = await supabase
    .from('point_ledger')
    .insert({ member_key: chore.assignee_key, delta: chore.points, reason: 'chore', ref: `chore:${chore.id}` })
  // 이미 적립된 항목(ref 중복)은 무시
  if (error && !/duplicate|unique/i.test(error.message || '')) throw error
}

export async function removeChorePoints(choreId) {
  const { error } = await supabase.from('point_ledger').delete().eq('ref', `chore:${choreId}`)
  if (error) throw error
}

// ---- 상점 ----
export async function listRewardItems() {
  const { data, error } = await supabase
    .from('reward_items')
    .select('*')
    .eq('active', true)
    .order('sort')
  if (error) throw error
  return data || []
}

/** 구매(교환): 잔액 확인 → 구매내역 생성 → 포인트 차감 */
export async function purchaseItem(memberKey, item) {
  const balance = await getBalance(memberKey)
  if (balance < item.cost) {
    const e = new Error(`포인트가 부족해요. (보유 ${balance}P / 필요 ${item.cost}P)`)
    e.code = 'INSUFFICIENT'
    throw e
  }
  const { data: purchase, error: pErr } = await supabase
    .from('reward_purchases')
    .insert({ member_key: memberKey, item_id: item.id, item_title: item.title, cost: item.cost, status: 'requested' })
    .select()
    .single()
  if (pErr) throw pErr

  const { error: lErr } = await supabase
    .from('point_ledger')
    .insert({ member_key: memberKey, delta: -item.cost, reason: 'purchase', ref: `purchase:${purchase.id}` })
  if (lErr) {
    // 차감 실패 시 구매 롤백(최선)
    await supabase.from('reward_purchases').delete().eq('id', purchase.id)
    throw lErr
  }
  return purchase
}

export async function listMyPurchases(memberKey) {
  const { data, error } = await supabase
    .from('reward_purchases')
    .select('*')
    .eq('member_key', memberKey)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data || []
}

export async function listPendingPurchases() {
  const { data, error } = await supabase
    .from('reward_purchases')
    .select('*')
    .eq('status', 'requested')
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function updatePurchaseStatus(id, status) {
  const { error } = await supabase
    .from('reward_purchases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** 구매 취소 + 포인트 환불 */
export async function cancelPurchase(purchase) {
  await updatePurchaseStatus(purchase.id, 'canceled')
  const { error } = await supabase
    .from('point_ledger')
    .insert({ member_key: purchase.member_key, delta: purchase.cost, reason: 'refund', ref: `refund:${purchase.id}` })
  if (error && !/duplicate|unique/i.test(error.message || '')) throw error
}

export const STATUS_LABEL = {
  requested: '신청됨',
  approved: '승인됨',
  used: '사용완료',
  canceled: '취소됨',
}
