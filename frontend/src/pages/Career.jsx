import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DISCLAIMER, KEY_WARNING, ELIGIBILITY, WHY_GLOBAL, MAJOR_GROUPS,
  UNIVERSITIES, majorsByGroup, universityOf,
  SCHOOLS_USA, TIMELINE, GED_INFO, ASK_SCHOOL, GLOSSARY,
  ADMISSION, COMMON_PROCESS, DOC_CHECKLIST, tutorContext, TUTOR_PRESETS,
} from '../data/career'
import BottomNav from '../components/BottomNav'
import TutorBubble from '../components/TutorBubble'

const TABS = [
  { key: 'univ', label: '대학', emoji: '🏛' },
  { key: 'major', label: '학과', emoji: '🎯' },
  { key: 'route', label: '자격', emoji: '🎫' },
  { key: 'plan', label: '일정', emoji: '🗓' },
  { key: 'todo', label: '확인', emoji: '❓' },
]

const TONE = {
  ok: { fg: '#6ee7b7', bg: 'rgba(110,231,183,0.12)', bd: 'rgba(110,231,183,0.35)' },
  warn: { fg: '#fcd34d', bg: 'rgba(252,211,77,0.12)', bd: 'rgba(252,211,77,0.35)' },
  bad: { fg: '#fda4af', bg: 'rgba(251,113,133,0.12)', bd: 'rgba(251,113,133,0.35)' },
  info: { fg: '#a5b4fc', bg: 'rgba(165,180,252,0.12)', bd: 'rgba(165,180,252,0.35)' },
}

// 진학 가이드 — 하울 전용.
// 첫 화면은 「대학」. 대학을 누르면 그 대학에서 갈 수 있는 학과가 나온다.
export default function Career() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('univ')
  const [openUniv, setOpenUniv] = useState(null) // 상세를 연 대학 키

  // 대학 상세는 탭 전체를 덮는다
  if (openUniv) {
    return <UnivDetail univKey={openUniv} onBack={() => setOpenUniv(null)} />
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/g/learn')} className="text-slate-400 text-sm">← 배움</button>
        <h1 className="text-xl font-bold">🧭 대학 가이드</h1>
      </header>
      <p className="text-slate-400 text-sm mb-3">한국 대학 글로벌·국제학부 중심</p>

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

      {tab === 'univ' && <UnivTab onOpen={setOpenUniv} />}
      {tab === 'major' && <MajorTab onOpen={setOpenUniv} />}
      {tab === 'route' && <RouteTab />}
      {tab === 'plan' && <PlanTab />}
      {tab === 'todo' && <TodoTab />}

      <TutorBubble who="하울" topic="대학 가이드" context={tutorContext()} presets={TUTOR_PRESETS} accent="#7c3aed" />
      <BottomNav />
    </div>
  )
}

