import { KNOWLEDGE_VERSION } from '../data/admissions2027'
import { supabase } from './supabase'

// ============================================================
// 입시박사 클라이언트 — Supabase Edge Function('tutor') 호출
// API 키는 클라이언트에 없다(서버 시크릿). 인증 토큰은 invoke 가 자동 첨부.
// ============================================================

const FRIENDLY = {
  AI_NOT_CONFIGURED: '입시박사가 아직 연결되지 않았어요. (서버에 API 키 등록 + tutor 함수 배포가 필요해요)',
  AI_QUOTA_EXCEEDED: '오늘 AI 사용량이 다 찼어요. 잠시 후 다시 시도해 주세요.',
  DAILY_LIMIT_REACHED: '오늘 질문 한도를 모두 썼어요. 내일 다시 물어봐 주세요 🌙',
  PROVIDER_ERROR: '입시박사가 잠시 대답을 못 하고 있어요. 잠시 후 다시 시도해 주세요.',
  USAGE_ERROR: '사용량 확인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  SERVER_ERROR: '처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
  UNAUTHORIZED: '로그인이 필요해요.',
  EMPTY_MESSAGE: '질문을 입력해 주세요.',
}

// supabase-js 는 함수가 4xx/5xx 면 error 만 주고 본문은 error.context 에 담는다.
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

export async function askTutor({ message, history = [], who = '학생', topic = '진학', context = '' }) {
  const { data, error } = await supabase.functions.invoke('tutor', {
    body: { message, history, who, topic: `${topic} [자료 ${KNOWLEDGE_VERSION}]`, context },
  })
  const payload = await readPayload(data, error)
  const code = payload.error || (error ? 'SERVER_ERROR' : null)
  if (code) {
    const err = new Error(FRIENDLY[code] || '문제가 발생했어요. 잠시 후 다시 시도해 주세요.')
    err.code = code
    throw err
  }
  return payload // { reply, provider, usageToday, limit }
}
