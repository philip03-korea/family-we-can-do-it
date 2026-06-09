// ============================================================
// FSRS (Free Spaced Repetition Scheduler) — 경량 구현 (FSRS-5 기반)
// 단어를 언제 다시 복습할지 계산. 외부 API 불필요 = 비용 0원.
//
// 등급(rating): 1=Again(다시) 2=Hard(어려움) 3=Good(보통) 4=Easy(쉬움)
// progress 레코드: { stability, difficulty, due_at, reps, lapses, last_review }
// ============================================================

// FSRS-5 기본 가중치 (공식 기본값)
const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
]

const DECAY = -0.5
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1 // ≈ 0.2345
const REQUEST_RETENTION = 0.9 // 목표 기억 유지율 90%
const MIN_D = 1
const MAX_D = 10

const clampD = (d) => Math.min(MAX_D, Math.max(MIN_D, d))

// 초기 안정성 (첫 복습)
const initStability = (g) => Math.max(0.1, W[g - 1])
// 초기 난이도
const initDifficulty = (g) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1)

// 경과일 t, 안정성 S 에서의 기억 회상확률 R
function retrievability(t, s) {
  if (s <= 0) return 0
  return Math.pow(1 + (FACTOR * t) / s, DECAY)
}

// 다음 복습 간격(일) — 목표 유지율 기준
function intervalFromStability(s) {
  const i = (s / FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1)
  return Math.max(1, Math.round(i))
}

// 난이도 갱신 (평균회귀 포함)
function nextDifficulty(d, g) {
  const delta = d - W[6] * (g - 3)
  return clampD(W[7] * initDifficulty(4) + (1 - W[7]) * delta)
}

// 성공 시 안정성 증가
function stabilityOnRecall(d, s, r, g) {
  const hard = g === 2 ? W[15] : 1
  const easy = g === 4 ? W[16] : 1
  return (
    s *
    (1 +
      Math.exp(W[8]) *
        (11 - d) *
        Math.pow(s, -W[9]) *
        (Math.exp((1 - r) * W[10]) - 1) *
        hard *
        easy)
  )
}

// 실패(Again) 시 안정성 (대개 크게 감소)
function stabilityOnForget(d, s, r) {
  const post = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14])
  return Math.min(post, s) // 이전 안정성을 넘지 않음
}

/**
 * 복습 결과를 받아 다음 진행 상태를 계산.
 * @param {object|null} prev 기존 progress (없으면 신규 카드)
 * @param {number} g 등급 1~4
 * @param {number} nowMs 현재 시각(ms) — Date를 외부에서 주입 (테스트/결정성)
 * @returns {object} { stability, difficulty, due_at(ISO), reps, lapses, last_review(ISO), interval }
 */
export function schedule(prev, g, nowMs) {
  const now = new Date(nowMs)
  let stability, difficulty, reps, lapses

  if (!prev || !prev.last_review || prev.reps === 0) {
    // 신규 카드
    stability = initStability(g)
    difficulty = initDifficulty(g)
    reps = 1
    lapses = g === 1 ? 1 : 0
  } else {
    const elapsedDays = Math.max(0, (nowMs - new Date(prev.last_review).getTime()) / 86400000)
    const r = retrievability(elapsedDays, prev.stability)
    difficulty = nextDifficulty(prev.difficulty, g)
    if (g === 1) {
      stability = stabilityOnForget(prev.difficulty, prev.stability, r)
      lapses = (prev.lapses || 0) + 1
    } else {
      stability = stabilityOnRecall(prev.difficulty, prev.stability, r, g)
      lapses = prev.lapses || 0
    }
    reps = (prev.reps || 0) + 1
  }

  // Again(다시) 은 같은 세션에서 빨리 다시 보도록 짧게 (10분 뒤)
  let dueMs
  let interval
  if (g === 1) {
    interval = 0
    dueMs = nowMs + 10 * 60 * 1000
  } else {
    interval = intervalFromStability(stability)
    dueMs = nowMs + interval * 86400000
  }

  return {
    stability: Number(stability.toFixed(4)),
    difficulty: Number(difficulty.toFixed(4)),
    reps,
    lapses,
    last_review: now.toISOString(),
    due_at: new Date(dueMs).toISOString(),
    interval,
  }
}

// 등급 버튼에 보여줄 "다음 복습까지" 미리보기 텍스트
export function previewInterval(prev, g, nowMs) {
  const s = schedule(prev, g, nowMs)
  if (g === 1) return '10분'
  if (s.interval < 1) return '오늘'
  if (s.interval === 1) return '1일'
  if (s.interval < 30) return `${s.interval}일`
  if (s.interval < 365) return `${Math.round(s.interval / 30)}개월`
  return `${(s.interval / 365).toFixed(1)}년`
}

export const RATINGS = [
  { g: 1, label: '다시', color: 'bg-rose-600' },
  { g: 2, label: '어려움', color: 'bg-amber-600' },
  { g: 3, label: '보통', color: 'bg-emerald-600' },
  { g: 4, label: '쉬움', color: 'bg-sky-600' },
]
