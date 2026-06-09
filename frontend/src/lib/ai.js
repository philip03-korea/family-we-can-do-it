import { supabase } from './supabase'

// ============================================================
// AI 회화 클라이언트 — Supabase Edge Function('chat') 호출
// API 키는 클라이언트에 없음(서버 시크릿). 인증 토큰은 invoke가 자동 첨부.
// ============================================================

const FRIENDLY = {
  AI_NOT_CONFIGURED: 'AI가 아직 설정되지 않았어요. (docs/AI_설정_가이드.md 참고 — 무료 Gemini 키 + Edge Function 배포)',
  DAILY_LIMIT_REACHED: '오늘 AI 회화 한도를 모두 사용했어요. 내일 다시 만나요 🌙',
  UNAUTHORIZED: '로그인이 필요해요.',
  EMPTY_MESSAGE: '메시지를 입력해 주세요.',
}

export async function chat({ level, message, history = [] }) {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { level, message, history },
  })
  // Edge Function이 4xx/5xx를 줘도 data에 error 필드가 담길 수 있음
  const payload = data || {}
  const code = payload.error || (error ? 'SERVER_ERROR' : null)
  if (code) {
    const msg = FRIENDLY[code] || payload.detail || error?.message || '문제가 발생했어요.'
    const err = new Error(msg)
    err.code = code
    throw err
  }
  return payload // { reply, correction, correction_ko, cached, usageToday, limit }
}
