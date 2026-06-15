// ============================================================
// 집안일 로테이션 템플릿 + 목표/보상 (자동 로테이션의 기준)
// days: 0=월 1=화 2=수 3=목 4=금 5=토 6=일
// pool: 이 집안일을 돌아가며 맡는 사람들(요일 순서대로 순환)
// ============================================================

export const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export const ROTATION = [
  { title: '설거지(저녁)', category: '주방', points: 10, days: [0, 1, 2, 3, 4, 5, 6], pool: ['haul', 'haram'] },
  { title: '분리수거', category: '쓰레기', points: 15, days: [0, 2, 4], pool: ['dad', 'haul'] },
  { title: '음식물 쓰레기', category: '주방', points: 10, days: [1, 4, 6], pool: ['dad'] },
  { title: '거실 정리', category: '청소', points: 10, days: [0, 1, 2, 3, 4], pool: ['haram', 'haeum'] },
  { title: '빨래 개기', category: '빨래', points: 15, days: [1, 3, 5], pool: ['haul', 'mom'] },
  { title: '화장실 청소', category: '청소', points: 20, days: [2, 6], pool: ['mom', 'dad'] },
  { title: '화분 물주기', category: '기타', points: 10, days: [0, 3, 6], pool: ['haram'] },
]

// 가족별 주간 목표 포인트 (DB chore_goals 의 기본값과 동일)
export const DEFAULT_GOALS = { mom: 100, dad: 100, haeum: 50, haul: 90, haram: 80 }

// 혼합형 보상
export const REWARD_TEXT = '목표 달성 → 용돈 5,000원 · 게임/미디어 1시간 · 메뉴 선택권 중 택1 🎁'
export const STREAK_BONUS_TEXT = '4주 연속 달성 → 가족 외식 메뉴 결정권 🍽️'

export const PARENT_KEYS = ['mom', 'dad']
