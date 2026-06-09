import { supabase } from './supabase'

// ============================================================
// AI 회화 클라이언트 — Supabase Edge Function('chat') 호출
// API 키는 클라이언트에 없음(서버 시크릿). 인증 토큰은 invoke가 자동 첨부.
// ============================================================

const FRIENDLY = {
  AI_NOT_CONFIGURED: 'AI가 아직 설정되지 않았어요. (무료 Gemini 키 + Edge Function 배포 필요)',
  AI_QUOTA_EXCEEDED: '오늘 AI 무료 사용량/크레딧이 소진됐어요. 잠시 후 다시 시도하거나 키 교체가 필요해요.',
  DAILY_LIMIT_REACHED: '오늘 AI 회화 한도를 모두 사용했어요. 내일 다시 만나요 🌙',
  GEMINI_ERROR: 'AI 서버가 잠시 응답하지 않아요. 잠시 후 다시 시도해 주세요.',
  USAGE_ERROR: 'AI 사용량 확인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  SERVER_ERROR: 'AI 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
  UNAUTHORIZED: '로그인이 필요해요.',
  EMPTY_MESSAGE: '메시지를 입력해 주세요.',
}

// supabase-js는 함수가 4xx/5xx면 error만 주고 본문(error 코드)은 error.context(Response)에 담는다.
async function readPayload(data, error) {
  if (data && Object.keys(data).length) return data
  try {
    if (error?.context && typeof error.context.json === 'function') {
      return await error.context.json()
    }
  } catch {
    /* ignore */
  }
  return {}
}

export async function chat({ level, message, history = [] }) {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { level, message, history },
  })
  const payload = await readPayload(data, error)
  const code = payload.error || (error ? 'SERVER_ERROR' : null)
  if (code) {
    const msg = FRIENDLY[code] || '문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
    const err = new Error(msg)
    err.code = code
    throw err
  }
  return payload // { reply, english, english_ko, correction, correction_ko, cached, usageToday, limit }
}

// 패미(AI 가족) — 주제·최근 대화 기반으로 대화를 이끄는 메시지 생성
export async function fami({ topic, recent = [], members = [] }) {
  const { data, error } = await supabase.functions.invoke('famichat', {
    body: { topic, recent, members },
  })
  const payload = await readPayload(data, error)
  if (payload.error || error) {
    const msg = FRIENDLY[payload.error] || 'AI 가족을 잠시 부르지 못했어요. 잠시 후 다시 시도해 주세요.'
    const err = new Error(msg)
    err.code = payload.error
    throw err
  }
  return (payload.text || '').trim()
}
