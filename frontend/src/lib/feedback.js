// ============================================================
// 칭찬·격려 메시지 — 발음 점수(0~100)와 뜻 회상 결과에 따라
// 다양한 한국어 응원/위로 문구를 돌려준다. (언어학습 동기부여)
// ============================================================

const PRAISE_HIGH = [
  '완벽해요! 🎉',
  '원어민 같아요! 🌟',
  '발음이 아주 좋아요! 👏',
  '최고예요, 정말 잘했어요! 💯',
  '훌륭해요! 이대로 계속! 🔥',
]
const PRAISE_GOOD = [
  '잘했어요! 👍',
  '좋아요, 거의 다 맞았어요!',
  '아주 좋아요! 조금만 더 또렷하게 😊',
  '멋져요! 발음이 점점 좋아져요 ✨',
]
const ENCOURAGE_MID = [
  '괜찮아요! 한 번 더 해볼까요? 💪',
  '좋은 시도예요! 또박또박 다시 도전 🙂',
  '거의 다 왔어요! 천천히 한 번 더 🎯',
]
const ENCOURAGE_LOW = [
  '괜찮아요, 처음엔 누구나 그래요 🤗',
  '천천히 또박또박 말해봐요. 응원해요! 💖',
  '포기하지 마요! 🔊 듣기 먼저 한 번 더 들어볼까요? 🎧',
  '잘하고 있어요. 한 단어씩 천천히! 🌱',
]

const RECALL_OK = ['정답이에요! 🎉', '맞았어요! 잘 알고 있네요 👏', '딩동댕! 완벽해요 🌟', '정확해요, 멋져요! 💯']
const RECALL_NO = [
  '음, 조금 달라요. 뜻을 확인해봐요 🙂',
  '거의! 아래 뜻 보기로 확인해볼까요? 💪',
  '괜찮아요, 이제 뜻을 확인해봐요 🌱',
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

/** 발음 점수(0~100)에 대한 피드백 메시지 + 톤 */
export function scoreFeedback(score) {
  if (score >= 85) return { msg: pick(PRAISE_HIGH), good: true }
  if (score >= 70) return { msg: pick(PRAISE_GOOD), good: true }
  if (score >= 45) return { msg: pick(ENCOURAGE_MID), good: false }
  return { msg: pick(ENCOURAGE_LOW), good: false }
}

/** 한국어 뜻 회상 정답 여부 메시지 */
export function recallFeedback(correct) {
  return { msg: correct ? pick(RECALL_OK) : pick(RECALL_NO), good: correct }
}

/** 말한 한국어가 단어의 뜻과 맞는지 느슨하게 비교 */
export function meaningMatches(meaningKo, transcript) {
  const norm = (s) => (s || '').toLowerCase().replace(/[\s.,!?;:~()"'/]/g, '')
  const t = norm(transcript)
  if (!t) return false
  const keywords = (meaningKo || '')
    .split(/[,/·~()\s]+/)
    .map(norm)
    .filter((k) => k.length >= 1)
  return keywords.some((k) => k && (t.includes(k) || k.includes(t)))
}
