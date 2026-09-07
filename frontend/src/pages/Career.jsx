import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DISCLAIMER, SITUATION, PATHS, MAJORS, SCHOOLS_USA, SCHOOLS_KOR,
  TIMELINE, GED_INFO, ASK_SCHOOL, GLOSSARY,
} from '../data/career'
import BottomNav from '../components/BottomNav'

const TABS = [
  { key: 'path', label: '경로', emoji: '🧭' },
  { key: 'major', label: '학과', emoji: '🎯' },
  { key: 'school', label: '대학', emoji: '🏛' },
  { key: 'plan', label: '일정', emoji: '🗓' },
  { key: 'todo', label: '확인', emoji: '❓' },
]

const TONE = {
  ok: { fg: '#6ee7b7', bg: 'rgba(110,231,183,0.12)', bd: 'rgba(110,231,183,0.35)' },
  warn: { fg: '#fcd34d', bg: 'rgba(252,211,77,0.12)', bd: 'rgba(252,211,77,0.35)' },
  bad: { fg: '#fda4af', bg: 'rgba(251,113,133,0.12)', bd: 'rgba(251,113,133,0.35)' },
  info: { fg: '#a5b4fc', bg: 'rgba(165,180,252,0.12)', bd: 'rgba(165,180,252,0.35)' },
}

// 진학 가이드 — 하울 전용. docs/하울_진로_조사.md 를 앱에서 볼 수 있게 옮긴 것.
export default function Career() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('path')

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/g/learn')} className="text-slate-400 text-sm">← 배움</button>
        <h1 className="text-xl font-bold">🧭 진학 가이드</h1>
      </header>
      <p className="text-slate-400 text-sm mb-3">{SITUATION.school}</p>

      <p className="text-[12px] leading-relaxed text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-3.5 py-2.5 mb-4">
        ⚠️ {DISCLAIMER}
      </p>

      <div className="grid grid-cols-5 gap-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2 rounded-xl text-xs font-bold ${tab === t.key ? 'bg-level-e text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <span className="block text-base leading-none mb-0.5">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'path' && <PathTab />}
      {tab === 'major' && <MajorTab />}
      {tab === 'school' && <SchoolTab />}
      {tab === 'plan' && <PlanTab />}
      {tab === 'todo' && <TodoTab />}

      <BottomNav />
    </div>
  )
}

