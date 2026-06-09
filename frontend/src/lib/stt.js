// ============================================================
// 무료 STT — 브라우저 내장 음성인식(Web Speech Recognition) 사용
// API 비용 0원. 사용자가 말한 영어를 텍스트로 받아 목표 문장과 비교.
// (정밀 억양/피치 점수가 필요해지면 나중에 Whisper + 발음평가 API를
//  선택 기능으로 추가 — docs/작업계획서 참고)
// ============================================================

export function isSTTSupported() {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

/**
 * 한 번 듣고 인식 결과를 돌려준다.
 * @param {object} opts { lang }
 * @returns {Promise<{transcript:string, confidence:number}>}
 */
export function listenOnce(opts = {}) {
  const { lang = 'en-US' } = opts
  return new Promise((resolve, reject) => {
    if (!isSTTSupported()) return reject(new Error('이 브라우저는 음성인식을 지원하지 않습니다.'))
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onresult = (e) => {
      const result = e.results[0][0]
      resolve({ transcript: result.transcript, confidence: result.confidence })
    }
    rec.onerror = (e) => reject(new Error(e.error || '음성인식 오류'))
    rec.onend = () => {} // 결과 없이 끝나면 onresult 미호출 → 호출측 타임아웃 처리
    rec.start()
  })
}

/** 정규화: 소문자, 구두점 제거, 공백 정리 */
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[.,!?;:"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 목표 문장과 인식 결과를 단어 단위로 비교해 0~100 점수 산출.
 * (무료 1차 채점 — 단어 일치율 기반. 억양 점수는 추후 확장)
 */
export function scorePronunciation(target, spoken) {
  const t = normalize(target).split(' ').filter(Boolean)
  const s = new Set(normalize(spoken).split(' ').filter(Boolean))
  if (!t.length) return { score: 0, matched: [], missed: [] }
  const matched = t.filter((w) => s.has(w))
  const missed = t.filter((w) => !s.has(w))
  return {
    score: Math.round((matched.length / t.length) * 100),
    matched,
    missed,
  }
}
