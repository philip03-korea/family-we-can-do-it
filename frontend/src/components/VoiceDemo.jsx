import { useEffect, useState } from 'react'
import { speak, isTTSSupported, loadVoices } from '../lib/tts'
import { listenOnce, isSTTSupported, scorePronunciation } from '../lib/stt'

// 무료 음성으로 계속 따라 말하기 연습할 수 있는 문장들
const SAMPLES = [
  'How are you today?',
  'Nice to meet you.',
  'What did you do this weekend?',
  'Can you help me, please?',
  'I would like a cup of coffee.',
  'Where is the nearest station?',
  'What time does it start?',
  'I really enjoyed the movie.',
  'Let me think about it.',
  'Thank you so much for your help.',
]

// 무료 TTS/STT 따라 말하기 연습 (비용 0원)
export default function VoiceDemo() {
  const [i, setI] = useState(0)
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const ttsOk = isTTSSupported()
  const sttOk = isSTTSupported()
  const sample = SAMPLES[i]

  useEffect(() => {
    if (ttsOk) loadVoices()
  }, [ttsOk])

  function next() {
    setResult(null)
    setError('')
    const ni = (i + 1) % SAMPLES.length
    setI(ni)
    if (ttsOk) speak(SAMPLES[ni])
  }

  async function handleListen() {
    setError('')
    setResult(null)
    setListening(true)
    try {
      const { transcript } = await listenOnce({ lang: 'en-US' })
      setResult({ transcript, ...scorePronunciation(sample, transcript) })
    } catch (e) {
      setError(e.message)
    } finally {
      setListening(false)
    }
  }

  return (
    <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <p className="text-slate-400 text-xs">따라 말하기 연습 (무료 · 0원)</p>
        <span className="text-slate-500 text-xs tabular-nums">
          {i + 1}/{SAMPLES.length}
        </span>
      </div>
      <p className="text-xl font-bold mb-4">"{sample}"</p>

      <div className="flex gap-2">
        <button onClick={() => speak(sample)} disabled={!ttsOk} className="flex-1 py-3 rounded-xl bg-indigo-600 font-medium disabled:opacity-40">
          🔊 듣기
        </button>
        {sttOk && (
          <button
            onClick={handleListen}
            disabled={listening}
            className={`flex-1 py-3 rounded-xl font-medium disabled:opacity-40 ${listening ? 'bg-rose-600' : 'bg-emerald-600'}`}
          >
            <span className="text-white">{listening ? '🎙 듣는 중…' : '🎤 따라 말하기'}</span>
          </button>
        )}
        <button onClick={next} className="px-4 py-3 rounded-xl bg-slate-700 font-medium" title="다음 문장">
          다음 →
        </button>
      </div>

      {!ttsOk && <p className="text-amber-300 text-xs mt-3">이 기기는 음성합성을 지원하지 않습니다.</p>}
      {!sttOk && <p className="text-slate-400 text-xs mt-3">이 기기는 음성인식 미지원 — 듣기로 연습하고 다음 문장으로 넘겨보세요.</p>}
      {error && <p className="text-amber-300 text-xs mt-3">⚠️ {error}</p>}

      {result && (
        <div className="mt-4 bg-slate-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">발음 점수</span>
            <span className={`text-2xl font-black ${result.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{result.score}점</span>
          </div>
          <p className="text-sm text-slate-300">
            인식: <span className="text-white">"{result.transcript}"</span>
          </p>
          {result.missed?.length > 0 && <p className="text-xs text-rose-300 mt-1">놓친 단어: {result.missed.join(', ')}</p>}
          <button onClick={next} className="mt-3 w-full py-2 rounded-lg bg-slate-700 text-sm font-medium">
            다음 문장 →
          </button>
        </div>
      )}
    </div>
  )
}
