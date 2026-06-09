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
  // 함수가 4xx/5xx면 본문은 error.context(Response)에 담김
  let payload = data || {}
  if ((!data || !Object.keys(data).length) && error?.context?.json) {
    try { payload = await error.context.json() } catch { /* ignore */ }
  }
  if (payload.error || error) {
    const map = {
      AI_NOT_CONFIGURED: 'AI 채점이 아직 설정되지 않았어요. (무료 Gemini 키 + toefl 함수 배포 필요)',
      AI_QUOTA_EXCEEDED: '오늘 AI 무료 사용량/크레딧이 소진됐어요. 잠시 후 다시 시도하거나 키 교체가 필요해요.',
      DAILY_LIMIT_REACHED: '오늘 AI 사용 한도를 다 썼어요. 내일 다시 시도해요 🌙',
      GEMINI_ERROR: 'AI 채점 서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해 주세요.',
    }
    throw new Error(map[payload.error] || '채점 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.')
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
