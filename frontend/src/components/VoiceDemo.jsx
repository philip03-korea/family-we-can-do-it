import { useEffect, useState } from 'react'
import { speak, isTTSSupported, loadVoices } from '../lib/tts'
import { listenOnce, isSTTSupported, scorePronunciation } from '../lib/stt'

const SAMPLE = 'How are you today?'

// 무료 TTS/STT가 실제로 동작하는지 확인하는 미니 데모 (비용 0원)
export default function VoiceDemo() {
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const ttsOk = isTTSSupported()
  const sttOk = isSTTSupported()

  useEffect(() => {
    // 음성 목록 미리 로드 (빈 문자열 speak는 무음 발화라 의미 없음 → loadVoices)
    if (ttsOk) loadVoices()
  }, [ttsOk])

  async function handleListen() {
    setError('')
    setResult(null)
    setListening(true)
    try {
      const { transcript, confidence } = await listenOnce({ lang: 'en-US' })
      const score = scorePronunciation(SAMPLE, transcript)
      setResult({ transcript, confidence, ...score })
    } catch (e) {
      setError(e.message)
    } finally {
      setListening(false)
    }
  }

  return (
    <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700">
      <p className="text-slate-400 text-xs mb-1">무료 음성 데모 (API 비용 0원)</p>
      <p className="text-xl font-bold mb-4">"{SAMPLE}"</p>

      <div className="flex gap-3">
        <button
          onClick={() => speak(SAMPLE)}
          disabled={!ttsOk}
          className="flex-1 py-3 rounded-xl bg-indigo-600 font-medium disabled:opacity-40"
        >
          🔊 듣기
        </button>
        <button
          onClick={handleListen}
          disabled={!sttOk || listening}
          className={`flex-1 py-3 rounded-xl font-medium disabled:opacity-40 ${
            listening ? 'bg-rose-600 relative ripple text-rose-600' : 'bg-emerald-600'
          }`}
        >
          <span className="relative z-10 text-white">{listening ? '🎙 듣는 중…' : '🎤 따라 말하기'}</span>
        </button>
      </div>

      {!ttsOk && <p className="text-amber-300 text-xs mt-3">이 기기는 음성합성을 지원하지 않습니다.</p>}
      {!sttOk && <p className="text-amber-300 text-xs mt-3">이 브라우저는 음성인식을 지원하지 않습니다. (Chrome 권장)</p>}
      {error && <p className="text-amber-300 text-xs mt-3">⚠️ {error}</p>}

      {result && (
        <div className="mt-4 bg-slate-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">발음 점수</span>
            <span className={`text-2xl font-black ${result.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {result.score}점
            </span>
          </div>
          <p className="text-sm text-slate-300">
            인식: <span className="text-white">"{result.transcript}"</span>
          </p>
          {result.missed.length > 0 && (
            <p className="text-xs text-rose-300 mt-1">놓친 단어: {result.missed.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  )
}
