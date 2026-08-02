import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FAMILY, colorOf, textOnColor } from '../data/family'
import { TALK_CATEGORIES, STRENGTH_CARDS, MOODS, moodOf, MEETING_TIPS } from '../data/talk'
import {
  saveDiary, listMyDiary, listSharedDiary, setDiaryShared, deleteDiary,
  giveStrengths, listStrengths, deleteStrength, friendlyTalkError, todayYmd,
} from '../lib/talk'
import BottomNav from '../components/BottomNav'

const nameOf = (k) => FAMILY.find((f) => f.key === k)?.name || '가족'

function Avatar({ k, size = 24 }) {
  if (!k) return null
  const f = FAMILY.find((x) => x.key === k)
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold shrink-0"
      style={{ width: size, height: size, background: colorOf(k), color: textOnColor(k), fontSize: size * 0.5 }}
    >
      {f?.emoji || '·'}
    </span>
  )
}

// ============================================================
// 1. 대화 카드 — 가족회의마다 카테고리를 바꿔가며
// ============================================================
function TalkCards() {
  const [cat, setCat] = useState(null)
  const [idx, setIdx] = useState(0)
  const [used, setUsed] = useState([])

  if (!cat) {
    return (
      <div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 mb-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            가족회의마다 <strong className="text-white">주제를 바꿔가며</strong> 써보세요.
            점수도 정답도 없어요 — 그냥 서로 물어보는 카드예요.
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {TALK_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => { setCat(c); setIdx(0); setUsed([]) }}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-left active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm" style={{ color: c.color }}>{c.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.desc} · {c.cards.length}장</div>
                </div>
                <span className="text-slate-500">›</span>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-2">🗣️ 가족회의 진행 팁</h3>
          <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
            {MEETING_TIPS.map((t) => <li key={t}>· {t}</li>)}
          </ul>
        </div>
      </div>
    )
  }

  const card = cat.cards[idx]
  const next = () => {
    const remain = cat.cards.map((_, i) => i).filter((i) => !used.includes(i) && i !== idx)
    if (!remain.length) { setUsed([]); setIdx(Math.floor(Math.random() * cat.cards.length)); return }
    const pick = remain[Math.floor(Math.random() * remain.length)]
    setUsed((u) => [...u, idx])
    setIdx(pick)
  }

  return (
    <div>
      <button onClick={() => setCat(null)} className="text-slate-400 text-sm mb-3">← 주제 바꾸기</button>

      <div
        className="rounded-3xl p-6 mb-4 min-h-[220px] flex flex-col items-center justify-center text-center border-2"
        style={{ background: `${cat.color}18`, borderColor: `${cat.color}66` }}
      >
        <div className="text-3xl mb-3">{cat.emoji}</div>
        <p className="text-lg font-bold leading-relaxed">{card}</p>
        <div className="text-[11px] text-slate-500 mt-4">
          {cat.name} · {used.length + 1} / {cat.cards.length}
        </div>
      </div>

      <button onClick={next} className="w-full py-3.5 rounded-2xl font-bold text-sm mb-2" style={{ background: cat.color, color: '#0f172a' }}>
        🎲 다음 카드
      </button>
      <p className="text-center text-[11px] text-slate-500">답하기 싫으면 패스해도 괜찮아요</p>
    </div>
  )
}

