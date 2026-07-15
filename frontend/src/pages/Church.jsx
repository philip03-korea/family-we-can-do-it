import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { askChurch, savePlan, listPlans, deletePlan, KINDS, TARGETS, PRESETS } from '../lib/church'
import BottomNav from '../components/BottomNav'

// 아주 가벼운 마크다운 렌더 (제목/굵게/목록/구분선)
function Markdown({ text }) {
  const lines = (text || '').split('\n')
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((ln, i) => {
        const t = ln.trim()
        if (!t) return <div key={i} className="h-1.5" />
        if (/^#{1,6}\s/.test(t)) {
          const lv = t.match(/^#+/)[0].length
          const body = t.replace(/^#+\s*/, '').replace(/\*\*/g, '')
          const cls = lv <= 2 ? 'text-base font-bold text-violet-300 mt-3' : 'text-sm font-bold text-slate-200 mt-2'
          return <div key={i} className={cls}>{body}</div>
        }
        if (/^([-*]{3,})$/.test(t)) return <hr key={i} className="border-slate-700 my-2" />
        const inline = (s) =>
          s.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
            /^\*\*[^*]+\*\*$/.test(p) ? <strong key={j} className="text-white">{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>,
          )
        if (/^[-*•]\s/.test(t)) {
          return <div key={i} className="flex gap-2 text-slate-300"><span className="text-violet-400">·</span><span>{inline(t.replace(/^[-*•]\s*/, ''))}</span></div>
        }
        if (/^\d+[.)]\s/.test(t)) {
          return <div key={i} className="flex gap-2 text-slate-300"><span className="text-violet-400 font-bold">{t.match(/^\d+/)[0]}.</span><span>{inline(t.replace(/^\d+[.)]\s*/, ''))}</span></div>
        }
        if (/^\|/.test(t)) return <div key={i} className="text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre">{t}</div>
        return <p key={i} className="text-slate-300">{inline(t)}</p>
      })}
    </div>
  )
}

