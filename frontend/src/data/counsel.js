// ============================================================
// 하23 · 심리상담전문가 — 자가검사 문항 / 채점 / 해석 / 위기개입
//
// ⚠️ 모든 검사는 국제 표준 스크리닝 도구이지만 "정식 진단 도구가 아니다".
//    위험군을 조기에 선별하는 참고용이며, 확진에는 전문가 평가가 필요하다.
//    (출처: 하23 SKILL.md / references/무료-상담-검사지.md)
// ============================================================

export const DISCLAIMER =
  '이 검사는 정식 심리검사·진단이 아니라 자기이해를 돕는 참고용 자가검사예요. ' +
  '확진이나 처방 목적이 아니며, 결과가 걱정된다면 전문가(정신건강의학과·상담센터) 평가를 받아보세요.'

// ── 비밀보장의 한계 고지 (하23 상담 윤리) ────────────────────
// ⚠️ 이 문구는 실제 동작과 반드시 일치해야 한다.
//    "비공개"라고 말해놓고 몰래 열람하는 구조는 만들지 않는다.
//    실제 상담 현장의 '비밀보장과 그 한계' 고지를 그대로 따른다.
export const CHILD_KEYS = ['haeum', 'haul', 'haram']
export const PARENT_KEYS = ['mom', 'dad']

export const CONFIDENTIALITY = {
  // 자녀 계정 — 검사 시작 전 반드시 보여준다
  child: {
    title: '먼저 약속할게',
    private: '네 답은 기본적으로 너만 봐. 점수도, 답한 내용도 엄마·아빠한테 안 보여.',
    limit:
      '딱 하나 예외가 있어. 네가 스스로를 해치고 싶다는 답을 하면, ' +
      '그때는 엄마·아빠 폰으로 바로 알림이 갈 거야. ' +
      '숨기려는 게 아니라 미리 말해주는 거고, 네가 걱정돼서야.',
    why: '그러니까 편하게 솔직하게 답해줘. 솔직한 답이 너한테 제일 도움이 돼.',
  },
  // 부모 계정 — 본인 결과는 완전 비공개
  parent: {
    title: '안내',
    private: '결과는 본인만 봅니다. 가족에게 자동으로 공유되지 않아요.',
    limit: '나누고 싶은 결과만 직접 "가족회의에서 나누기"로 공유할 수 있어요.',
    why: '',
  },
}

/** 이 계정의 답이 위기 시 부모에게 알려지는가 */
export const notifiesParents = (memberKey) => CHILD_KEYS.includes(memberKey)

// ── 위기상담 핫라인 (2026 기준: 舊 1393 → 109 통합) ──────────
export const HOTLINES = [
  { num: '109', name: '자살예방 통합상담', desc: '24시간 · 전국 · 무료 · 비밀보장', urgent: true },
  { num: '1577-0199', name: '정신건강 위기상담', desc: '24시간 · 정신건강전문요원 · 의료기관 연계', urgent: true },
  { num: '1388', name: '청소년 전화', desc: '만 24세 이하 · 24시간 · 문자상담 가능' },
  { num: '1366', name: '여성긴급전화', desc: '가정폭력·성폭력 등 위기' },
  { num: '1588-9191', name: '생명의전화', desc: '민간 · 24시간' },
  { num: '117', name: '학교폭력 신고', desc: '학생·보호자 · 24시간' },
]

export const CHAT_HELP = {
  name: '마들랜 (마음을 들어주는 랜선친구)',
  url: 'https://www.129.go.kr/etc/madlan',
  desc: '전화가 부담스러우면 채팅 상담 — 보건복지부',
}

export const CENTER_FINDER = {
  name: '가까운 정신건강복지센터 찾기',
  url: 'https://www.mentalhealth.go.kr',
  desc: '서류·진단서 없이 무료 이용 가능',
}

// ── 검사 문항은 data/tests.js 로 분리 (11종) ──────────────────
// ⚠️ 문항을 임의로 만들지 않는다. 전부 검증된 무료/퍼블릭도메인 표준 도구.
export { TESTS, TEST_LIST, TEST_GROUPS } from './tests'
import { TESTS } from './tests'

// ============================================================
// 채점 엔진
//   kind: 'score'   → 총점 하나 + 구간 해석
//   kind: 'profile' → 하위척도별 점수(빅파이브·SDQ). 총점/구간 없음.
// ============================================================

const scaleRange = (t) => {
  const vs = t.scale.map((s) => s.v)
  return { lo: Math.min(...vs), hi: Math.max(...vs) }
}

/** 역채점 값 변환: (최대+최소) - v */
const flip = (v, lo, hi) => hi + lo - Number(v)

/**
 * @param testKey 검사 키
 * @param answers 문항 순서대로의 응답값 배열
 * @returns { score, max, level, crisis, subscores }
 *          profile 검사면 score=null, level=null, subscores={dimKey: {raw, max, min, pct}}
 */
export function scoreTest(testKey, answers) {
  const t = TESTS[testKey]
  if (!t) throw new Error('알 수 없는 검사: ' + testKey)
  const { lo, hi } = scaleRange(t)

  // 위기문항(PHQ-9 9번)은 어떤 검사 유형이든 최우선으로 판정
  const crisis = t.crisisIndex != null && Number(answers[t.crisisIndex]) >= 1

  // ── 다차원(프로필) 검사 ──
  if (t.kind === 'profile') {
    const subscores = {}
    for (const d of t.dimensions) {
      const idxs = t.keying
        .map((k, i) => (k.d === d.key ? i : -1))
        .filter((i) => i >= 0)
      let raw = 0
      for (const i of idxs) {
        const v = Number(answers[i] ?? lo)
        raw += t.keying[i].s === -1 ? flip(v, lo, hi) : v
      }
      const dMin = idxs.length * lo
      const dMax = idxs.length * hi
      subscores[d.key] = {
        raw,
        min: dMin,
        max: dMax,
        pct: dMax === dMin ? 0 : Math.round(((raw - dMin) / (dMax - dMin)) * 100),
      }
    }
    return { score: null, max: null, level: null, crisis, subscores }
  }

  // ── 총점형 검사 ──
  let score = 0
  answers.forEach((a, i) => {
    const v = Number(a)
    score += t.reverse?.includes(i) ? flip(v, lo, hi) : v
  })
  const level = t.levels.find((l) => score <= l.max) || t.levels[t.levels.length - 1]
  return { score, max: t.max, level, crisis, subscores: null }
}

/** WHO-5 처럼 환산점수를 쓰는 검사의 표시용 점수 */
export function displayScore(testKey, score) {
  const t = TESTS[testKey]
  if (!t) return score
  if (t.scoreMultiplier) return score * t.scoreMultiplier
  if (t.meanScore) return (score / t.questions.length).toFixed(2)
  return score
}
export function displayMax(testKey) {
  const t = TESTS[testKey]
  if (!t) return 0
  if (t.scoreMultiplier) return t.max * t.scoreMultiplier
  if (t.meanScore) return '5.00'
  return t.max
}

/** 결과 톤 → 색상 클래스 */
export const TONE_STYLE = {
  good:  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300' },
  ok:    { bg: 'bg-sky-500/15',     border: 'border-sky-500/40',     text: 'text-sky-300' },
  warn:  { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-300' },
  alert: { bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    text: 'text-rose-300' },
}
