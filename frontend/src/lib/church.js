import { supabase } from './supabase'

// ============================================================
// 하24 교회교육프로그램 전문가 (아빠 전용)
// AI 호출은 supabase/functions/church — 서버에서 member_key='dad' 검증
// ============================================================

/** 하24에게 기획/질문 요청 */
export async function askChurch({ prompt, kind = '학생회모임', target = '중고등부', history = [] }) {
  const { data, error } = await supabase.functions.invoke('church', {
    body: { prompt, kind, target, history },
  })
  if (error) throw error
  if (data?.error) throw new Error(friendlyChurchError(data))
  return data.content
}

/** 기획안 저장 */
export async function savePlan({ userId, title, kind, target, content, prompt }) {
  const { data, error } = await supabase
    .from('church_plans')
    .insert({ user_id: userId, title, kind, target, content, prompt })
    .select()
  if (error) throw error
  return data?.[0]
}

/** 내 기획안 목록 */
export async function listPlans(userId) {
  const { data, error } = await supabase
    .from('church_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deletePlan(id) {
  const { error } = await supabase.from('church_plans').delete().eq('id', id)
  if (error) throw error
}

export async function updatePlan(id, patch) {
  const { error } = await supabase.from('church_plans').update(patch).eq('id', id)
  if (error) throw error
}

export function friendlyChurchError(d) {
  const code = d?.error || ''
  if (code === 'FORBIDDEN_DAD_ONLY') return '이 기능은 아빠 계정만 사용할 수 있어요.'
  if (code === 'AI_NOT_CONFIGURED') return 'AI 키가 설정되지 않았어요. (GEMINI_API_KEY)'
  if (code === 'DAILY_LIMIT_REACHED') return `오늘 AI 사용량(${d.limit}회)을 다 썼어요. 내일 다시 이용해주세요.`
  if (code === 'AI_QUOTA_EXCEEDED') return 'AI 무료 할당량이 소진됐어요. 잠시 후 다시 시도해주세요.'
  if (code === 'UNAUTHORIZED') return '로그인이 필요해요.'
  if (/church_plans|relation|42P01|schema cache/i.test(code + (d?.detail || ''))) {
    return '교회 기획 테이블이 아직 없어요. database/step12_counsel_church.sql 을 실행해 주세요.'
  }
  return d?.detail || d?.error || '알 수 없는 오류'
}

// ── 빠른 시작 프리셋 (학생회 중심) ──────────────────────────
export const KINDS = ['학생회모임', '수련회', 'VBS', '교사훈련', '청년회', '질문']
export const TARGETS = ['중고등부', '중등부', '고등부', '청년부', '초등부', '유치부', '장년부', '전체']

export const PRESETS = [
  {
    label: '📖 이번 주 학생회 모임 기획',
    kind: '학생회모임',
    target: '중고등부',
    prompt: '이번 주 학생회 정기모임(2시간)을 기획해줘. 아이스브레이킹 → 찬양 → 말씀 → 소그룹 나눔 → 광고/기도 순서로, 나눔 질문까지 그대로 쓸 수 있게 완성해줘.',
  },
  {
    label: '🔥 학생회 수련회 2박3일',
    kind: '수련회',
    target: '중고등부',
    prompt: '중고등부 학생회 2박3일 수련회 기획안을 만들어줘. 주제 선정부터 시간표, 조 편성, 레크리에이션, 안전관리, 사후관리까지 포함해줘.',
  },
  {
    label: '💬 소그룹 나눔 질문 만들기',
    kind: '학생회모임',
    target: '중고등부',
    prompt: '학생들이 실제로 입을 열 수 있는 소그룹 나눔 질문을 만들어줘. 가벼운 질문부터 깊은 질문까지 단계적으로.',
  },
  {
    label: '🎯 학생회 리더 세우기',
    kind: '교사훈련',
    target: '중고등부',
    prompt: '학생회 학생 리더를 세우고 훈련하는 과정을 설계해줘. 선발 기준, 훈련 커리큘럼, 역할 부여까지.',
  },
  {
    label: '🎮 아이스브레이킹 아이디어',
    kind: '학생회모임',
    target: '중고등부',
    prompt: '중고등부 학생회에서 바로 할 수 있는 아이스브레이킹 게임을 규칙까지 자세히 알려줘. 준비물 적고 10분 안에 되는 걸로.',
  },
  {
    label: '❓ 궁금한 것 물어보기',
    kind: '질문',
    target: '중고등부',
    prompt: '',
  },
]
