import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStudyQueue, getLearnedWords, saveProgress, logSpeechAttempt, recordActivity } from '../lib/db'
import { schedule, previewInterval, RATINGS } from '../lib/fsrs'
import { speak, isTTSSupported } from '../lib/tts'
import { listenOnce, isSTTSupported, scorePronunciation } from '../lib/stt'
import { scoreFeedback, recallFeedback, meaningMatches } from '../lib/feedback'
import { LEVELS, LEVEL_ORDER } from '../data/family'

const PAGE = 10

const CATEGORIES = [
  { key: 'general', label: '일반' },
  { key: 'webtoon', label: '웹툰·배우' },
  { key: 'football', label: '축구' },
  { key: 'kpop_rap', label: '랩·음악' },
  { key: 'popsong', label: '팝송' },
  { key: 'games', label: '게임' },
]
const catLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label || '일반'

export default function Study() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const sttOk = isSTTSupported()
  const ttsOk = isTTSSupported()

  const level = (params.get('level') || profile?.level || 'B').toUpperCase()
  const mode = params.get('mode') === 'review' ? 'review' : 'learn'
  const category = params.get('cat') || 'general'
  const levelBg = LEVELS[level]?.bg || 'bg-level-b'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [queue, setQueue] = useState([]) // [{word, progress}]
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)
  const [finished, setFinished] = useState(false)

  // 복습 페이지네이션(10개 단위)
  const [allLearned, setAllLearned] = useState([])
  const [page, setPage] = useState(0)

  // 발음/회상 상태
  const [listening, setListening] = useState('') // '' | 'term' | 'sentence' | 'recall'
  const [recall, setRecall] = useState(null)
  const [termResult, setTermResult] = useState(null)
  const [sentResult, setSentResult] = useState(null)

  // 이번 세션에 학습한 단어(전체 다시 복습용)
  const [sessionWords, setSessionWords] = useState([])

  // 큐 로드 (레벨/모드 변경 시)
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    setFinished(false)
    setIdx(0)
    setDone(0)
    setPage(0)
    setSessionWords([])
    ;(async () => {
      try {
        if (mode === 'review') {
          const { words, progressById } = await getLearnedWords(user.id, level, category)
          const items = words.map((w) => ({ word: w, progress: progressById[w.id] || null }))
          if (!alive) return
          setAllLearned(items)
          setQueue(items.slice(0, PAGE))
        } else {
          const { due, fresh, progressById } = await getStudyQueue(user.id, level, 10, category)
          const items = [...due, ...fresh].map((w) => ({ word: w, progress: progressById[w.id] || null }))
          if (!alive) return
          setAllLearned([])
          setQueue(items)
        }
      } catch (e) {
        if (alive) setError(e.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user.id, level, mode, category])

  const current = queue[idx]

  // 카드가 바뀌면 상태 초기화 + 단어 자동 듣기(첫 탭 이후 iOS도 동작)
  useEffect(() => {
    setRevealed(false)
    setRecall(null)
    setTermResult(null)
    setSentResult(null)
    if (current && ttsOk) speak(current.word.term)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, queue])

  async function listen(kind, target) {
    if (!sttOk) return
    setListening(kind)
    try {
      const lang = kind === 'recall' ? 'ko-KR' : 'en-US'
      const { transcript } = await listenOnce({ lang })
      if (kind === 'recall') {
        const correct = meaningMatches(current.word.meaning_ko, transcript)
        setRecall({ transcript, correct, ...recallFeedback(correct) })
      } else {
        const res = scorePronunciation(target, transcript)
        const fb = scoreFeedback(res.score)
        if (kind === 'term') setTermResult({ transcript, ...res, fb })
        else setSentResult({ transcript, ...res, fb })
        logSpeechAttempt(user.id, {
          wordId: current.word.id,
          targetText: target,
          transcript,
          score: res.score,
        }).catch(() => {})
      }
    } catch (e) {
      const r = { error: e.message }
      if (kind === 'term') setTermResult(r)
      else if (kind === 'sentence') setSentResult(r)
      else setRecall(r)
    } finally {
      setListening('')
    }
  }

  function goPrev() {
    if (idx > 0) setIdx(idx - 1)
  }
  function goNext() {
    if (idx < queue.length - 1) setIdx(idx + 1)
    else setFinished(true)
  }

  async function rate(g) {
    if (!current) return
    const sched = schedule(current.progress, g, Date.now())
    try {
      await saveProgress(user.id, current.word.id, sched)
    } catch (e) {
      setError(e.message)
    }
    setSessionWords((s) => (s.some((wd) => wd.id === current.word.id) ? s : [...s, current.word]))

    if (g === 1) {
      // '다시' → 이번 세션 뒤쪽으로
      setQueue((q) => {
        const next = [...q]
        const [item] = next.splice(idx, 1)
        next.push({ ...item, progress: sched })
        return next
      })
      return
    }
    setDone((d) => d + 1)
    recordActivity(1).catch(() => {})
    if (idx + 1 >= queue.length) setFinished(true)
    else setIdx((i) => i + 1)
  }

  function nextReviewPage() {
    const next = page + 1
    setPage(next)
    setQueue(allLearned.slice(next * PAGE, next * PAGE + PAGE))
    setIdx(0)
    setDone(0)
    setFinished(false)
  }

  function reviewSession() {
    const items = sessionWords.map((wd) => ({ word: wd, progress: null }))
    setQueue(items)
    setIdx(0)
    setDone(0)
    setFinished(false)
    setSessionWords([])
  }

  function setLevel(lv) {
    setParams({ level: lv, mode, cat: category })
  }
  function setMode(m) {
    setParams({ level, mode: m, cat: category })
  }
  function setCat(c) {
    setParams({ level, mode, cat: c })
  }

  if (loading) return <Center>단어 불러오는 중…</Center>
  if (error) return <Center>⚠️ {error}</Center>

  // ===== 완료 / 빈 큐 화면 =====
  if (finished || !queue.length) {
    const emptyReview = mode === 'review' && !allLearned.length
    const hasMorePages = mode === 'review' && allLearned.length > (page + 1) * PAGE
    return (
      <div className="min-h-screen max-w-md mx-auto p-5 flex flex-col">
        <TopBar level={level} mode={mode} category={category} setLevel={setLevel} setMode={setMode} setCat={setCat} onExit={() => navigate('/')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center w-full">
            <div className="text-6xl mb-4">{emptyReview ? '🌱' : queue.length || finished ? '🎉' : '☕'}</div>
            <h2 className="text-2xl font-bold mb-2">
              {emptyReview
                ? '아직 학습한 단어가 없어요'
                : mode === 'review'
                ? '복습 완료!'
                : finished
                ? '학습 완료!'
                : '복습할 단어가 없어요'}
            </h2>
            <p className="text-slate-400 mb-6">
              {emptyReview
                ? '먼저 학습 모드로 단어를 익혀보세요.'
                : done
                ? `${done}개 단어를 ${mode === 'review' ? '복습' : '학습'}했어요.`
                : '내일 다시 만나요 🌙'}
            </p>
            <div className="space-y-2">
              {hasMorePages && (
                <button onClick={nextReviewPage} className={`${levelBg} w-full py-3 rounded-2xl font-bold`}>
                  다음 10개 복습 → ({(page + 1) * PAGE + 1}–{Math.min((page + 2) * PAGE, allLearned.length)} / {allLearned.length})
                </button>
              )}
              {mode === 'learn' && sessionWords.length > 0 && (
                <button onClick={reviewSession} className="bg-slate-700 w-full py-3 rounded-2xl font-bold">
                  🔁 방금 학습한 {sessionWords.length}개 전체 다시 복습
                </button>
              )}
              {mode === 'learn' && (
                <button onClick={() => setMode('review')} className="bg-slate-800 border border-slate-700 w-full py-3 rounded-2xl font-medium">
                  📚 {category === 'general' ? `레벨 ${level}` : catLabel(category)} 전체 복습하기
                </button>
              )}
              {mode === 'review' && (
                <button onClick={() => setMode('learn')} className="bg-slate-800 border border-slate-700 w-full py-3 rounded-2xl font-medium">
                  ✏️ 새 단어 학습하기
                </button>
              )}
              <button onClick={() => navigate('/')} className="bg-slate-800 border border-slate-700 w-full py-3 rounded-2xl font-medium">
                대시보드로
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const w = current.word
  const total = queue.length

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 flex flex-col">
      <TopBar level={level} mode={mode} setLevel={setLevel} setMode={setMode} onExit={() => navigate('/')} />

      {/* 진행바 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={levelBg + ' h-full transition-all'} style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
        <span className="text-slate-400 text-xs tabular-nums">
          {idx + 1}/{total}
        </span>
      </div>

      {/* 카드 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`${levelBg} w-full rounded-3xl p-7 text-center shadow-xl`}>
          <p className="text-white/70 text-sm mb-1">
            레벨 {w.level}
            {w.pos ? ` · ${w.pos}` : ''}
          </p>
          <h1 className="text-4xl font-black text-white mb-3">{w.term}</h1>

          {/* 단어 듣기 / 따라 말하기 */}
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => speak(w.term)}
              disabled={!ttsOk}
              className="text-white bg-black/20 px-4 py-2 rounded-full text-sm disabled:opacity-40"
            >
              🔊 단어 듣기
            </button>
            {sttOk && (
              <button
                onClick={() => listen('term', w.term)}
                disabled={!!listening}
                className={`px-4 py-2 rounded-full text-sm text-white ${listening === 'term' ? 'bg-rose-600' : 'bg-black/20'}`}
              >
                {listening === 'term' ? '🎙 듣는 중…' : '🎤 단어 따라 말하기'}
              </button>
            )}
          </div>
          {termResult && !termResult.error && (
            <p className="text-white/90 text-xs mt-2">
              발음 {termResult.score}/100점 · {termResult.fb.msg}
              <br />
              <span className="text-white/60">인식: "{termResult.transcript}"</span>
            </p>
          )}

          {revealed && (
            <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
              <p className="text-white text-2xl font-bold">{w.meaning_ko}</p>
              {w.example_en && (
                <div className="bg-black/15 rounded-xl p-3 text-left">
                  <p className="text-white font-medium">{w.example_en}</p>
                  {w.example_ko && <p className="text-white/70 text-sm mt-1">{w.example_ko}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button onClick={() => speak(w.example_en)} className="text-white bg-black/20 px-3 py-1 rounded-full text-xs">
                      🔊 문장 듣기
                    </button>
                    {sttOk && (
                      <button
                        onClick={() => listen('sentence', w.example_en)}
                        disabled={!!listening}
                        className={`px-3 py-1 rounded-full text-xs text-white ${listening === 'sentence' ? 'bg-rose-600' : 'bg-black/20'}`}
                      >
                        {listening === 'sentence' ? '🎙 듣는 중…' : '🎤 문장 따라 말하기'}
                      </button>
                    )}
                  </div>
                  {sentResult && !sentResult.error && (
                    <p className="text-white/90 text-xs mt-2">
                      발음 {sentResult.score}/100점 · {sentResult.fb.msg}
                      <br />
                      <span className="text-white/60">인식: "{sentResult.transcript}"</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 뜻 보기 전: 능동 회상(뜻 말해보기) */}
        {!revealed && (
          <div className="w-full mt-4 space-y-2">
            {sttOk && (
              <button
                onClick={() => listen('recall', '')}
                disabled={!!listening}
                className={`w-full py-2.5 rounded-xl text-sm font-medium ${
                  listening === 'recall' ? 'bg-rose-600 text-white' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {listening === 'recall' ? '🎙 듣는 중…' : '🧠 뜻 먼저 말해보기 (한국어)'}
              </button>
            )}
            {recall && !recall.error && (
              <p className={`text-center text-sm ${recall.good ? 'text-emerald-300' : 'text-amber-300'}`}>
                {recall.msg} <span className="text-slate-400">— 내가 말한 뜻: "{recall.transcript}"</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="mt-5 space-y-2">
        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="w-full py-4 rounded-2xl bg-slate-700 font-bold text-lg">
            뜻 보기
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <button key={r.g} onClick={() => rate(r.g)} className={`${r.color} py-3 rounded-xl font-bold flex flex-col items-center`}>
                <span>{r.label}</span>
                <span className="text-[10px] font-normal text-white/80">{previewInterval(current.progress, r.g, Date.now())}</span>
              </button>
            ))}
          </div>
        )}

        {/* 이전 / 다음 (채점 없이 이동) */}
        <div className="flex gap-2">
          <button onClick={goPrev} disabled={idx === 0} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm disabled:opacity-30">
            ← 이전
          </button>
          <button onClick={goNext} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm">
            {idx >= total - 1 ? '끝내기' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 상단: 나가기 + 학습/복습 토글 + 관심사 카테고리 + (일반일 때) 레벨 선택
function TopBar({ level, mode, category, setLevel, setMode, setCat, onExit }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onExit} className="text-slate-400 text-sm">
          ← 나가기
        </button>
        <div className="flex bg-slate-800 rounded-full p-0.5 text-xs">
          <button onClick={() => setMode('learn')} className={`px-3 py-1 rounded-full ${mode === 'learn' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
            학습
          </button>
          <button onClick={() => setMode('review')} className={`px-3 py-1 rounded-full ${mode === 'review' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
            복습
          </button>
        </div>
      </div>

      {/* 관심사 카테고리 */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
              c.key === category ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 레벨 선택 (일반 단어일 때만) */}
      {category === 'general' && (
        <div className="flex gap-1.5">
          {LEVEL_ORDER.map((code) => (
            <button
              key={code}
              onClick={() => setLevel(code)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-bold ${
                code === level ? (LEVELS[code]?.bg || 'bg-slate-600') + ' text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Center({ children }) {
  return <div className="min-h-screen flex items-center justify-center p-6 text-slate-300">{children}</div>
}
