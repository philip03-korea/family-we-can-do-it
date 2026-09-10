import AdmissionGuide, { SchoolEvidence } from '../components/AdmissionGuide'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DISCLAIMER, ADMISSION_TYPES, SCHOOLS, HIGH_SCHOOLS,
  PRACTICAL, PORTFOLIO, TIMELINE, DEBUT, ASK, tutorContext, TUTOR_PRESETS,
} from '../data/webtoon'
import BottomNav from '../components/BottomNav'
import TutorBubble from '../components/TutorBubble'

const TABS = [
  { key: 'guide', label: '로드맵', emoji: '✦' },
  { key: 'school', label: '학교', emoji: '🏫' },
  { key: 'exam', label: '전형', emoji: '🎫' },
  { key: 'draw', label: '실기', emoji: '✏️' },
  { key: 'plan', label: '일정', emoji: '🗓' },
  { key: 'debut', label: '데뷔', emoji: '🚀' },
]

const TONE = {
  ok: { fg: '#246348', bg: 'rgba(110,231,183,0.12)', bd: 'rgba(110,231,183,0.35)' },
  warn: { fg: '#855a12', bg: 'rgba(252,211,77,0.12)', bd: 'rgba(252,211,77,0.35)' },
  info: { fg: '#5146a4', bg: 'rgba(165,180,252,0.12)', bd: 'rgba(165,180,252,0.35)' },
}

// 웹툰 입시 가이드 — 하음 전용. 첫 화면은 「학교」.
export default function Webtoon() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('guide')
  const [open, setOpen] = useState(null)

  if (open) return <SchoolDetail schoolKey={open} onBack={() => setOpen(null)} />

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/g/learn')} className="text-slate-400 text-sm">← 배움</button>
        <h1 className="text-xl font-bold">🎨 웹툰 입시</h1>
      </header>
      <p className="text-slate-400 text-sm mb-3">웹툰학과 · 실기 · 포트폴리오</p>

      <p className="text-[12px] leading-relaxed text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-3.5 py-2.5 mb-4">
        ⚠️ {DISCLAIMER}
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2 rounded-xl text-xs font-bold ${tab === t.key ? 'bg-level-d text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <span className="block text-base leading-none mb-0.5">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'guide' && <AdmissionGuide kind="haeum" />}
      {tab === 'school' && <SchoolTab onOpen={setOpen} />}
      {tab === 'exam' && <ExamTab />}
      {tab === 'draw' && <DrawTab />}
      {tab === 'plan' && <PlanTab />}
      {tab === 'debut' && <DebutTab />}

      <TutorBubble who="하음" topic="웹툰 입시" context={tutorContext()} presets={TUTOR_PRESETS} accent="#d946ef" />
      <BottomNav />
    </div>
  )
}

