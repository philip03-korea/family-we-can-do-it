import { supabase } from './supabase'

// ============================================================
// 식단표 + 추천/희망 음식 + 공감(투표)
// ============================================================

/** 해당 월(YYYY-MM)의 식단 (날짜 오름차순) */
export async function getMonthMeals(month) {
  // 해당 월의 마지막 날 계산 (6월=30, 7월=31 등)
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const { data, error } = await supabase
    .from('meal_plan')
    .select('*')
    .gte('day', `${month}-01`)
    .lte('day', `${month}-${String(lastDay).padStart(2, '0')}`)
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

// ============================================================
// 식단 자동 생성 (카테고리별 템플릿)
// ============================================================

/** 해당 월의 전체 식단을 한 번에 저장 (upsert) */
export async function bulkSaveMeals(meals) {
  // meals = [{ day, breakfast, lunch, dinner, note }]
  const rows = meals.map((m) => ({ ...m, updated_at: new Date().toISOString() }))
  const { error } = await supabase.from('meal_plan').upsert(rows, { onConflict: 'day' })
  if (error) throw error
}

/** 카테고리별 식단 템플릿 — 30일 순환 */
const TEMPLATES = {
  healthy: {
    label: '🥗 건강식',
    desc: '잡곡·채소·단백질 균형, 저당',
    meals: [
      { b: '잡곡밥·된장국·계란', d: '닭가슴살구이·브로콜리·현미밥' },
      { b: '오트밀·바나나·우유', d: '고등어구이·시금치나물·잡곡밥' },
      { b: '통밀토스트·삶은 계란·사과', d: '소불고기·버섯볶음·현미밥' },
      { b: '그릭요거트·견과류·블루베리', d: '두부조림·미역국·잡곡밥' },
      { b: '잡곡밥·김·계란후라이', d: '연어구이·양배추샐러드·현미밥' },
      { b: '바나나·삶은 계란·우유', d: '제육볶음(저지방)·상추쌈·보리밥' },
      { b: '현미죽·계란·김치', d: '닭볶음탕·콩나물무침' },
    ],
  },
  diabetes: {
    label: '💉 당뇨친화',
    desc: '저당·고섬유·단백질 중심, 1인 약 1,500kcal',
    meals: [
      { b: '현미밥·된장국·삶은 계란', d: '닭가슴살·브로콜리·양배추샐러드' },
      { b: '오트밀·호두·저지방우유', d: '고등어구이·시금치·잡곡밥(소량)' },
      { b: '통밀토스트·아보카도·계란', d: '두부스테이크·버섯볶음·현미밥(소량)' },
      { b: '그릭요거트·아몬드·블루베리', d: '소고기장조림·오이무침·보리밥(소량)' },
      { b: '잡곡밥(소량)·김·계란말이', d: '연어구이·브로콜리·미역국' },
      { b: '삶은 계란·견과류·토마토', d: '닭안심구이·양배추쌈·잡곡밥(소량)' },
      { b: '현미죽·계란·김치(소량)', d: '참치샐러드·두부·나물반찬' },
    ],
  },
  protein: {
    label: '💪 고단백',
    desc: '닭가슴살·생선·계란·두부 중심, 근력 보강',
    meals: [
      { b: '삶은 계란3·통밀토스트·우유', d: '닭가슴살스테이크·고구마·브로콜리' },
      { b: '그릭요거트·바나나·프로틴', d: '연어구이·계란찜·잡곡밥' },
      { b: '오트밀·삶은 계란2·아몬드', d: '소고기안심·버섯볶음·현미밥' },
      { b: '두부스크램블·통밀빵·우유', d: '고등어구이·두부부침·미역국' },
      { b: '계란3·아보카도토스트', d: '닭다리구이·양배추샐러드·잡곡밥' },
      { b: '프로틴쉐이크·바나나·견과류', d: '돼지안심·브로콜리·현미밥' },
      { b: '참치김밥·삶은 계란', d: '소불고기·계란말이·잡곡밥' },
    ],
  },
  diet: {
    label: '🥦 다이어트',
    desc: '저탄수·고단백·저지방, 1인 약 1,200kcal',
    meals: [
      { b: '삶은 계란·토마토·블랙커피', d: '닭가슴살샐러드·현미밥(반공기)' },
      { b: '그릭요거트·블루베리', d: '두부스테이크·양배추볶음' },
      { b: '오이·삶은 계란·아몬드', d: '연어포케·잡곡밥(반공기)' },
      { b: '통밀토스트(반장)·아보카도', d: '닭안심구이·브로콜리·파프리카' },
      { b: '바나나반개·삶은 계란·녹차', d: '고등어구이·시금치나물' },
      { b: '두부·오이·토마토', d: '소고기장조림·콩나물국' },
      { b: '현미죽(소량)·계란흰자', d: '새우볶음·양배추샐러드' },
    ],
  },
}

/** 카테고리를 선택하면 해당 월의 식단을 자동 생성 */
export function generateMealPlan(month, category) {
  const tmpl = TEMPLATES[category]
  if (!tmpl) throw new Error('알 수 없는 카테고리: ' + category)
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const meals = []
  for (let d = 1; d <= lastDay; d++) {
    const t = tmpl.meals[(d - 1) % tmpl.meals.length]
    meals.push({
      day: `${month}-${String(d).padStart(2, '0')}`,
      breakfast: t.b,
      lunch: '',
      dinner: t.d,
      note: tmpl.desc,
    })
  }
  return meals
}

export { TEMPLATES }
