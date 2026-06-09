import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStudyQueue, saveProgress, logSpeechAttempt } from '../lib/db'
import { schedule, previewInterval, RATINGS } from '../lib/fsrs'
import { speak, isTTSSupported } from '../lib/tts'
import { listenOnce, isSTTSupported, scorePronunciation } from '../lib/stt'
import { LEVELS } from '../data/family'

export default function Study() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const level = profile?.level || 'B'
  const levelBg = LEVELS[level]?.bg || 'bg-level-b'

  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([]) // [{word, progress}]
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState('')

  // 발음
  const [listening, setListening] = useState(false)
  const [speechResult, setSpeechResult] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { due, fresh, progressById } = await getStudyQueue(user.id, level, 10)
        const items = [...due, ...fresh].map((w) => ({ word: w, progress: progressById[w.id] || null }))
        if (alive) setQueue(items)
      } catch (e) {
        if (alive) setError(e.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user.id, level])

  const current = queue[idx]

  const handleReveal = useCallback(() => {
    setRevealed(true)
    if (current) speak(current.word.term)
  }, [current])

  async function handleSpeak() {
    if (!current) return
    setListening(true)
    setSpeechResult(null)
    const target = current.word.example_en || current.word.term
    try {
      const { transcript } = await listenOnce({ lang: 'en-US' })
      const res = scorePronunciation(target, transcript)
      setSpeechResult({ transcript, ...res })
      await logSpeechAttempt(user.id, {
        wordId: current.word.id,
        targetText: target,
        transcript,
        score: res.score,
      }).catch(() => {})
    } catch (e) {
      setSpeechResult({ error: e.message })
    } finally {
      setListening(false)
    }
  }

  async function rate(g) {
    if (!current) return
    const sched = schedule(current.progress, g, Date.now())
    try {
      await saveProgress(user.id, current.word.id, sched)
    } catch (e) {
      setError(e.message)
    }

    // 다음 카드 준비
    setRevealed(false)
    setSpeechResult(null)

    if (g === 1) {
      // '다시'는 이번 세션 뒤쪽으로 다시 보냄
      setQueue((q) => {
        const next = [...q]
        const [item] = next.splice(idx, 1)
        next.push({ ...item, progress: sched })
        return next
      })
      // idx 그대로 두면 splice로 당겨진 다음 카드가 옴
      return
    }

    setDone((d) => d + 1)
    if (idx + 1 >= queue.length) {
      setIdx(queue.length) // 종료 트리거
    } else {
      setIdx((i) => i + 1)
    }
  }

  if (loading) return <Center>단어 불러오는 중…</Center>
  if (error) return <Center>⚠️ {error}</Center>

  // 큐 없음 또는 종료
  if (!queue.length || idx >= queue.length) {
    return (
      <Center>
        <div className="text-center">
          <div className="text-6xl mb-4">{queue.length ? '🎉' : '☕'}</div>
          <h2 className="text-2xl font-bold mb-2">
            {queue.length ? '오늘 학습 완료!' : '복습할 단어가 없어요'}
          </h2>
          <p className="text-slate-400 mb-6">
            {queue.length ? `${done}개 단어를 학습했어요.` : '내일 다시 만나요 🌙'}
          </p>
          <button onClick={() => navigate('/')} className={`${levelBg} px-6 py-3 rounded-xl font-bold`}>
            대시보드로
          </button>
        </div>
      </Center>
    )
  }

  const w = current.word
  const target = w.example_en || w.term

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 flex flex-col">
      {/* 진행바 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">
          ← 나가기
        </button>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={levelBg + ' h-full transition-all'}
            style={{ width: `${(done / (done + queue.length - idx)) * 100 || 0}%` }}
          />
        </div>
        <span className="text-slate-400 text-sm tabular-nums">
          {done}/{done + (queue.length - idx)}
        </span>
      </div>

      {/* 카드 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`${levelBg} w-full rounded-3xl p-8 text-center shadow-xl`}>
          <p className="text-white/70 text-sm mb-1">레벨 {w.level}{w.pos ? ` · ${w.pos}` : ''}</p>
          <h1 className="text-4xl font-black text-white mb-3">{w.term}</h1>
          <button
            onClick={() => speak(w.term)}
            disabled={!isTTSSupported()}
            className="text-white/90 bg-black/20 px-4 py-2 rounded-full text-sm disabled:opacity-40"
          >
            🔊 듣기
          </button>

          {revealed && (
            <div className="mt-6 pt-6 border-t border-white/20 text-left space-y-2">
              <p className="text-white text-2xl font-bold text-center">{w.meaning_ko}</p>
              {w.example_en && (
                <div className="bg-black/15 rounded-xl p-3 mt-3">
                  <p className="text-white font-medium">{w.example_en}</p>
                  {w.example_ko && <p className="text-white/70 text-sm mt-1">{w.example_ko}</p>}
                  <button
                    onClick={() => speak(w.example_en)}
                    className="text-white/80 text-xs mt-2 bg-black/20 px-3 py-1 rounded-full"
                  >
                    🔊 예문 듣기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 발음 따라하기 */}
        {revealed && isSTTSupported() && (
          <div className="w-full mt-4">
            <button
              onClick={handleSpeak}
              disabled={listening}
              className={`w-full py-3 rounded-xl font-medium ${
                listening ? 'bg-rose-600 relative ripple text-rose-600' : 'bg-slate-700'
              }`}
            >
              <span className="relative z-10 text-white">
                {listening ? '🎙 듣는 중…' : '🎤 따라 말하기'}
              </span>
            </button>
            {speechResult && !speechResult.error && (
              <div className="mt-2 bg-slate-900 rounded-xl p-3 text-sm">
                <span className={speechResult.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                  발음 {speechResult.score}점
                </span>
                <span className="text-slate-400"> · 인식: "{speechResult.transcript}"</span>
              </div>
            )}
            {speechResult?.error && (
              <p className="text-amber-300 text-xs mt-2">⚠️ {speechResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="mt-6">
        {!revealed ? (
          <button
            onClick={handleReveal}
            className="w-full py-4 rounded-2xl bg-slate-700 font-bold text-lg"
          >
            뜻 보기
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.g}
                onClick={() => rate(r.g)}
                className={`${r.color} py-3 rounded-xl font-bold flex flex-col items-center`}
              >
                <span>{r.label}</span>
                <span className="text-[10px] font-normal text-white/80">
                  {previewInterval(current.progress, r.g, Date.now())}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Center({ children }) {
  return <div className="min-h-screen flex items-center justify-center p-6 text-slate-300">{children}</div>
}
