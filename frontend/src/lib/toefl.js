import { supabase } from './supabase'

// TOEFL 연습 문제 (섹션별)
export async function getToeflPrompts(section) {
  const { data, error } = await supabase
    .from('toefl_prompts')
    .select('*')
    .eq('section', section)
    .order('id')
  if (error) throw error
  return data || []
}

// AI 채점 (Edge Function 'toefl')
export async function scoreToefl({ section, prompt, response }) {
  const { data, error } = await supabase.functions.invoke('toefl', {
    body: { section, prompt, response },
  })
  const payload = data || {}
  if (payload.error || error) {
    const map = {
      AI_NOT_CONFIGURED: 'AI 채점이 아직 설정되지 않았어요. (docs/AI_설정_가이드.md — toefl 함수도 배포 필요)',
      DAILY_LIMIT_REACHED: '오늘 AI 사용 한도를 다 썼어요. 내일 다시 시도해요 🌙',
    }
    throw new Error(map[payload.error] || payload.detail || error?.message || '채점 중 오류')
  }
  return payload // { score, score_reason, strengths, improvements, corrected_sample, usageToday, limit }
}

export async function saveToeflAttempt({ userId, section, promptId, promptText, response, score, feedback }) {
  const { error } = await supabase.from('toefl_attempts').insert({
    user_id: userId,
    section,
    prompt_id: promptId ?? null,
    prompt_text: promptText,
    response,
    score,
    feedback,
  })
  if (error) throw error
}

export async function getToeflHistory(userId, limit = 10) {
  const { data, error } = await supabase
    .from('toefl_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}