function SchoolTab({ onOpen }) {
  const [side, setSide] = useState('univ')
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {[['univ', '🎓 대학'], ['high', '🏫 특성화고']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSide(k)}
            className={`py-2.5 rounded-xl text-sm font-bold ${side === k ? 'bg-level-d text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {side === 'univ' ? (
        <div className="space-y-2.5">
          {SCHOOLS.map((s) => (
            <button
              key={s.key}
              onClick={() => onOpen(s.key)}
              className="w-full text-left bg-slate-800/60 border border-slate-700 rounded-3xl p-4 active:scale-[0.99] transition"
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-base font-black text-white"
                  style={{ background: s.color }}
                >
                  {s.name.slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-bold text-sm">{s.name}</span>
                  </span>
                  <span className="block text-sm text-pink-300 truncate">{s.dept}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{s.type}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/60">
                <span className="text-[11px] text-amber-300 bg-amber-400/12 rounded-full px-2 py-0.5">{s.tier}</span>
                <span className="ml-auto text-slate-500 text-lg">›</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-3">하음은 고3이라 지금 갈 곳은 아니고, 하람이 나중에 볼 수 있어 함께 정리했어요.</p>
          <div className="space-y-2">
            {HIGH_SCHOOLS.map((h) => (
              <div key={h.name} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="font-bold text-sm">{h.name}</h3>
                  <span className="ml-auto text-[11px] text-slate-500">{h.where}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {h.depts.map((d) => (
                    <span key={d} className="text-[11px] bg-slate-900 border border-slate-700 rounded-full px-2.5 py-1">{d}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{h.note}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function SchoolDetail({ schoolKey, onBack }) {
  const s = SCHOOLS.find((x) => x.key === schoolKey)
  if (!s) return null
  return (
    <div className="min-h-screen max-w-md mx-auto pb-28">
      <div className="px-5 pt-5 pb-6" style={{ background: `linear-gradient(160deg, ${s.color} 0%, #0f172a 100%)` }}>
        <button onClick={onBack} className="text-white/70 text-sm mb-3">← 학교 목록</button>
        <h1 className="text-2xl font-black text-white">{s.name}</h1>
        <p className="text-white/90 font-bold mt-0.5">{s.dept}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[11px] bg-black/25 text-white/90 rounded-full px-2.5 py-1">{s.type}</span>
          <span className="text-[11px] bg-black/25 text-white/90 rounded-full px-2.5 py-1">{s.tier}</span>
        </div>
      </div>

      <div className="p-5">
        <SchoolEvidence schoolKey={schoolKey}/>
        <p className="text-sm text-slate-200 leading-relaxed bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-4">
          {s.note}
        </p>

        <h2 className="font-bold mb-2">🎓 여기서 배우는 전공</h2>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {s.majors.map((m) => (
            <span key={m} className="text-sm bg-pink-500/12 border border-pink-500/35 text-pink-100 rounded-2xl px-3.5 py-2 font-bold">
              {m}
            </span>
          ))}
        </div>

        <div className="space-y-2 mb-5">
          <Info label="전형" value={s.exam} />
          <Info label="성격" value={s.focus} />
        </div>

        <h2 className="font-bold mb-2">❓ 이 학교에 물어볼 것</h2>
        <div className="space-y-1.5">
          {s.check.map((c, i) => (
            <div key={i} className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="text-xs font-black text-slate-600 shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-slate-200 leading-relaxed">{c}</p>
            </div>
          ))}
        </div>
      </div>

      <TutorBubble
        who="하음"
        topic={`웹툰 입시 — ${s.name}`}
        context={tutorContext()}
        presets={[`${s.name}는 나한테 맞을까?`, '여기 실기는 뭘 준비해야 해?', '포트폴리오는 어떻게 내?']}
        accent="#d946ef"
      />
      <BottomNav />
    </div>
  )
}

function ExamTab() {
  return (
    <>
      <p className="text-sm text-slate-400 mb-3">학교마다 실기·학생부·면접의 반영 방식이 달라요. 로드맵의 확인된 요강과 함께 비교해 보세요.</p>
      <div className="space-y-2.5 mb-6">
        {ADMISSION_TYPES.map((a) => {
          const t = TONE[a.tone]
          return (
            <div key={a.key} className="rounded-3xl p-4 border" style={{ background: t.bg, borderColor: t.bd }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{a.emoji}</span>
                <h3 className="font-bold text-sm" style={{ color: t.fg }}>{a.title}</h3>
                <span className="ml-auto text-[11px] text-slate-300 bg-black/25 rounded-full px-2 py-0.5">{a.weight}</span>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed mb-2">{a.summary}</p>
              {a.detail.map((d, i) => (
                <p key={i} className="text-xs text-slate-300 leading-relaxed">· {d}</p>
              ))}
            </div>
          )
        })}
      </div>

      <h2 className="font-bold mb-1">📁 포트폴리오</h2>
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{PORTFOLIO.intro}</p>
      <div className="space-y-1.5 mb-4">
        {PORTFOLIO.items.map((it) => (
          <div
            key={it.name}
            className={`rounded-2xl px-4 py-3 border ${it.must ? 'bg-pink-500/10 border-pink-500/35' : 'bg-slate-800/60 border-slate-700'}`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm">{it.name}</span>
              {it.must && (
                <span className="text-[10px] text-pink-200 bg-pink-500/25 rounded-full px-2 py-0.5 shrink-0">필수</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{it.why}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PORTFOLIO.tools.map((t) => (
          <span key={t} className="text-[11px] bg-slate-900 border border-slate-700 rounded-full px-2.5 py-1">{t}</span>
        ))}
      </div>
      <p className="text-xs text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-3.5 py-2.5 leading-relaxed">
        ⚠️ {PORTFOLIO.caution}
      </p>
    </>
  )
}

function DrawTab() {
  const [open, setOpen] = useState('situation')
  return (
    <>
      <p className="text-sm text-slate-400 mb-3">학교마다 출제 유형이 달라요. 지원할 학교부터 정하고 거기에 맞춰 연습하세요.</p>
      <div className="space-y-2">
        {PRACTICAL.map((p) => (
          <div key={p.key} className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === p.key ? null : p.key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="min-w-0">
                <span className="block font-bold text-sm">{p.name}</span>
                <span className="block text-[11px] text-slate-400 truncate">{p.what}</span>
              </span>
              <span className="ml-auto text-slate-500">{open === p.key ? '−' : '+'}</span>
            </button>
            {open === p.key && (
              <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-400 mb-1">예시 문제</p>
                <p className="text-sm text-slate-100 leading-relaxed mb-3">{p.example}</p>
                {p.tips.map((t, i) => (
                  <p key={i} className="text-xs text-emerald-200 leading-relaxed">💡 {t}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function PlanTab() {
  return (
    <>
      <p className="text-sm text-slate-400 mb-3">고3 기준이에요.</p>
      <div className="space-y-2.5 mb-6">
        {TIMELINE.map((t, i) => (
          <div key={t.when} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-level-d text-white text-xs font-black flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <h3 className="font-bold text-sm">{t.emoji} {t.when}</h3>
            </div>
            {t.items.map((x) => (
              <p key={x} className="text-xs text-slate-300 leading-relaxed pl-9 relative before:content-['·'] before:absolute before:left-7">
                {x}
              </p>
            ))}
          </div>
        ))}
      </div>

      <h2 className="font-bold mb-2">❓ 먼저 정해야 할 것</h2>
      <div className="space-y-2">
        {ASK.map((a, i) => (
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

function DebutTab() {
  return (
    <>
      <p className="text-sm text-slate-400 mb-1">입시와 별개로 지금부터 할 수 있어요.</p>
      <p className="text-xs text-slate-500 mb-4">연재 경력·공모전 입상은 포트폴리오 전형에서 그대로 점수가 돼요.</p>
      <div className="space-y-2">
        {DEBUT.map((d) => (
          <div key={d.name} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <h3 className="font-bold text-sm mb-1">{d.name}</h3>
            <p className="text-xs text-pink-300 mb-1.5">{d.how}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{d.note}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-2.5">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm text-slate-100 mt-0.5 leading-relaxed">{value}</div>
    </div>
  )
}
