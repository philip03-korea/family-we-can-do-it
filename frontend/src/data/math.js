// ============================================================
// 수학 문제 자동 생성기 (객관식 + 풀이) — 외부 API 없음, 비용 0원
// 레벨: 초6·연산 → 중1 → 중2 → 중3
// 각 생성기는 { q, choices[4], answerIndex, solution } 를 반환
// ============================================================

const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[ri(0, arr.length - 1)]
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b))

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = ri(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 정답 + 보기들(문자열) → {choices, answerIndex}
function build(correct, distractors) {
  const list = [String(correct)]
  for (const d of distractors) {
    const s = String(d)
    if (!list.includes(s)) list.push(s)
  }
  // 부족하면 숫자 보정
  let n = Number(correct)
  let bump = 1
  while (list.length < 4) {
    const cand = Number.isFinite(n) ? String(n + bump) : `${correct}_${bump}`
    if (!list.includes(cand)) list.push(cand)
    bump++
  }
  const four = list.slice(0, 4)
  shuffle(four)
  return { choices: four, answerIndex: four.indexOf(String(correct)) }
}

// 숫자 정답용 가까운 오답 3개
function ndist(correct) {
  const offs = [1, -1, 2, -2, 3, -3, 4, -4, 5, 10, -10]
  const s = new Set()
  while (s.size < 3) {
    const v = correct + pick(offs)
    if (v !== correct) s.add(v)
  }
  return [...s]
}

// 부호 표기: "+ 3" / "- 3"
const sb = (n) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`)
const par = (n) => (n < 0 ? `(${n})` : `${n}`)

const P = (q, correct, distractors, solution) => {
  const { choices, answerIndex } = build(correct, distractors)
  return { q, choices, answerIndex, solution }
}

// ---------------- 초6 · 연산 ----------------
const elem = [
  () => { const a = ri(23, 99), b = ri(23, 99); return P(`${a} + ${b} = ?`, a + b, ndist(a + b), `${a} + ${b} = ${a + b}`) },
  () => { const a = ri(45, 99), b = ri(11, a - 1); return P(`${a} − ${b} = ?`, a - b, ndist(a - b), `${a} − ${b} = ${a - b}`) },
  () => { const a = ri(12, 25), b = ri(3, 9); return P(`${a} × ${b} = ?`, a * b, ndist(a * b), `${a} × ${b} = ${a * b}`) },
  () => { const b = ri(3, 9), x = ri(12, 30), a = b * x; return P(`${a} ÷ ${b} = ?`, x, ndist(x), `${a} ÷ ${b} = ${x} (${b} × ${x} = ${a})`) },
  () => { const p = pick([10, 20, 25, 50]), u = pick([100, 200, 300, 400, 500, 600, 800]); const ans = (u * p) / 100; return P(`${u}의 ${p}% 는?`, ans, ndist(ans), `${u} × ${p}/100 = ${ans}`) },
  () => {
    const g = ri(2, 6), pn = ri(1, 4), qn = ri(pn + 1, 7)
    const num = pn * g, den = qn * g
    const ans = gcd(pn, qn) === 1 ? `${pn}/${qn}` : `${pn / gcd(pn, qn)}/${qn / gcd(pn, qn)}`
    return P(`${num}/${den} 을 기약분수로 나타내면?`, ans, [`${pn + 1}/${qn}`, `${pn}/${qn + 1}`, `${num}/${den}`], `분자·분모를 최대공약수 ${g}로 나누면 ${ans}`)
  },
  () => { const a = pick([4, 6, 8, 9, 12]), b = pick([6, 8, 9, 10, 12]); const l = (a * b) / gcd(a, b); return P(`${a}와 ${b}의 최소공배수는?`, l, ndist(l), `최소공배수 = ${a}×${b} ÷ 최대공약수(${gcd(a, b)}) = ${l}`) },
]

// ---------------- 중1 ----------------
const m1 = [
  () => {
    const op = pick(['+', '−', '×']); const a = ri(-9, 9), b = ri(-9, 9)
    const ans = op === '+' ? a + b : op === '−' ? a - b : a * b
    return P(`${par(a)} ${op} ${par(b)} = ?`, ans, ndist(ans), `${par(a)} ${op} ${par(b)} = ${ans}`)
  },
  () => {
    let a = ri(2, 6), x = ri(-6, 6); let b = ri(-9, 9); if (b === 0) b = 2
    const c = a * x + b
    return P(`${a}x ${sb(b)} = ${c} 일 때, x = ?`, x, ndist(x), `${a}x = ${c} − (${b}) = ${c - b}\nx = ${c - b} ÷ ${a} = ${x}`)
  },
  () => {
    const a = ri(2, 5); let b = ri(-5, 5); if (b === 0) b = 3; const x = ri(-4, 6)
    const v = a * x + b
    return P(`x = ${x} 일 때, ${a}x ${sb(b)} 의 값은?`, v, ndist(v), `${a}×(${x}) ${sb(b)} = ${a * x} ${sb(b)} = ${v}`)
  },
  () => {
    const a = ri(2, 5), f = ri(2, 4), c = a * f, b = ri(2, 6); const x = b * f
    return P(`비례식 ${a} : ${b} = ${c} : ? 에서 ?는?`, x, ndist(x), `${a}:${b} = ${c}:? → ? = ${b} × (${c}÷${a}) = ${b} × ${f} = ${x}`)
  },
]

// ---------------- 중2 ----------------
const m2 = [
  () => { const m = ri(2, 5), n = ri(2, 5); return P(`x^${m} × x^${n} = ?`, `x^${m + n}`, [`x^${m * n}`, `x^${m + n + 1}`, `x^${Math.abs(m - n) || 1}`], `지수법칙: 밑이 같으면 지수를 더한다 → x^(${m}+${n}) = x^${m + n}`) },
  () => { const a = ri(2, 5), k = ri(1, 6), c = a * k; return P(`${a}x > ${c} 의 해는?`, `x > ${k}`, [`x < ${k}`, `x > ${k + 1}`, `x ≥ ${k}`], `양변을 ${a}로 나누면 x > ${c}÷${a} = ${k}`) },
  () => { const x = ri(1, 6), y = ri(1, 6); const s = x + y, d = x - y; return P(`x + y = ${s},  x − y = ${d} 일 때 x 는?`, x, ndist(x), `두 식을 더하면 2x = ${s} + (${d}) = ${s + d}, x = ${x}`) },
  () => { const a = ri(2, 5); let b = ri(-5, 5); if (b === 0) b = 2; const k = ri(-3, 5); const v = a * k + b; return P(`f(x) = ${a}x ${sb(b)} 일 때 f(${k}) 는?`, v, ndist(v), `f(${k}) = ${a}×(${k}) ${sb(b)} = ${v}`) },
]

// ---------------- 중3 ----------------
const m3 = [
  () => { const n = ri(4, 15), sq = n * n; return P(`√${sq} = ?`, n, ndist(n), `${n} × ${n} = ${sq} 이므로 √${sq} = ${n}`) },
  () => {
    const a = ri(1, 6), b = ri(1, 6)
    return P(`(x + ${a})(x + ${b}) 를 전개하면?`, `x² + ${a + b}x + ${a * b}`,
      [`x² + ${a * b}x + ${a + b}`, `x² + ${a + b}x + ${a + b}`, `x² + ${a * b}x + ${a * b}`],
      `합 ${a}+${b}=${a + b}, 곱 ${a}×${b}=${a * b} → x² + ${a + b}x + ${a * b}`)
  },
  () => {
    const a = ri(1, 6), b = ri(1, 6)
    return P(`x² + ${a + b}x + ${a * b} 을 인수분해하면?`, `(x + ${a})(x + ${b})`,
      [`(x + ${a + b})(x + ${a * b})`, `(x + ${a})(x − ${b})`, `(x − ${a})(x − ${b})`],
      `더해서 ${a + b}, 곱해서 ${a * b} 인 두 수: ${a}, ${b} → (x + ${a})(x + ${b})`)
  },
  () => {
    const r1 = ri(1, 6); let r2 = ri(1, 6); const b = -(r1 + r2), c = r1 * r2
    const ans = r1 === r2 ? `x = ${r1}` : `x = ${r1} 또는 x = ${r2}`
    return P(`x² ${sb(b)}x ${sb(c)} = 0 의 해는?`, ans,
      [`x = ${-r1} 또는 x = ${-r2}`, `x = ${r1} 또는 x = ${r2 + 1}`, `x = ${r1 + 1} 또는 x = ${r2}`],
      `인수분해: (x − ${r1})(x − ${r2}) = 0 → x = ${r1} 또는 x = ${r2}`)
  },
]

export const MATH_LEVELS = [
  { key: 'elem', label: '초6·연산', desc: '두 자리↑ 사칙연산·분수·비율', gens: elem },
  { key: 'm1', label: '중1', desc: '정수·유리수·일차방정식·문자식', gens: m1 },
  { key: 'm2', label: '중2', desc: '지수·부등식·연립·일차함수', gens: m2 },
  { key: 'm3', label: '중3', desc: '제곱근·전개·인수분해·이차방정식', gens: m3 },
]

export function genProblem(levelKey) {
  const lv = MATH_LEVELS.find((l) => l.key === levelKey) || MATH_LEVELS[0]
  return pick(lv.gens)()
}