// 대학별 입시 조건
function AdmissionBlock({ a }) {
  const rows = [
    ['전형', a.track],
    ['일정', a.when],
    ['어학', a.english],
    ['평가', a.eval],
    ['면접', a.interview],
    ['수능 최저', a.minimum],
    ['학비', a.tuition],
  ].filter(([, v]) => v)

  return (
    <>
      <h2 className="font-bold mb-1">📋 입시 조건</h2>
      <p className="text-xs text-slate-500 mb-3">해마다 바뀌어요. 방향만 잡고 요강으로 확인하세요.</p>

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-3">
        {rows.map(([k, v], i) => (
          <div key={k} className={`py-2.5 ${i ? 'border-t border-slate-700/60' : ''}`}>
            <p className="text-[11px] text-slate-500">{k}</p>
            <p className="text-sm text-slate-100 leading-relaxed mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      {a.docs && (
        <>
          <p className="text-xs text-slate-400 mb-1.5">제출 서류</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {a.docs.map((d) => (
              <span key={d} className="text-[11px] bg-slate-900 border border-slate-700 rounded-full px-2.5 py-1">{d}</span>
            ))}
          </div>
        </>
      )}

      {a.key && (
        <div className="bg-indigo-500/10 border border-indigo-500/35 rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-indigo-300 mb-1">준비 포인트</p>
          <p className="text-sm text-indigo-50 leading-relaxed">{a.key}</p>
        </div>
      )}
    </>
  )
}

// ─────────────────────────── 대학 목록 (첫 화면)
function UnivTab({ onOpen }) {
  const [side, setSide] = useState('kor')

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {[['kor', '🇰🇷 한국 글로벌학부'], ['usa', '🇺🇸 미국 대학']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSide(k)}
            className={`py-2.5 rounded-xl text-sm font-bold ${side === k ? 'bg-level-e text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {side === 'kor' ? (
        <>
          <p className="text-[12px] leading-relaxed text-rose-200 bg-rose-500/10 border border-rose-500/35 rounded-2xl px-3.5 py-2.5 mb-4">
            🎫 {KEY_WARNING}
          </p>

          <div className="space-y-2.5">
            {UNIVERSITIES.map((u) => (
              <button
                key={u.key}
                onClick={() => onOpen(u.key)}
                className="w-full text-left bg-slate-800/60 border border-slate-700 rounded-3xl p-4 active:scale-[0.99] transition"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-base font-black text-white"
                    style={{ background: u.color }}
                  >
                    {u.name.slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="font-bold">{u.name}</span>
                      <span className="ml-auto text-[11px] text-slate-500 shrink-0">{u.tier}</span>
                    </span>
                    <span className="block text-sm text-indigo-300 truncate">{u.college}</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      {u.campus} · {u.lang}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/60">
                  <span className="text-xs text-slate-400">학과 {u.majors.length}개</span>
                  {u.majors.some((m) => m.hot) && (
                    <span className="text-[11px] text-emerald-300 bg-emerald-500/12 rounded-full px-2 py-0.5">
                      하울 관심 전공 있음
                    </span>
                  )}
                  <span className="ml-auto text-slate-500 text-lg">›</span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-[12px] leading-relaxed text-slate-300 bg-slate-800/60 border border-slate-700 rounded-2xl px-3.5 py-2.5 mb-4">
            LIS 성적표 + SAT/ACT + TOEFL + 에세이로 지원. 검정고시가 필요 없는 경로예요. 점수는 대략적 범위입니다.
          </p>
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
        </>
      )}
    </>
  )
}

// ─────────────────────────── 대학 상세 — 그 대학에서 갈 수 있는 학과
function UnivDetail({ univKey, onBack }) {
  const u = universityOf(univKey)
  if (!u) return null

  const byGroup = MAJOR_GROUPS.map((g) => ({
    ...g,
    items: u.majors.filter((m) => m.group === g.key),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="min-h-screen max-w-md mx-auto pb-28">
      <div className="px-5 pt-5 pb-6" style={{ background: `linear-gradient(160deg, ${u.color} 0%, #0f172a 100%)` }}>
        <button onClick={onBack} className="text-white/70 text-sm mb-3">← 대학 목록</button>
        <h1 className="text-2xl font-black text-white">{u.name}</h1>
        <p className="text-white/90 font-bold mt-0.5">{u.college}</p>
        <p className="text-white/60 text-xs mt-0.5">{u.en}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Tag>{u.campus}</Tag>
          <Tag>{u.lang}</Tag>
          <Tag>{u.tier}</Tag>
        </div>
      </div>

      <div className="p-5">
        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-emerald-300 mb-1">하울에게</p>
          <p className="text-sm text-emerald-50 leading-relaxed">{u.fit}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-5">
          <Info label="지원 전형" value={u.tracks.join(' · ')} />
          <Info label="어학" value={u.english} />
          <Info label="규모" value={u.scale} />
        </div>

        <h2 className="font-bold mb-1">🎓 이 대학에서 갈 수 있는 학과</h2>
        <p className="text-xs text-slate-500 mb-3">{u.majors.length}개 · 계열별로 묶었어요</p>

        <div className="space-y-4 mb-6">
          {byGroup.map((g) => (
            <div key={g.key}>
              <p className="text-xs font-bold text-slate-400 mb-1.5">
                {g.emoji} {g.name}
              </p>
              <div className="space-y-1.5">
                {g.items.map((m) => (
                  <div
                    key={m.name}
                    className={`rounded-2xl px-4 py-3 border ${
                      m.hot ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm">{m.name}</span>
                      {m.hot && (
                        <span className="text-[10px] text-indigo-300 bg-indigo-500/20 rounded-full px-2 py-0.5 shrink-0">
                          관심 전공
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.en}</p>
                    {m.note && <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{m.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {ADMISSION[u.key] && <AdmissionBlock a={ADMISSION[u.key]} />}

        <h2 className="font-bold mb-2">❓ 이 대학에 물어볼 것</h2>
        <div className="space-y-1.5">
          {u.check.map((c, i) => (
            <div key={i} className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="text-xs font-black text-slate-600 shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-slate-200 leading-relaxed">{c}</p>
            </div>
          ))}
        </div>
      </div>

      <TutorBubble
        who="하울"
        topic={`대학 가이드 — ${u.name} ${u.college}`}
        context={tutorContext()}
        presets={[`${u.name}는 나한테 맞을까?`, '여기 지원하려면 뭐가 필요해?', '이 학교 학과 중에 뭐가 좋을까?']}
        accent="#7c3aed"
      />
      <BottomNav />
    </div>
  )
}

// ─────────────────────────── 학과 계열 → 그 학과가 있는 대학
function MajorTab({ onOpen }) {
  const [group, setGroup] = useState('sci')
  const list = majorsByGroup(group)
  const g = MAJOR_GROUPS.find((x) => x.key === group)

  return (
    <>
      <p className="text-sm text-slate-400 mb-3">계열을 고르면 그 학과가 있는 대학이 나와요.</p>
      <div className="grid grid-cols-5 gap-1 mb-2">
        {MAJOR_GROUPS.map((m) => (
          <button
            key={m.key}
            onClick={() => setGroup(m.key)}
            className={`py-2 rounded-xl text-[11px] font-bold ${group === m.key ? 'bg-level-e text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <span className="block text-base leading-none mb-0.5">{m.emoji}</span>
            {m.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mb-4">{g?.desc} · {list.length}개</p>

      <div className="space-y-2">
        {list.map((m, i) => (
          <button
            key={i}
            onClick={() => onOpen(m.univKey)}
            className={`w-full text-left rounded-2xl px-4 py-3 border ${
              m.hot ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm">{m.name}</span>
              {m.hot && (
                <span className="text-[10px] text-indigo-300 bg-indigo-500/20 rounded-full px-2 py-0.5 shrink-0">
                  관심 전공
                </span>
              )}
              <span className="ml-auto text-slate-500 text-lg shrink-0">›</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{m.en}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-3.5 h-3.5 rounded" style={{ background: m.univColor }} />
              <span className="text-xs text-slate-300">{m.univName}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

// ─────────────────────────── 지원자격
function RouteTab() {
  return (
    <>
      <h2 className="font-bold mb-1">내가 쓸 수 있는 자격</h2>
      <p className="text-xs text-slate-500 mb-3">한국 대학은 이 셋 중 하나로 지원자격이 생겨요.</p>
      <div className="space-y-2.5 mb-6">
        {ELIGIBILITY.map((e) => {
          const t = TONE[e.tone]
          return (
            <div
              key={e.key}
              className={`rounded-3xl p-4 border ${e.mine ? 'ring-2 ring-emerald-400/40' : ''}`}
              style={{ background: t.bg, borderColor: t.bd }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{e.emoji}</span>
                <h3 className="font-bold text-sm" style={{ color: t.fg }}>{e.title}</h3>
                {e.mine && (
                  <span className="ml-auto text-[11px] font-bold text-emerald-200 bg-emerald-500/25 rounded-full px-2 py-0.5">
                    하울
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-100 leading-relaxed mb-2">{e.summary}</p>
              {e.detail.map((d, i) => (
                <p key={i} className="text-xs text-slate-300 leading-relaxed">· {d}</p>
              ))}
            </div>
          )
        })}
      </div>

      <div className="bg-level-b rounded-3xl p-5 mb-5">
        <h2 className="text-white font-black">{WHY_GLOBAL.title}</h2>
        <div className="mt-3 space-y-2">
          {WHY_GLOBAL.points.map((p, i) => (
            <p key={i} className="text-sm text-white/95 leading-relaxed">
              {p.emoji} {p.text}
            </p>
          ))}
        </div>
      </div>

      <h2 className="font-bold mb-2">📗 고졸 검정고시</h2>
      <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-4">
        <p className="text-sm text-slate-100 leading-relaxed mb-3">{GED_INFO.pass}</p>
        <p className="text-xs text-slate-400 mb-1">시행</p>
        {GED_INFO.rounds.map((r) => (
          <p key={r} className="text-xs text-slate-200 leading-relaxed">· {r}</p>
        ))}
        <p className="text-xs text-slate-400 mt-3 mb-1">과목</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {GED_INFO.subjects.map((s) => (
            <span key={s} className="text-[11px] bg-slate-900 border border-slate-700 rounded-full px-2.5 py-1">{s}</span>
          ))}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{GED_INFO.note}</p>
      </div>
    </>
  )
}

// ─────────────────────────── 일정
function PlanTab() {
  return (
    <>
      <p className="text-sm text-slate-400 mb-3">검정고시 → 글로벌학부 수시 순서예요.</p>
      <div className="space-y-2.5">
        {TIMELINE.map((t, i) => (
          <div key={t.when} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-level-e text-white text-xs font-black flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <h3 className="font-bold text-sm">
                {t.emoji} {t.when}
              </h3>
            </div>
            {t.items.map((x) => (
              <p key={x} className="text-xs text-slate-300 leading-relaxed pl-9 relative before:content-['·'] before:absolute before:left-7">
                {x}
              </p>
            ))}
          </div>
        ))}
      </div>

      <h2 className="font-bold mt-6 mb-1">🧾 수시 공통 절차</h2>
      <p className="text-xs text-slate-500 mb-3">대학이 달라도 큰 틀은 같아요.</p>
      <div className="space-y-1.5 mb-6">
        {COMMON_PROCESS.map((s2) => (
          <div key={s2.step} className="flex gap-3 bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-xs font-black text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              {s2.step}
            </span>
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="font-bold text-sm">{s2.name}</span>
                <span className="ml-auto text-[11px] text-indigo-300 shrink-0">{s2.when}</span>
              </span>
              <span className="block text-xs text-slate-400 leading-relaxed mt-0.5">{s2.what}</span>
            </span>
          </div>
        ))}
      </div>

      <h2 className="font-bold mb-1">📁 서류 체크리스트</h2>
      <p className="text-xs text-slate-500 mb-3">미리 만들어 두면 9월에 안 쫓겨요.</p>
      <div className="space-y-1.5 mb-6">
        {DOC_CHECKLIST.map((d) => (
          <div
            key={d.name}
            className={`rounded-2xl px-4 py-3 border ${d.must ? 'bg-rose-500/10 border-rose-500/35' : 'bg-slate-800/60 border-slate-700'}`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm">{d.name}</span>
              {d.must && <span className="text-[10px] text-rose-200 bg-rose-500/25 rounded-full px-2 py-0.5 shrink-0">필수</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.note}</p>
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

// ─────────────────────────── 확인할 것
function TodoTab() {
  return (
    <>
      <p className="text-sm text-slate-400 mb-4">물어봐야 답이 나오는 것들이에요.</p>
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
            <p className="text-[11px] text-indigo-300 pl-5 mt-1.5">📞 {a.to}</p>
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

function Info({ label, value }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-2.5">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm text-slate-100 mt-0.5 leading-relaxed">{value}</div>
    </div>
  )
}

function Tag({ children }) {
  return (
    <span className="text-[11px] bg-black/25 text-white/90 rounded-full px-2.5 py-1">{children}</span>
  )
}