// ============================================================
// 2. 감정 일기 — 매일 1줄. 기본 비공개
// ============================================================
function Diary({ user, myKey }) {
  const [mine, setMine] = useState([])
  const [shared, setShared] = useState([])
  const [mood, setMood] = useState(4)
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const [view, setView] = useState('me') // me | family

  const today = todayYmd()
  const todayRow = useMemo(() => mine.find((d) => d.entry_date === today), [mine, today])

  async function refresh() {
    if (!user?.id) return
    const [m, s] = await Promise.all([
      listMyDiary(user.id).catch(() => []),
      listSharedDiary().catch(() => []),
    ])
    setMine(m); setShared(s)
    const t = m.find((d) => d.entry_date === today)
    if (t) { setMood(t.mood); setNote(t.note || '') }
  }
  useEffect(() => { refresh().catch((e) => setMsg('⚠️ ' + friendlyTalkError(e))) /* eslint-disable-next-line */ }, [user?.id])

  async function save() {
    try {
      await saveDiary({ userId: user.id, memberKey: myKey, mood, note })
      await refresh()
      setMsg('💾 오늘 일기를 저장했어요.')
    } catch (e) { setMsg('⚠️ ' + friendlyTalkError(e)) }
  }

  async function toggleShare(row) {
    try { await setDiaryShared(row.id, !row.shared); await refresh() }
    catch (e) { setMsg('⚠️ ' + friendlyTalkError(e)) }
  }

  // 최근 14일 추이
  const trend = mine.slice(0, 14).reverse()

  return (
    <div>
      {/* 오늘 기록 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">오늘 기분 어때요?</h3>
          <span className="text-[11px] text-slate-500">{today}</span>
        </div>

        <div className="flex justify-between gap-1 mb-3">
          {MOODS.map((m) => (
            <button
              key={m.v}
              onClick={() => setMood(m.v)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl border-2 transition ${
                mood === m.v ? 'scale-105' : 'border-transparent opacity-50'
              }`}
              style={{ borderColor: mood === m.v ? m.color : 'transparent', background: mood === m.v ? `${m.color}22` : '#0f172a' }}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[9px] mt-0.5 text-slate-400">{m.label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="한 줄로 적어보세요 (안 써도 괜찮아요)"
          className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-sm resize-none outline-none focus:border-indigo-500 mb-2"
          rows={2}
        />

        <button onClick={save} className="w-full py-2.5 rounded-xl bg-indigo-600 font-bold text-sm">
          {todayRow ? '오늘 일기 수정' : '오늘 일기 저장'}
        </button>

        {todayRow && (
          <button
            onClick={() => toggleShare(todayRow)}
            className={`w-full mt-2 py-2 rounded-xl text-xs font-bold border ${
              todayRow.shared ? 'bg-violet-600 border-violet-400' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            {todayRow.shared ? '✓ 가족에게 보임' : '🔒 나만 보는 중 — 가족에게 보여주기'}
          </button>
        )}
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          일기는 <strong className="text-slate-400">기본적으로 나만 봐요.</strong> 보여주고 싶은 날만 공유하면 돼요.
        </p>
      </div>

      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

      {/* 추이 */}
      {trend.length > 1 && (
        <div className="bg-slate-800/60 rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">최근 {trend.length}일 기분</h3>
          <div className="flex items-end gap-1 h-16">
            {trend.map((d) => {
              const m = moodOf(d.mood)
              return (
                <div key={d.id} className="flex-1 flex flex-col items-center justify-end" title={`${d.entry_date} ${m.label}`}>
                  <div className="w-full rounded-t" style={{ height: `${(d.mood / 6) * 100}%`, background: m.color, minHeight: 4 }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 mt-1">
            <span>{trend[0]?.entry_date.slice(5)}</span>
            <span>{trend[trend.length - 1]?.entry_date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* 보기 전환 */}
      <div className="flex gap-2 mb-3">
        {[{ k: 'me', t: `내 일기 (${mine.length})` }, { k: 'family', t: `가족이 공유한 것 (${shared.length})` }].map((x) => (
          <button
            key={x.k}
            onClick={() => setView(x.k)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
              view === x.k ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            {x.t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {(view === 'me' ? mine : shared).length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">
            {view === 'me' ? '아직 기록이 없어요.' : '아직 공유된 일기가 없어요.'}
          </p>
        ) : (
          (view === 'me' ? mine : shared).map((d) => {
            const m = moodOf(d.mood)
            return (
              <div key={d.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.emoji}</span>
                  {view === 'family' && <Avatar k={d.member_key} size={20} />}
                  <div className="flex-1 min-w-0">
                    {view === 'family' && <span className="text-[11px] font-bold text-slate-300">{nameOf(d.member_key)} · </span>}
                    <span className="text-[11px] text-slate-500">{d.entry_date}</span>
                    {d.note && <p className="text-sm text-slate-200 mt-0.5">{d.note}</p>}
                  </div>
                  {view === 'me' && (
                    <>
                      <button onClick={() => toggleShare(d)} className={`text-[10px] px-2 py-1 rounded-lg ${d.shared ? 'bg-violet-600' : 'bg-slate-700 text-slate-400'}`}>
                        {d.shared ? '공유중' : '비공개'}
                      </button>
                      <button onClick={async () => { await deleteDiary(d.id); refresh() }} className="text-slate-500 text-sm">🗑</button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ============================================================
// 3. 강점 찾기 — 서로에게 강점을 골라주는 선물
// ============================================================
function Strengths({ user, myKey }) {
  const [notes, setNotes] = useState([])
  const [target, setTarget] = useState(null)
  const [picked, setPicked] = useState([])
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')

  async function refresh() {
    try { setNotes(await listStrengths()) } catch (e) { setMsg('⚠️ ' + friendlyTalkError(e)) }
  }
  useEffect(() => { refresh() }, [])

  async function give() {
    if (!target || !picked.length) { setMsg('⚠️ 누구에게, 어떤 강점인지 골라주세요.'); return }
    try {
      await giveStrengths({ userId: user.id, fromMember: myKey, toMember: target, strengths: picked, note })
      setPicked([]); setNote(''); setTarget(null)
      await refresh()
      setMsg('🎁 강점을 전했어요!')
    } catch (e) { setMsg('⚠️ ' + friendlyTalkError(e)) }
  }

  // 편지처럼 — 나와 관련된 것만 보인다 (받은 것 / 보낸 것)
  const toMe = notes.filter((n) => n.to_member === myKey)   // 나에게 온 것
  const fromMe = notes.filter((n) => n.from_member === myKey) // 내가 보낸 것

  return (
    <div>
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 mb-4">
        <p className="text-xs text-slate-300 leading-relaxed">
          가족에게 <strong className="text-white">강점을 골라서 선물</strong>해보세요.
          내가 모르는 내 강점을 남이 알려주는 게 자존감에 제일 큰 도움이 돼요.
        </p>
      </div>

      {/* 나에게 온 강점 */}
      {toMe.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-emerald-200 mb-2">🎁 가족이 본 나의 강점</h3>
          <div className="space-y-2">
            {toMe.map((n) => (
              <div key={n.id} className="bg-slate-900/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Avatar k={n.from_member} size={18} />
                  <span className="text-[11px] font-bold text-slate-300">{nameOf(n.from_member)}가 본 나</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(n.strengths || []).map((s) => (
                    <span key={s} className="text-[11px] bg-emerald-600/30 border border-emerald-500/40 text-emerald-100 rounded-full px-2 py-0.5">⭐ {s}</span>
                  ))}
                </div>
                {n.note && <p className="text-xs text-slate-300 mt-2">💬 {n.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 강점 주기 */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-bold mb-2">누구의 강점을 찾아줄까요?</h3>
        <div className="flex gap-2 mb-3">
          {FAMILY.filter((f) => f.key !== myKey).map((f) => (
            <button
              key={f.key}
              onClick={() => setTarget(target === f.key ? null : f.key)}
              className="flex-1 rounded-xl py-2 border-2"
              style={{ borderColor: target === f.key ? f.color : 'transparent', background: '#0f172a' }}
            >
              <div className="mx-auto"><Avatar k={f.key} size={28} /></div>
              <div className="text-[10px] font-bold mt-1" style={{ color: f.color }}>{f.name}</div>
            </button>
          ))}
        </div>

        {target && (
          <>
            <p className="text-xs text-slate-400 mb-2">
              {nameOf(target)}의 강점을 골라주세요 (여러 개 가능) — {picked.length}개 선택
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-44 overflow-y-auto">
              {STRENGTH_CARDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPicked((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}
                  className={`text-[11px] rounded-full px-2.5 py-1 border ${
                    picked.includes(s)
                      ? 'bg-emerald-600 border-emerald-400 font-bold'
                      : 'bg-slate-900 border-slate-600 text-slate-400'
                  }`}
                >
                  {picked.includes(s) ? '⭐ ' : ''}{s}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`${nameOf(target)}에게 한마디 (선택)`}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2.5 text-sm resize-none outline-none focus:border-emerald-500 mb-2"
              rows={2}
            />
            <button onClick={give} className="w-full py-2.5 rounded-xl bg-emerald-600 font-bold text-sm">
              🎁 {nameOf(target)}에게 전하기
            </button>
          </>
        )}
      </div>

      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

      {/* 내가 보낸 강점 — 편지처럼 나와 상대에게만 보인다 */}
      {fromMe.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-2">✉️ 내가 전한 강점</h3>
          <p className="text-[11px] text-slate-500 mb-2">강점 편지는 주고받은 두 사람에게만 보여요.</p>
          <div className="space-y-2">
            {fromMe.map((n) => (
              <div key={n.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5 text-[11px]">
                  <Avatar k={n.from_member} size={18} />
                  <span className="text-slate-400">{nameOf(n.from_member)}</span>
                  <span className="text-slate-600">→</span>
                  <Avatar k={n.to_member} size={18} />
                  <span className="font-bold text-slate-200">{nameOf(n.to_member)}</span>
                  <span className="text-slate-600 ml-auto">{n.created_at.slice(5, 10)}</span>
                  {n.from_member === myKey && (
                    <button onClick={async () => { await deleteStrength(n.id); refresh() }} className="text-slate-500">🗑</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(n.strengths || []).map((s) => (
                    <span key={s} className="text-[10px] bg-slate-700 rounded-full px-2 py-0.5 text-slate-200">{s}</span>
                  ))}
                </div>
                {n.note && <p className="text-xs text-slate-400 mt-1.5">💬 {n.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 메인
// ============================================================
export default function Talk() {
  const { user, ownProfile } = useAuth()
  const navigate = useNavigate()
  const myKey = ownProfile?.member_key
  const [tab, setTab] = useState('cards')

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">💬 가족 대화</h1>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { k: 'cards',     t: '🃏 대화 카드' },
          { k: 'diary',     t: '📔 감정 일기' },
          { k: 'strengths', t: '⭐ 강점 찾기' },
        ].map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`py-2 rounded-xl text-xs font-bold border ${
              tab === x.k ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            {x.t}
          </button>
        ))}
      </div>

      {tab === 'cards' && <TalkCards />}
      {tab === 'diary' && <Diary user={user} myKey={myKey} />}
      {tab === 'strengths' && <Strengths user={user} myKey={myKey} />}

      <BottomNav />
    </div>
  )
}
