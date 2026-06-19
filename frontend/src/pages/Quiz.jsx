import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLearnedWords, recordActivity } from '../lib/db'
import { speak, isTTSSupported } from '../lib/tts'
import { LEVELS } from '../data/family'

// 복습 퀴즈 — 혼자 풀기(객관식) / 퀴즈로 하기(출제자가 묻고 O·X)
function shuffle(a) {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function Quiz() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const ttsOk = isTTSSupported()

  const level = (params.get('level') || profile?.level || 'B').toUpperCase()
  const category = params.get('cat') || 'general'
  const subcat = params.get('sub') || ''
  const mode = params.get('mode') === 'examiner' ? 'examiner' : 'solo'
  const levelBg = LEVELS[level]?.bg || 'bg-level-b'

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([]) // solo: {word, choices, answerIndex} / examiner: {word}
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const { words } = await getLearnedWords(user.id, level, category, subcat)
        if (!alive) return
        const pool = shuffle(words)
        let built
        if (mode === 'solo') {
          built = pool.map((w) => {
            const others = shuffle(words.filter((x) => x.id !== w.id && x.meaning_ko !== w.meaning_ko)).slice(0, 3)
            const choices = shuffle([w.meaning_ko, ...others.map((o) => o.meaning_ko)])
            return { word: w, choices, answerIndex: choices.indexOf(w.meaning_ko) }
          })
        } else {
          built = pool.map((w) => ({ word: w }))
        }
        setItems(built)
        setIdx(0)
        setScore(0)
        setDone(false)
        setPicked(null)
        setRevealed(false)
      } catch (e) {
        if (alive) setError(e.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user.id, level, category, subcat, mode])

  const cur = items[idx]

  useEffect(() => {
    if (cur && ttsOk) speak(cur.word.term)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items])

  function next(correct) {
    if (correct) setScore((s) => s + 1)
    recordActivity(1).catch(() => {})
    if (idx + 1 >= items.length) setDone(true)
    else {
      setIdx((i) => i + 1)
      setPicked(null)
      setRevealed(false)
    }
  }

  function chooseSolo(i) {
    if (picked != null) return
    setPicked(i)
    const correct = i === cur.answerIndex
    setTimeout(() => next(correct), 900)
  }

  function setMode(m) {
    setParams({ level, cat: category, sub: subcat, mode: m })
  }

  if (loading) return <Center>퀴즈 준비 중…</Center>
  if (error) return <Center>⚠️ {error}</Center>

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 flex flex-col">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-lg font-bold">🧠 복습 퀴즈</h1>
        {!done && items.length > 0 && (
          <span className="ml-auto text-sm text-slate-400">{idx + 1}/{items.length} · {score}점</span>
        )}
      </header>

      {/* 모드 선택 */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setMode('solo')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode === 'solo' ? levelBg + ' text-white' : 'bg-slate-800 text-slate-400'}`}>
          🧑 혼자 풀기
        </button>
        <button onClick={() => setMode('examiner')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode === 'examiner' ? levelBg + ' text-white' : 'bg-slate-800 text-slate-400'}`}>
          👥 퀴즈로 하기
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        {mode === 'solo' ? '단어 뜻을 보기에서 골라요 (자동 채점)' : '한 명이 단어를 보고 문제를 내고, 맞으면 O / 틀리면 X 를 눌러요'}
      </p>

      {items.length === 0 ? (
        <Center>
          <div className="text-center">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-slate-300 font-bold">복습할 단어가 아직 없어요</p>
            <p className="text-slate-500 text-sm mt-1">먼저 학습으로 단어를 익혀주세요.</p>
            <button onClick={() => navigate('/study')} className={`${levelBg} px-5 py-2.5 rounded-xl font-bold mt-5`}>학습하러 가기</button>
          </div>
        </Center>
      ) : done ? (
        <Center>
          <div className="text-center">
            <div className="text-6xl mb-3">🎉</div>
            <p className="text-2xl font-black">{items.length}문제 중 {score}개 정답!</p>
            <p className="text-slate-400 mt-1">{Math.round((score / items.length) * 100)}점</p>
            <div className="flex gap-2 justify-center mt-6">
              <button onClick={() => setParams({ level, cat: category, sub: subcat, mode })} className="bg-slate-700 px-5 py-2.5 rounded-xl font-bold">다시</button>
              <button onClick={() => navigate('/')} className={`${levelBg} px-5 py-2.5 rounded-xl font-bold`}>대시보드</button>
            </div>
          </div>
        </Center>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* 문제 카드 */}
          <div className={`${levelBg} rounded-3xl p-7 mb-4 text-center`}>
            <p className="text-white/70 text-xs mb-1">{cur.word.pos || '단어'}</p>
            <h2 className="text-3xl font-black text-white">{cur.word.term}</h2>
            <button onClick={() => speak(cur.word.term)} disabled={!ttsOk} className="mt-3 text-white/90 bg-black/20 px-4 py-1.5 rounded-full text-sm">🔊 듣기</button>
          </div>

          {mode === 'solo' ? (
            <div className="grid grid-cols-1 gap-2">
              {cur.choices.map((c, i) => {
                let cls = 'bg-slate-800 border-slate-700'
                if (picked != null) {
                  if (i === cur.answerIndex) cls = 'bg-emerald-600/30 border-emerald-500'
                  else if (i === picked) cls = 'bg-rose-600/30 border-rose-500'
                  else cls = 'bg-slate-800 border-slate-700 opacity-60'
                }
                return (
                  <button key={i} onClick={() => chooseSolo(i)} disabled={picked != null} className={`w-full text-left px-4 py-3 rounded-xl border ${cls}`}>
                    {c}
                  </button>
                )
              })}
            </div>
          ) : (
            <div>
              {!revealed ? (
                <button onClick={() => setRevealed(true)} className="w-full py-4 rounded-2xl bg-slate-700 font-bold text-lg">정답 보기</button>
              ) : (
                <div className="bg-slate-900 rounded-2xl p-5 text-center">
                  <p className="text-2xl font-bold text-white">{cur.word.meaning_ko}</p>
                  {cur.word.example_en && <p className="text-slate-300 text-sm mt-2">{cur.word.example_en}</p>}
                  {cur.word.example_ko && <p className="text-slate-500 text-xs mt-1">{cur.word.example_ko}</p>}
                </div>
              )}
              {revealed && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => next(false)} className="py-4 rounded-2xl bg-rose-600 font-bold text-lg">✗ 틀림</button>
                  <button onClick={() => next(true)} className="py-4 rounded-2xl bg-emerald-600 font-bold text-lg">○ 맞음</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Center({ children }) {
  return <div className="min-h-screen flex items-center justify-center p-6 text-slate-300">{children}</div>
}
