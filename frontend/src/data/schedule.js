// ============================================================
// 하람 주간 계획표 — 활동 타입 · 이모지 · 기본 시간표
// (원본 haram-schedule index.html 의 데이터 모델을 앱에 이식)
// ============================================================

// 활동 타입: code → { color(셀 배경), em(이모지), lb(라벨) }
// 색은 원본 CSS 변수(--c-*)의 파스텔 톤을 그대로 사용
export const TYPES = {
  S: { color: '#bfdbfe', em: '🏫', lb: '학교' },
  A: { color: '#dbeafe', em: '🏠', lb: '집도착' },
  R: { color: '#e0e7ff', em: '😴', lb: '쉬기' },
  E: { color: '#fef9c3', em: '📖', lb: '영단' },
  K: { color: '#fed7aa', em: '✏️', lb: '국어' },
  M: { color: '#d1fae5', em: '🧮', lb: '수학' },
  X: { color: '#a7f3d0', em: '🏃', lb: '운동' },
  G: { color: '#fce7f3', em: '🎮', lb: '게임' },
  F: { color: '#ffedd5', em: '🍚', lb: '밥+샤워' },
  P: { color: '#e2e8f0', em: '🌙', lb: '잠준비' },
  Z: { color: '#cbd5e1', em: '😴', lb: '잠' },
  C: { color: '#f3e8ff', em: '⛪', lb: '교회' },
  D: { color: '#f1f5f9', em: '', lb: '미정', dashed: true },
  _: { color: '#ffffff', em: '', lb: '', empty: true },
}

export const TYPE_KEYS = ['S', 'A', 'R', 'E', 'K', 'M', 'X', 'G', 'F', 'P', 'Z', 'C', 'D', '_']
export const DAYS_KO = ['월', '화', '수', '목', '금', '토', '일']

// 범례에 노출할 주요 타입
export const LEGEND_KEYS = ['S', 'A', 'R', 'E', 'K', 'M', 'X', 'G', 'F', 'C', 'P', 'Z']

export const EMOJI_LIST = [
  { em: '🏫', lb: '학교' }, { em: '🏠', lb: '집' }, { em: '😴', lb: '쉬기' }, { em: '📖', lb: '영단' },
  { em: '✏️', lb: '국어' }, { em: '🧮', lb: '수학' }, { em: '🏃', lb: '운동' }, { em: '🎮', lb: '게임' },
  { em: '🍚', lb: '식사' }, { em: '⛪', lb: '교회' }, { em: '🌙', lb: '잠준비' }, { em: '💤', lb: '수면' },
  { em: '📚', lb: '독서' }, { em: '✍️', lb: '필기' }, { em: '🎯', lb: '목표' }, { em: '🏋️', lb: '헬스' },
  { em: '⚽', lb: '축구' }, { em: '🏀', lb: '농구' }, { em: '🎵', lb: '음악' }, { em: '📺', lb: 'TV' },
  { em: '💻', lb: '컴퓨터' }, { em: '🛁', lb: '목욕' }, { em: '🚿', lb: '샤워' }, { em: '🍱', lb: '도시락' },
  { em: '☕', lb: '카페' }, { em: '💊', lb: '약' }, { em: '🌅', lb: '기상' }, { em: '⭐', lb: '특별' },
  { em: '🎨', lb: '미술' }, { em: '🎭', lb: '공연' }, { em: '🔬', lb: '과학' }, { em: '🎸', lb: '기타' },
  { em: '🎹', lb: '피아노' }, { em: '🏊', lb: '수영' }, { em: '🚴', lb: '자전거' }, { em: '🎤', lb: '노래' },
  { em: '🍕', lb: '피자' }, { em: '🍜', lb: '라면' }, { em: '🥗', lb: '샐러드' }, { em: '📝', lb: '메모' },
  { em: '🏆', lb: '트로피' }, { em: '💪', lb: '근력' }, { em: '🧠', lb: '두뇌' }, { em: '❤️', lb: '사랑' },
  { em: '🔥', lb: '불꽃' }, { em: '⚡', lb: '번개' }, { em: '☀️', lb: '햇빛' }, { em: '🎉', lb: '파티' },
]

