// ============================================================
// 게임화 — 기존 학습 데이터로 XP/레벨/배지 계산 (추가 DB 불필요 = 0원)
// ============================================================

const XP_PER_LEVEL = 500

/** stats: { totalReviews, learned, streak } → XP/레벨/진행도 */
export function computeXP({ totalReviews = 0, learned = 0, streak = 0 }) {
  const xp = totalReviews * 10 + learned * 5 + streak * 20
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const intoLevel = xp % XP_PER_LEVEL
  return { xp, level, intoLevel, perLevel: XP_PER_LEVEL, progress: intoLevel / XP_PER_LEVEL }
}

// 배지 정의 (조건 충족 시 획득)
const BADGES = [
  { id: 'first', emoji: '🌱', name: '첫걸음', test: (s) => s.learned >= 1 },
  { id: 'streak3', emoji: '🔥', name: '3일 연속', test: (s) => s.streak >= 3 },
  { id: 'streak7', emoji: '⚡', name: '일주일 연속', test: (s) => s.streak >= 7 },
  { id: 'streak30', emoji: '🌟', name: '한 달 개근', test: (s) => s.streak >= 30 },
  { id: 'words25', emoji: '📚', name: '단어 25', test: (s) => s.learned >= 25 },
  { id: 'words100', emoji: '💯', name: '단어 100', test: (s) => s.learned >= 100 },
  { id: 'reviews50', emoji: '🗣', name: '복습 50회', test: (s) => s.totalReviews >= 50 },
  { id: 'master', emoji: '🏆', name: '레벨 마스터', test: (s) => s.total > 0 && s.learned >= s.total },
]

export function computeBadges(stats) {
  return BADGES.map((b) => ({ ...b, earned: !!b.test(stats) }))
}
