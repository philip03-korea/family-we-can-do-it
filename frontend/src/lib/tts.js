// ============================================================
// 무료 TTS — 브라우저 내장 음성합성(Web Speech API) 사용
// API 비용 0원. 기기에 설치된 영어 음성으로 단어/문장을 읽어줌.
// (나중에 클라우드 TTS가 필요하면 speakCloud 같은 함수를 추가해
//  audio_cache 캐싱 로직과 연결하면 됨 — docs/작업계획서 참고)
// ============================================================

let cachedVoices = null

/** 사용 가능한 음성 목록을 로드 (브라우저가 비동기로 채워줌) */
export function loadVoices() {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve([])
    const existing = window.speechSynthesis.getVoices()
    if (existing.length) {
      cachedVoices = existing
      return resolve(existing)
    }
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }
  })
}

/** 영어(en-*) 음성 중 가장 적절한 것을 고름 */
function pickEnglishVoice(voices, preferLang = 'en-US') {
  if (!voices?.length) return null
  return (
    voices.find((v) => v.lang === preferLang) ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0]
  )
}

export function isTTSSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * 텍스트를 읽어준다.
 * @param {string} text 읽을 영어 텍스트
 * @param {object} opts { lang, rate(0.5~1.5), pitch, voiceURI }
 * @returns {Promise<void>} 재생 완료 시 resolve
 */
export async function speak(text, opts = {}) {
  if (!isTTSSupported() || !text) return
  const { lang = 'en-US', rate = 0.95, pitch = 1, voiceURI } = opts

  // 이전 발화 중지 (버튼 연타 대비)
  window.speechSynthesis.cancel()

  const voices = cachedVoices || (await loadVoices())
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = rate
  utter.pitch = pitch
  const voice = voiceURI
    ? voices.find((v) => v.voiceURI === voiceURI)
    : pickEnglishVoice(voices, lang)
  if (voice) utter.voice = voice

  return new Promise((resolve) => {
    utter.onend = () => resolve()
    utter.onerror = () => resolve()
    window.speechSynthesis.speak(utter)
  })
}

export function stopSpeaking() {
  if (isTTSSupported()) window.speechSynthesis.cancel()
}
