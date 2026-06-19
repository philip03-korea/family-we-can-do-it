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
// color: 구성원 구분용 고유 색 — 엄마(핑크)·하음(노랑)·하람(파랑)·하울(형광)·아빠(보라)
export const FAMILY = [
  { key: 'mom', name: '엄마', age: '40대', level: 'C', focus: '실생활·여행 회화', emoji: '👩', color: '#ec4899', text: '#4a1528' },
  { key: 'dad', name: '아빠', age: '40대', level: 'C', focus: '실생활·업무 기초', emoji: '👨', color: '#8b5cf6', text: '#2e1065' },
  { key: 'haeum', name: '하음', age: '고3', level: 'D', focus: '일상 회화 (부담 없이)', emoji: '👧', color: '#eab308', text: '#422006' },
  { key: 'haul', name: '하울', age: '고1', level: 'E', focus: 'TOEFL 트랙 병행', emoji: '🧑‍🎓', color: '#84cc16', text: '#1a2e05', toefl: true },
  { key: 'haram', name: '하람', age: '중1', level: 'B', focus: '기초 단어·재미·습관', emoji: '👦', color: '#3b82f6', text: '#0a2540' },
]

export const colorOf = (key) => FAMILY.find((f) => f.key === key)?.color || '#64748b'
export const textOnColor = (key) => FAMILY.find((f) => f.key === key)?.text || '#0f172a'
