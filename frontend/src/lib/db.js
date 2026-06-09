import { supabase } from './supabase'

// ============================================================
// 데이터 접근 레이어 — Supabase 쿼리 모음
// ============================================================

/**
 * 단어 조회.
 * - category === 'general'(기본): 해당 레벨의 일반 단어
 * - 관심사 카테고리(webtoon/football/kpop_rap/games): 레벨 무관, 그 카테고리 전부
 */
export async function getWords({ level, category = 'general' }) {
  let q = supabase.from('words').select('*')
  if (category && category !== 'general') q = q.eq('category', category)
  else q = q.eq('category', 'general').eq('level', level)
  const { data, error } = await q.order('id')
  if (error) throw error
  return data || []
}

/** 특정 레벨의 일반 단어 (Words 페이지 호환용) */
export async function getWordsByLevel(level) {
  return getWords({ level, category: 'general' })
}

/**
 * 오늘 학습할 큐를 구성한다.
 * - 복습 기한이 지난 카드(due) + 아직 학습 안 한 새 카드(progress 없음)
 * @param {string} userId
 * @param {string} level
 * @param {number} newLimit 하루 새 단어 상한
 */
export async function getStudyQueue(userId, level, newLimit = 10, category = 'general') {
  const words = await getWords({ level, category })
  if (!words.length) return { due: [], fresh: [], words: [], progressById: {} }

  const ids = words.map((w) => w.id)
  const { data: progress, error } = await supabase
    .from('word_progress')
    .select('*')
    .eq('user_id', userId)
    .in('word_id', ids)
  if (error) throw error

  const progressById = {}
  for (const p of progress || []) progressById[p.word_id] = p

  const nowIso = new Date().toISOString()
  const due = []
  const fresh = []
  for (const w of words) {
    const p = progressById[w.id]
    if (!p) fresh.push(w)
    else if (p.due_at <= nowIso) due.push(w)
  }
  return {
    due,
    fresh: fresh.slice(0, newLimit),
    words,
    progressById,
  }
}

/** 이미 학습한(진행도가 있는) 단어 목록 — 복습 모드용 (기한 무관) */
export async function getLearnedWords(userId, level, category = 'general') {
  const words = await getWords({ level, category })
  if (!words.length) return { words: [], progressById: {} }
  const ids = words.map((w) => w.id)
  const { data: progress, error } = await supabase
    .from('word_progress')
    .select('*')
    .eq('user_id', userId)
    .in('word_id', ids)
  if (error) throw error
  const progressById = {}
  for (const p of progress || []) progressById[p.word_id] = p
  const learned = words.filter((w) => progressById[w.id])
  return { words: learned, progressById }
}

/** FSRS 계산 결과를 word_progress 에 저장(upsert) */
export async function saveProgress(userId, wordId, sched) {
  const { error } = await supabase.from('word_progress').upsert(
    {
      user_id: userId,
      word_id: wordId,
      stability: sched.stability,
      difficulty: sched.difficulty,
      due_at: sched.due_at,
      reps: sched.reps,
      lapses: sched.lapses,
      last_review: sched.last_review,
    },
    { onConflict: 'user_id,word_id' },
  )
  if (error) throw error
}

/** 발음 시도 기록 저장 (무료 STT 점수) */
export async function logSpeechAttempt(userId, { wordId, targetText, transcript, score }) {
  const { error } = await supabase.from('speech_attempts').insert({
    user_id: userId,
    word_id: wordId ?? null,
    target_text: targetText,
    transcript: transcript ?? null,
    score: score ?? null,
  })
  if (error) throw error
}

/** 누적 복습 횟수(평생) — 게임화 XP용 */
export async function getLifetimeReviews(userId) {
  const { data, error } = await supabase
    .from('daily_activity')
    .select('reviews')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).reduce((sum, r) => sum + (r.reviews || 0), 0)
}

/** 오늘 학습 수 누적 기록 (연속 학습일/통계용) */
export async function recordActivity(reviews) {
  if (!reviews) return
  const { error } = await supabase.rpc('add_activity', { p_reviews: reviews })
  if (error) throw error
}

/** 최근 활동을 받아 연속 학습일(streak)과 오늘 학습량 계산 */
export async function getStreak(userId) {
  const { data, error } = await supabase
    .from('daily_activity')
    .select('day, reviews')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .limit(120)
  if (error) throw error
  const rows = data || []
  const byDay = new Map(rows.map((r) => [r.day, r.reviews]))

  const todayKey = new Date().toISOString().slice(0, 10)
  const todayReviews = byDay.get(todayKey) || 0

  // 오늘(또는 어제)부터 연속으로 기록된 날 수 세기
  let streak = 0
  const cursor = new Date()
  // 오늘 학습 안 했으면 어제부터 카운트(오늘은 아직 진행 가능)
  if (!byDay.has(todayKey)) cursor.setDate(cursor.getDate() - 1)
  while (byDay.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return { streak, todayReviews }
}

// ===================== 가족 소통 (STEP 5) =====================

/** 이번 주(또는 가장 최근) 공통 토론 주제 */
export async function getWeeklyTopic() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('weekly_topics')
    .select('*')
    .lte('week_start', today)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

/** 일자 집합으로 연속일수 계산 (오늘/어제 기준) */
function streakFromDays(daySet) {
  let streak = 0
  const cursor = new Date()
  const todayKey = new Date().toISOString().slice(0, 10)
  if (!daySet.has(todayKey)) cursor.setDate(cursor.getDate() - 1)
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** 가족 구성원 목록 + 각자의 스트릭/오늘 학습량 */
export async function getFamilyOverview() {
  const [{ data: profiles }, { data: activity }] = await Promise.all([
    supabase.from('profiles').select('id, member_key, display_name, level, toefl_track'),
    supabase.from('daily_activity').select('user_id, day, reviews').gte(
      'day',
      new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10),
    ),
  ])
  const todayKey = new Date().toISOString().slice(0, 10)
  const daysByUser = {}
  const todayByUser = {}
  for (const a of activity || []) {
    ;(daysByUser[a.user_id] ||= new Set()).add(a.day)
    if (a.day === todayKey) todayByUser[a.user_id] = a.reviews
  }
  return (profiles || []).map((p) => ({
    ...p,
    streak: streakFromDays(daysByUser[p.id] || new Set()),
    todayReviews: todayByUser[p.id] || 0,
  }))
}

/** 최근 가족 채팅 메시지 */
export async function getRecentFamilyMessages(limit = 50) {
  const { data, error } = await supabase
    .from('family_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).reverse()
}

/** 가족 채팅 메시지 전송 */
export async function sendFamilyMessage({ userId, displayName, memberKey, text }) {
  const { error } = await supabase.from('family_messages').insert({
    user_id: userId,
    display_name: displayName,
    member_key: memberKey,
    text,
  })
  if (error) throw error
}

/** 새 메시지 실시간 구독 (반환된 channel 은 supabase.removeChannel 로 해제) */
export function subscribeFamilyMessages(onInsert) {
  const channel = supabase
    .channel('family-chat')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'family_messages' },
      (payload) => onInsert(payload.new),
    )
    .subscribe()
  return channel
}

/** 대시보드용 요약: 오늘 복습 대기 수, 학습한 단어 수 */
export async function getStudyStats(userId, level, category = 'general') {
  const { due, fresh, words, progressById } = await getStudyQueue(userId, level, 9999, category)
  const learned = Object.keys(progressById).length
  return {
    dueCount: due.length,
    freshCount: fresh.length,
    learned,
    total: words.length,
  }
}