function PathTab() {
  return (
    <>
      <h2 className="font-bold mb-2">지금 상황</h2>
      <div className="space-y-1.5 mb-6">
        {SITUATION.facts.map((f) => {
          const t = TONE[f.tone]
          return (
            <div key={f.label} className="rounded-2xl px-3.5 py-2.5 border" style={{ background: t.bg, borderColor: t.bd }}>
              <p className="text-[11px] font-bold mb-0.5" style={{ color: t.fg }}>{f.label}</p>
              <p className="text-sm text-slate-200 leading-relaxed">{f.value}</p>
            </div>
          )
        })}
      </div>

      <h2 className="font-bold mb-2">갈 수 있는 길 3가지</h2>
      <div className="space-y-3">
        {PATHS.map((p) => {
          const t = TONE[p.tone]
          return (
            <div key={p.key} className="bg-slate-800/60 border border-slate-700 rounded-3xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{p.emoji}</span>
                <h3 className="font-bold">{p.title}</h3>
                <span
                  className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: t.bg, color: t.fg }}
                >
                  {p.verdict}
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-3 leading-relaxed">{p.summary}</p>

              {p.need.length > 0 && (
                <>
                  <p className="text-[11px] text-slate-500 mb-1">필요한 것</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.need.map((n) => (
                      <span key={n} className="text-[11px] bg-slate-900 border border-slate-700 rounded-full px-2.5 py-1">{n}</span>
                    ))}
                  </div>
                </>
              )}
              {p.pros.map((x) => (
                <p key={x} className="text-xs text-emerald-300/90 leading-relaxed">👍 {x}</p>
              ))}
              {p.cons.map((x) => (
                <p key={x} className="text-xs text-rose-300/90 leading-relaxed mt-0.5">⚠️ {x}</p>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

function MajorTab() {
  const [open, setOpen] = useState(null)
  return (
    <>
      <p className="text-sm text-slate-400 mb-3">하울이 앱에서 자주 보는 주제(수학·과학·축구·음악)를 학과로 이어봤어요.</p>
      <div className="space-y-2">
        {MAJORS.map((m) => (
          <div key={m.key} className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === m.key ? null : m.key)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <span className="text-xl">{m.emoji}</span>
              <span className="min-w-0">
                <span className="block font-bold text-sm">{m.name}</span>
                <span className="block text-[11px] text-slate-400 truncate">{m.why}</span>
              </span>
              <span className="ml-auto text-slate-500">{open === m.key ? '−' : '+'}</span>
            </button>
            {open === m.key && (
              <div className="px-4 pb-4 text-sm space-y-2 border-t border-slate-700 pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {m.subjects.map((s) => (
                    <span key={s} className="text-[11px] bg-slate-900 rounded-full px-2.5 py-1 border border-slate-700">{s}</span>
                  ))}
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">🇺🇸 {m.usaNote}</p>
                <p className="text-slate-300 text-xs leading-relaxed">🇰🇷 {m.korNote}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function SchoolTab() {
  const [side, setSide] = useState('usa')
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {[['usa', '🇺🇸 미국 대학'], ['kor', '🇰🇷 한국 대학']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSide(k)}
            className={`py-2.5 rounded-xl text-sm font-bold ${side === k ? 'bg-level-e text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {side === 'usa' ? (
        <div className="space-y-2">
          {SCHOOLS_USA.map((s) => (
            <div key={s.name} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="font-bold">{s.name}</h3>
                <span className="text-[11px] text-slate-400">{s.type}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <Cell label="SAT" value={s.sat} />
                <Cell label="TOEFL" value={s.toefl} />
                <Cell label="GPA" value={s.gpa} />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{s.note}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-3.5 mb-3">
            <p className="text-sm font-bold text-amber-200 mb-1">먼저 고졸 검정고시</p>
            <p className="text-xs text-slate-300 leading-relaxed">{GED_INFO.pass}</p>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{GED_INFO.rounds.join(' · ')}</p>
          </div>
          <div className="space-y-2">
            {SCHOOLS_KOR.map((s) => (
              <div key={s.name} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="font-bold">{s.name}</h3>
                  <span className="ml-auto text-[11px] text-slate-500">{s.level}</span>
                </div>
                <p className="text-xs text-indigo-300 mb-1.5">{s.track}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{s.note}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function PlanTab() {
  return (
    <>
      <p className="text-sm text-slate-400 mb-3">미국 학제 기준이에요. 하울이 Grade 10인지 11인지부터 학교에 확인해야 해요.</p>
      <div className="space-y-2.5">
        {TIMELINE.map((t, i) => (
          <div key={t.when} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-level-e text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
              <h3 className="font-bold text-sm">{t.when}</h3>
            </div>
            {t.items.map((x) => (
              <p key={x} className="text-xs text-slate-300 leading-relaxed pl-8 relative before:content-['·'] before:absolute before:left-6">{x}</p>
            ))}
          </div>
        ))}
      </div>

      <h2 className="font-bold mt-6 mb-2">📚 용어 정리</h2>
      <div className="space-y-1.5">
        {GLOSSARY.map(([term, desc]) => (
          <div key={term} className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
            <p className="text-xs font-bold text-indigo-300">{term}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function TodoTab() {
  return (
    <>
      <p className="text-sm text-slate-400 mb-1">등대글로벌스쿨에 물어봐야 할 것들이에요.</p>
      <p className="text-xs text-slate-500 mb-4">☎ 031-971-2731</p>
      <div className="space-y-2">
        {ASK_SCHOOL.map((a, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 border ${a.priority ? 'bg-rose-500/10 border-rose-500/35' : 'bg-slate-800/60 border-slate-700'}`}
          >
            <div className="flex gap-2 mb-1">
              <span className="text-xs font-black text-slate-500 shrink-0 mt-0.5">{i + 1}</span>
              <p className="font-bold text-sm leading-snug">{a.q}</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-5">→ {a.why}</p>
            {a.priority && <p className="text-[11px] text-rose-300 font-bold pl-5 mt-1">먼저 확인</p>}
          </div>
        ))}
      </div>
    </>
  )
}

function Cell({ label, value }) {
  return (
    <div className="bg-slate-900 rounded-xl px-2 py-2 text-center">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-xs font-bold text-slate-200 mt-0.5">{value}</div>
    </div>
  )
}
