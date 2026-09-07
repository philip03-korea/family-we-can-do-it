import { useEffect, useRef, useState } from 'react'
import { askTutor } from '../lib/tutor'

// 입시박사 — 화면 위에 떠 있는 동그란 버튼. 누르면 아래에서 대화창이 올라온다.
//
// props
//   who     '하울' 같은 사람 이름 (말투를 맞추는 데 쓴다)
//   topic   지금 보고 있는 화면 이름
//   context 이 화면에 실제로 실린 가이드 내용 (박사가 근거로 삼는다)
//   presets 처음에 보여줄 예시 질문
//   accent  버튼·말풍선 색
export default function TutorBubble({ who = '학생', topic = '진학', context = '', presets = [], accent = '#7c3aed' }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, open])

  // 대화창이 열려 있는 동안에는 뒤 화면이 스크롤되지 않게
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    setErr('')
    const next = [...msgs, { role: 'user', text: q }]
    setMsgs(next)
    setBusy(true)
    try {
      const { reply } = await askTutor({ message: q, history: msgs, who, topic, context })
      setMsgs([...next, { role: 'assistant', text: reply }])
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* 떠 있는 버튼 — 하단 네비 위에 겹치지 않게 올려둔다 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="입시박사에게 물어보기"
          className="fixed z-50 right-4 bottom-24 flex items-center gap-2 rounded-full pl-3 pr-4 py-3
                     font-bold text-white text-sm active:scale-95 transition-transform"
          style={{
            background: accent,
            boxShadow: `0 12px 28px -8px ${accent}, 0 4px 10px rgba(0,0,0,0.45)`,
          }}
        >
          <span className="text-xl leading-none">🎓</span>
          입시박사
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* 뒤 배경 — 눌러서 닫기 */}
          <button
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <div className="relative max-w-md w-full mx-auto bg-slate-900 border-t border-slate-700 rounded-t-3xl
                          flex flex-col" style={{ height: '80vh' }}>
            {/* 머리 */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800 shrink-0">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ background: accent }}
              >
                🎓
              </span>
              <span className="min-w-0">
                <span className="block font-bold">입시박사</span>
                <span className="block text-[11px] text-slate-400 truncate">{topic} · {who}</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto w-9 h-9 rounded-full bg-slate-800 text-slate-300 text-lg shrink-0"
              >
                ✕
              </button>
            </div>

            {/* 대화 */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {msgs.length === 0 && (
                <>
                  <div className="bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3">
                    <p className="text-sm text-slate-100 leading-relaxed">
                      안녕하세요, 입시박사예요. 이 화면에 있는 내용을 바탕으로 답해 드려요.
                      궁금한 걸 편하게 물어보세요.
                    </p>
                  </div>
                  {presets.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      {presets.map((p) => (
                        <button
                          key={p}
                          onClick={() => send(p)}
                          className="text-left text-sm bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-2.5 text-slate-200"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {msgs.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <p
                      className="max-w-[85%] rounded-2xl rounded-tr-md px-4 py-3 text-sm text-white leading-relaxed whitespace-pre-wrap"
                      style={{ background: accent }}
                    >
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3">
                    <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                ),
              )}

              {busy && (
                <div className="bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3 w-24">
                  <span className="text-sm text-slate-400">생각 중…</span>
                </div>
              )}
              {err && (
                <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3 leading-relaxed">
                  {err}
                </p>
              )}
              <div ref={endRef} />
            </div>

            {/* 입력 */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex gap-2 px-5 py-4 border-t border-slate-800 shrink-0"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="궁금한 걸 물어보세요"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-base outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="px-5 rounded-2xl font-bold text-white disabled:opacity-40"
                style={{ background: accent }}
              >
                전송
              </button>
            </form>

            <p className="text-[11px] text-slate-500 text-center pb-3 px-5 leading-relaxed">
              입시박사는 이 화면의 가이드를 바탕으로 답해요. 모집요강·커트라인은 해마다 바뀌니 지원 전에 각 학교 입학처로 확인하세요.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