export default function Church() {
  const { user, ownProfile } = useAuth()
  const navigate = useNavigate()
  // 실제 로그인 계정 기준(가족 미리보기 모드와 무관). 서버에서도 JWT로 재검증됨.
  const isDad = ownProfile?.member_key === 'dad'

  const [tab, setTab] = useState('new')       // new | saved
  const [kind, setKind] = useState('학생회모임')
  const [target, setTarget] = useState('중고등부')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [history, setHistory] = useState([])  // 이어서 물어보기용
  const [plans, setPlans] = useState([])
  const [viewing, setViewing] = useState(null)
  const [msg, setMsg] = useState('')
  const resultRef = useRef(null)

  useEffect(() => {
    if (!user?.id || !isDad) return
    listPlans(user.id).then(setPlans).catch((e) => setMsg('⚠️ ' + e.message))
  }, [user?.id, isDad])

  // 🔒 아빠 전용 게이트 (서버에서도 한 번 더 검증됨)
  if (!isDad) {
    return (
      <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        </header>
        <div className="bg-slate-800/60 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="font-bold mb-2">아빠 전용 기능이에요</h1>
          <p className="text-sm text-slate-400">교회 교육프로그램 기획은 아빠 계정에서만 사용할 수 있어요.</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  async function run(p = prompt, k = kind, t = target, append = false) {
    if (!p.trim()) { setMsg('⚠️ 요청 내용을 입력해주세요.'); return }
    setBusy(true); setMsg('하24가 기획 중이에요…')
    try {
      const content = await askChurch({ prompt: p, kind: k, target: t, history: append ? history : [] })
      setResult(content)
      setHistory((h) => [...(append ? h : []), { role: 'user', text: p }, { role: 'assistant', text: content }])
      setMsg('')
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setMsg('⚠️ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function doSave() {
    const title = window.prompt('기획안 제목을 정해주세요', `${target} ${kind} — ${new Date().toISOString().slice(0, 10)}`)
    if (!title) return
    try {
      const row = await savePlan({ userId: user.id, title, kind, target, content: result, prompt })
      setPlans((ps) => [row, ...ps])
      setMsg('💾 저장했어요. "저장한 기획" 탭에서 볼 수 있어요.')
    } catch (e) {
      setMsg('⚠️ ' + e.message)
    }
  }

  async function removePlan(id) {
    try {
      await deletePlan(id)
      setPlans((ps) => ps.filter((p) => p.id !== id))
      if (viewing?.id === id) setViewing(null)
    } catch (e) { setMsg('⚠️ ' + e.message) }
  }

  function copyResult() {
    navigator.clipboard?.writeText(result)
    setMsg('📋 복사했어요.')
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">⛪ 교회 교육기획</h1>
      </header>

      <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-3 mb-4">
        <p className="text-xs text-violet-200/90 leading-relaxed">
          <strong>하24 · 교회교육프로그램 전문가</strong> — 파울러 신앙발달단계에 근거해 학생회 모임·수련회·교사훈련을
          현장에서 바로 쓸 수 있게 설계해줘요. 🔒 아빠만 보이는 탭이에요.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {[{ k: 'new', t: '새로 기획' }, { k: 'saved', t: `저장한 기획${plans.length ? ` (${plans.length})` : ''}` }].map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold border ${
              tab === x.k ? 'bg-violet-600 border-violet-500' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            {x.t}
          </button>
        ))}
      </div>

      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

      {/* ── 새로 기획 ── */}
      {tab === 'new' && (
        <>
          {/* 빠른 시작 */}
          <p className="text-xs text-slate-500 mb-2">빠른 시작 — 탭하면 바로 기획해요</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setKind(p.kind); setTarget(p.target); setPrompt(p.prompt)
                  if (p.prompt) run(p.prompt, p.kind, p.target)
                }}
                disabled={busy}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-left text-xs font-bold text-slate-200 active:scale-95 transition disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 유형/대상 */}
          <div className="flex gap-2 mb-2">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm">
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm">
              {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="어떤 걸 기획할까요? 예) 이번 주 학생회 모임을 '정체성'을 주제로 2시간 짜줘. 애들이 요즘 학업 스트레스가 많아."
            className="w-full min-h-[90px] bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm resize-y outline-none focus:border-violet-500 mb-2"
          />

          <button
            onClick={() => run()}
            disabled={busy}
            className="w-full py-3 rounded-2xl bg-violet-600 font-bold text-sm disabled:opacity-50 mb-4"
          >
            {busy ? '하24가 기획 중…' : '✨ 기획하기'}
          </button>

          {/* 결과 */}
          {result && (
            <div ref={resultRef}>
              <div className="flex gap-2 mb-2">
                <button onClick={doSave} className="flex-1 py-2 rounded-xl bg-slate-700 text-sm font-bold">💾 저장</button>
                <button onClick={copyResult} className="flex-1 py-2 rounded-xl bg-slate-700 text-sm font-bold">📋 복사</button>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-3">
                <Markdown text={result} />
              </div>
              {/* 이어서 묻기 */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="이어서 물어보기 (예: 나눔 질문 더 쉽게)"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      run(e.currentTarget.value, kind, target, true)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 저장한 기획 ── */}
      {tab === 'saved' && (
        <div className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">아직 저장한 기획안이 없어요.</p>
          ) : (
            plans.map((p) => (
              <div key={p.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{p.title}</div>
                    <div className="text-[11px] text-slate-400">{p.kind} · {p.target} · {p.created_at.slice(0, 10)}</div>
                  </div>
                  <button onClick={() => setViewing(p)} className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-600 font-bold">열기</button>
                  <button onClick={() => removePlan(p.id)} className="text-slate-500 text-sm">🗑</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 기획안 보기 */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
          <div className="max-w-md mx-auto p-5 pb-10">
            <div className="flex items-center justify-between mb-3 pt-2 gap-2">
              <h2 className="font-bold text-sm flex-1 min-w-0 truncate">{viewing.title}</h2>
              <button
                onClick={() => { navigator.clipboard?.writeText(viewing.content); setMsg('📋 복사했어요.') }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-700"
              >📋</button>
              <button onClick={() => setViewing(null)} className="text-slate-400 text-sm">닫기 ✕</button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">{viewing.kind} · {viewing.target} · {viewing.created_at.slice(0, 10)}</p>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <Markdown text={viewing.content} />
            </div>
            <button onClick={() => setViewing(null)} className="w-full mt-4 py-3 rounded-2xl bg-slate-700 font-bold text-sm">닫기</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
