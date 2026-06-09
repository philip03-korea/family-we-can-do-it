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

// 음성인식 오류코드 → 친절한 한국어 안내
function sttErrorMsg(code) {
  switch (code) {
    case 'no-speech':
      return '소리가 잘 안 들렸어요. 다시 또박또박 말해 주세요. 🎤'
    case 'not-allowed':
    case 'service-not-allowed':
      return '마이크 권한을 허용해 주세요.'
    case 'language-not-supported':
      return '이 기기에서 그 언어 음성인식이 안 될 수 있어요. 언어를 바꿔보세요.'
    case 'aborted':
      return '음성 입력이 취소됐어요.'
    default:
      return '잘 못 알아들었어요. 다시 한 번 말해 주세요.'
  }
}

/**
 * 한 번 듣고 인식 결과를 돌려준다. (Promise가 항상 settle 되도록 보장 → 마이크 멈춤 방지)
 * @param {object} opts { lang, timeout }
 * @returns {Promise<{transcript:string, confidence:number}>}
 */
export function listenOnce(opts = {}) {
  const { lang = 'en-US', timeout = 12000 } = opts
  return new Promise((resolve, reject) => {
    if (!isSTTSupported()) return reject(new Error('이 브라우저는 음성인식을 지원하지 않습니다.'))
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    let settled = false
    const finish = (fn, arg) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
      fn(arg)
    }
    // 무응답/엔진 멈춤 대비 안전 타임아웃
    const timer = setTimeout(() => finish(reject, new Error('음성을 듣지 못했어요. 다시 시도해 주세요. 🎤')), timeout)

    rec.onresult = (e) => {
      const result = e.results[0][0]
      finish(resolve, { transcript: result.transcript, confidence: result.confidence })
    }
    rec.onerror = (e) => finish(reject, new Error(sttErrorMsg(e.error)))
    rec.onnomatch = () => finish(reject, new Error('잘 못 알아들었어요. 다시 말해 주세요.'))
    // 결과 없이 끝나도 반드시 reject → 호출측 'listening' 상태가 풀린다
    rec.onend = () => finish(reject, new Error('음성을 인식하지 못했어요. 다시 시도해 주세요. 🎤'))

    try {
      rec.start()
    } catch {
      finish(reject, new Error('마이크를 시작할 수 없어요. 잠시 후 다시 시도해 주세요.'))
    }
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
