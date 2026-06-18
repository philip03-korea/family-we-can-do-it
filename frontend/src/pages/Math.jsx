import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MATH_LEVELS, genProblem } from '../data/math'

// 수학 연습 — 객관식 + 풀이 보기 (외부 API 없음, 무한 생성)
export default function MathPractice() {
  const navigate = useNavigate()
  const [level, setLevel] = useState('elem')
  const [problem, setProblem] = useState(null)
  const [picked, setPicked] = useState(null)
  const [showSol, setShowSol] = useState(false)
  const [score, setScore] = useState({ right: 0, total: 0 })

  function next() {
    setProblem(genProblem(level))
    setPicked(null)
    setShowSol(false)
  }
  useEffect(() => {
    next()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  function choose(i) {
    if (picked != null) return
    setPicked(i)
    const ok = i === problem.answerIndex
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }))
  }

  const lv = MATH_LEVELS.find((l) => l.key === level)

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-24">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">📐 수학</h1>
        <span className="ml-auto text-sm text-slate-400">{score.right} / {score.total} 정답</span>
      </header>

      {/* 레벨 탭 */}
      <div className="grid grid-cols-4 gap-1.5 mb-1">
        {MATH_LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLevel(l.key)}
            className={`py-2 rounded-xl text-sm font-bold ${level === l.key ? 'bg-level-b text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mb-4">{lv?.desc}</p>

      {problem && (
        <>
          {/* 문제 */}
          <div className="bg-level-b rounded-3xl p-7 mb-4 text-center">
            <p className="text-white/70 text-xs mb-2">문제</p>
            <p className="text-2xl font-black text-white whitespace-pre-wrap">{problem.q}</p>
          </div>

          {/* 보기 */}
          <div className="grid grid-cols-1 gap-2 mb-3">
            {problem.choices.map((c, i) => {
              let cls = 'bg-slate-800 border-slate-700'
              if (picked != null) {
                if (i === problem.answerIndex) cls = 'bg-emerald-600/30 border-emerald-500'
                else if (i === picked) cls = 'bg-rose-600/30 border-rose-500'
                else cls = 'bg-slate-800 border-slate-700 opacity-60'
              }
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={picked != null}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${cls} flex items-center gap-3`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-xs flex items-center justify-center shrink-0">{'①②③④'[i]}</span>
                  <span className="font-medium">{c}</span>
                </button>
              )
            })}
          </div>

          {/* 결과 */}
          {picked != null && (
            <p className={`text-center font-bold mb-3 ${picked === problem.answerIndex ? 'text-emerald-400' : 'text-rose-400'}`}>
              {picked === problem.answerIndex ? '정답이에요! 🎉' : '아쉬워요. 풀이를 확인해봐요 💪'}
            </p>
          )}

          {/* 풀이 보기 */}
          <button
            onClick={() => setShowSol((s) => !s)}
            className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 font-medium mb-2"
          >
            {showSol ? '풀이 숨기기' : '🧩 풀이 보기'}
          </button>
          {showSol && (
            <div className="bg-slate-900 rounded-xl p-4 mb-3 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {problem.solution}
              <p className="mt-2 text-emerald-400 font-bold">정답: {problem.choices[problem.answerIndex]}</p>
            </div>
          )}

          <button onClick={next} className="w-full py-4 rounded-2xl bg-level-b font-bold text-lg">
            다음 문제 →
          </button>
        </>
      )}

      <p className="text-center text-xs text-slate-600 mt-8">
        중1을 마스터하면 중2 → 중3 으로! 매일 조금씩 💪
      </p>
    </div>
  )
}