// 기본 시간표 — 각 행 = [시간, 월, 화, 수, 목, 금, 토, 일]
export const DEFAULT_DATA = [
  ['9:00', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['9:30', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['10:00', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['10:30', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['11:00', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['11:30', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['12:00', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['12:30', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['13:00', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['13:30', 'S', 'S', 'S', 'S', 'S', 'D', 'C'],
  ['14:00', 'S', 'S', 'S', 'S', 'S', 'D', 'G'],
  ['14:30', 'S', 'S', 'S', 'S', 'S', 'D', 'G'],
  ['15:00', 'A', 'S', 'A', 'S', 'A', 'D', 'G'],
  ['15:30', 'R', 'A', 'R', 'A', 'R', 'D', 'R'],
  ['16:00', 'E', 'R', 'E', 'R', 'E', 'D', 'R'],
  ['16:30', 'E', 'E', 'E', 'E', 'E', 'D', 'X'],
  ['17:00', 'K', 'E', 'K', 'E', 'K', 'D', 'X'],
  ['17:30', 'K', 'K', 'K', 'K', 'K', 'D', 'G'],
  ['18:00', 'M', 'K', 'M', 'K', 'M', 'D', 'G'],
  ['18:30', 'M', 'M', 'M', 'M', 'M', 'D', 'G'],
  ['19:00', 'X', 'M', 'X', 'M', 'X', 'D', 'F'],
  ['19:30', 'X', 'X', 'X', 'X', 'X', 'D', 'F'],
  ['20:00', 'G', 'X', 'G', 'X', 'G', 'D', 'P'],
  ['20:30', 'G', 'G', 'G', 'G', 'G', 'D', 'P'],
  ['21:00', 'R', 'G', 'R', 'G', 'R', 'D', 'Z'],
  ['21:30', 'R', 'R', 'R', 'R', 'R', 'D', 'Z'],
  ['22:00', 'F', 'R', 'F', 'R', 'F', 'D', 'Z'],
  ['22:30', 'F', 'F', 'F', 'F', 'F', 'D', 'Z'],
  ['23:00', 'P', 'F', 'P', 'F', 'P', 'D', 'Z'],
  ['23:30', 'Z', 'P', 'Z', 'P', 'Z', 'D', 'Z'],
  ['0:00', 'Z', 'Z', 'Z', 'Z', 'Z', 'D', 'Z'],
]

// 셀 커스텀 키
export const ck = (r, c) => `${r}-${c}`

// 깊은 복제 (구조가 단순해 JSON 복제로 충분)
export const cloneData = (data) => data.map((row) => [...row])
export const cloneCust = (cust) => JSON.parse(JSON.stringify(cust || {}))

// 한 칸(30분)을 한 단위로 보고, 같은 코드가 연속되면 세로 병합할 길이 계산
export function computeSpans(data, manualMode) {
  const nR = data.length
  const nC = 7
  const spans = Array.from({ length: nC }, () => new Array(nR).fill(0))
  if (manualMode) return Array.from({ length: nC }, () => new Array(nR).fill(1))
  for (let c = 0; c < nC; c++) {
    let r = 0
    while (r < nR) {
      let sp = 1
      while (r + sp < nR && data[r + sp][c + 1] === data[r][c + 1]) sp++
      spans[c][r] = sp
      r += sp
    }
  }
  return spans
}

// 병합 블록 범위 찾기
export function findBlock(data, col, row, manualMode) {
  if (manualMode) return { col, startRow: row, endRow: row, code: data[row][col + 1] }
  const code = data[row][col + 1]
  let s = row
  let e = row
  while (s > 0 && data[s - 1][col + 1] === code) s--
  while (e < data.length - 1 && data[e + 1][col + 1] === code) e++
  return { col, startRow: s, endRow: e, code }
}

// 다음 행 시작 시각 (블록 끝 시간 표시용)
export function nextTime(data, row) {
  if (row + 1 < data.length) return data[row + 1][0]
  const [h, m] = data[row][0].split(':').map(Number)
  return `${(h + (m ? 1 : 0)) % 24}:${m ? '00' : '30'}`
}

// 칸 단위(30분) 개수 → "N시간 M분"
export function durText(n) {
  const h = Math.floor(n / 2)
  const m = (n % 2) * 30
  if (h && m) return `${h}시간 ${m}분`
  return h ? `${h}시간` : `${m}분`
}

// 한 칸의 표시 정보(아이콘/텍스트/색) — CUST 우선
export function cellDisp(data, cust, r, c) {
  const code = data[r][c + 1]
  const t = TYPES[code] || TYPES['_']
  const k = ck(r, c)
  const cu = cust[k]
  return {
    icon: cu && cu.icon !== undefined ? cu.icon : t.em,
    text: cu && cu.text !== undefined ? cu.text : t.lb,
    color: t.color,
    dashed: !!t.dashed,
    empty: !!t.empty,
    code,
  }
}
