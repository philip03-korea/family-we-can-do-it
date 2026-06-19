// ============================================================
// 버튼 효과음 — Web Audio API로 짧은 클릭/성공/실패음 생성 (음원 파일 0개)
// 설정은 localStorage('famtalk_sound')에 저장. 기본 ON.
// ============================================================

let ctx = null
function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function isSoundOn() {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem('famtalk_sound') !== 'off'
}
export function setSoundOn(on) {
  try {
    localStorage.setItem('famtalk_sound', on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}

function blip(freq = 660, dur = 0.06, type = 'sine', gain = 0.06) {
  const c = ac()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(c.destination)
  const t = c.currentTime
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t)
  osc.stop(t + dur)
}

export function playClick() {
  if (!isSoundOn()) return
  blip(620, 0.05, 'triangle', 0.05)
}
export function playSuccess() {
  if (!isSoundOn()) return
  blip(660, 0.08, 'sine', 0.07)
  setTimeout(() => blip(990, 0.1, 'sine', 0.07), 70)
}
export function playError() {
  if (!isSoundOn()) return
  blip(200, 0.18, 'sawtooth', 0.05)
}

// 앱 전역 버튼 클릭에 효과음 1줄 연결 (main.jsx에서 1회 호출)
export function initButtonSound() {
  if (typeof document === 'undefined') return
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!isSoundOn()) return
      const el = e.target.closest && e.target.closest('button, a, [role="button"]')
      if (el && !el.disabled) playClick()
    },
    { passive: true },
  )
}
