// 문제은행 · 경시 · 요리에서 쓰는 가벼운 로컬 저장.
//
// 서버(Supabase) 테이블을 새로 만들지 않고 브라우저에만 남긴다.
// 기기를 바꾸면 초기화되지만 마이그레이션이 필요 없고, "언제든 풀 수 있게"라는
// 목적에는 충분하다. 가족 공유가 필요해지면 그때 테이블로 올린다.

const NS = 'famtalk'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(`${NS}:${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(`${NS}:${key}`, JSON.stringify(value))
  } catch {
    /* 사파리 프라이빗 모드 등 — 저장 실패는 조용히 넘긴다 */
  }
}

// ── 문제 풀이 기록: { [문제id]: { correct: bool, at: ISO } }
export function getAttempts(bank, who = 'me') {
  return read(`attempts:${bank}:${who}`, {})
}
export function recordAttempt(bank, who, id, correct) {
  const cur = getAttempts(bank, who)
  cur[id] = { correct, at: new Date().toISOString() }
  write(`attempts:${bank}:${who}`, cur)
  return cur
}
export function resetAttempts(bank, who = 'me') {
  write(`attempts:${bank}:${who}`, {})
  return {}
}

// 과목별 성적 요약
export function summarize(attempts, questions) {
  let done = 0
  let right = 0
  for (const q of questions) {
    const a = attempts[q.id]
    if (!a) continue
    done += 1
    if (a.correct) right += 1
  }
  return { done, right, total: questions.length, rate: done ? Math.round((right / done) * 100) : null }
}

// ── 즐겨찾기: 문자열 id 배열
export function getFavorites(kind, who = 'me') {
  return read(`fav:${kind}:${who}`, [])
}
export function toggleFavorite(kind, who, id) {
  const cur = getFavorites(kind, who)
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  write(`fav:${kind}:${who}`, next)
  return next
}
