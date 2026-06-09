// ============================================================
// 무료 TTS — 브라우저 내장 음성합성(Web Speech API) 사용
// API 비용 0원. 기기에 설치된 영어 음성으로 단어/문장을 읽어줌.
// (나중에 클라우드 TTS가 필요하면 speakCloud 같은 함수를 추가해
//  audio_cache 캐싱 로직과 연결하면 됨 — docs/작업계획서 참고)
// ============================================================

let cachedVoices = null

// 모듈 로드 시 음성 목록을 미리 받아 캐싱한다.
// (iOS는 speak() 안에서 await 하면 '사용자 클릭' 컨텍스트가 끊겨 무음이 됨 →
//  미리 캐싱해 두고 speak()는 동기적으로 재생해야 한다.)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const grab = () => {
    const v = window.speechSynthesis.getVoices()
    if (v.length) cachedVoices = v
  }
  grab()
  window.speechSynthesis.addEventListener?.('voiceschanged', grab)
}

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

/**
 * iOS 오디오 잠금 해제용. 첫 사용자 제스처(탭) 안에서 한 번 호출하면
 * 이후 speak()가 정상 동작한다. (무음의 짧은 발화로 엔진을 깨움)
 */
export function primeTTS() {
  if (!isTTSSupported()) return
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    window.speechSynthesis.speak(u)
    window.speechSynthesis.resume()
  } catch {
    /* noop */
  }
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
export function speak(text, opts = {}) {
  if (!isTTSSupported() || !text) return Promise.resolve()
  const { lang = 'en-US', rate = 0.95, pitch = 1, voiceURI } = opts
  const synth = window.speechSynthesis

  // 이전 발화 중지 (버튼 연타 대비)
  synth.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = rate
  utter.pitch = pitch

  // ⚠️ 동기적으로만 음성 선택 (await 금지 — iOS 클릭 제스처 유지).
  // 캐시가 비어 있으면 voice 없이 lang 기준 기본 음성으로 재생하고,
  // 다음을 위해 캐시를 백그라운드로 채운다.
  const voices = cachedVoices || synth.getVoices()
  if (voices?.length) {
    cachedVoices = voices
    const voice = voiceURI
      ? voices.find((v) => v.voiceURI === voiceURI)
      : pickEnglishVoice(voices, lang)
    if (voice) utter.voice = voice
  } else {
    loadVoices()
  }

  return new Promise((resolve) => {
    utter.onend = () => resolve()
    utter.onerror = () => resolve()
    synth.speak(utter)
    // iOS/일부 브라우저가 발화를 일시정지 상태로 두는 경우 대비
    if (synth.paused) synth.resume()
  })
}

export function stopSpeaking() {
  if (isTTSSupported()) window.speechSynthesis.cancel()
}
