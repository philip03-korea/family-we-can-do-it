import { supabase } from './supabase'

// ============================================================
// 데이터 접근 레이어 — Supabase 쿼리 모음
// ============================================================

/** 특정 레벨의 모든 단어 */
export async function getWordsByLevel(level) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('level', level)
    .order('id')
  if (error) throw error
  return data || []
}

/**
 * 오늘 학습할 큐를 구성한다.
 * - 복습 기한이 지난 카드(due) + 아직 학습 안 한 새 카드(progress 없음)
 * @param {string} userId
 * @param {string} level
 * @param {number} newLimit 하루 새 단어 상한
 */
export async function getStudyQueue(userId, level, newLimit = 10) {
  const words = await getWordsByLevel(level)
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

/** 대시보드용 요약: 오늘 복습 대기 수, 학습한 단어 수 */
export async function getStudyStats(userId, level) {
  const { due, fresh, words, progressById } = await getStudyQueue(userId, level, 9999)
  const learned = Object.keys(progressById).length
  return {
    dueCount: due.length,
    freshCount: fresh.length,
    learned,
    total: words.length,
  }
}
