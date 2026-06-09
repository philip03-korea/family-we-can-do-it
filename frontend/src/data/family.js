// 레벨 사다리 A→F (CLAUDE.md 설계)
export const LEVELS = {
  A: { code: 'A', name: 'Pre-A1', label: '입문', bg: 'bg-level-a' },
  B: { code: 'B', name: 'A1', label: '기초', bg: 'bg-level-b' },
  C: { code: 'C', name: 'A2', label: '생활', bg: 'bg-level-c' },
  D: { code: 'D', name: 'B1', label: '소통', bg: 'bg-level-d' },
  E: { code: 'E', name: 'B2', label: '심화', bg: 'bg-level-e' },
  F: { code: 'F', name: 'C1', label: '유창', bg: 'bg-level-f' },
}

export const LEVEL_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']

// 가족 구성원 기본 배치 (추천 시작 레벨)
export const FAMILY = [
  { key: 'mom', name: '엄마', age: '40대', level: 'C', focus: '실생활·여행 회화', emoji: '👩' },
  { key: 'dad', name: '아빠', age: '40대', level: 'C', focus: '실생활·업무 기초', emoji: '👨' },
  { key: 'haeum', name: '하음', age: '고3', level: 'D', focus: '일상 회화 (부담 없이)', emoji: '🧑' },
  { key: 'haul', name: '하울', age: '고1', level: 'E', focus: 'TOEFL 트랙 병행', emoji: '🧑‍🎓', toefl: true },
  { key: 'haram', name: '하람', age: '중1', level: 'B', focus: '기초 단어·재미·습관', emoji: '🧒' },
]
