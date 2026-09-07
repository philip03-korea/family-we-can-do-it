import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { GROUPS, FEATURES, DEFAULT_FEATURES, resolveFeatures, resolveGroups } from '../data/features'
import { FAMILY, colorOf, textOnColor } from '../data/family'
import BottomNav from '../components/BottomNav'

const KID_KEYS = ['haeum', 'haul', 'haram']

// 부모용 「화면 설정」 — 아이별로 어떤 기능을 열지 스위치로 고른다.
// 저장은 profiles.enabled_features (text[], step15). 부모 자신은 대상이 아니다.
export default function Manage() {
  const navigate = useNavigate()
  const { isParent, allProfiles, refreshAllProfiles } = useAuth()

  const [child, setChild] = useState('haram')
  const [draft, setDraft] = useState(null) // 화면에서 만지는 중인 값
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const kids = useMemo(
    () =>
      KID_KEYS.map((k) => ({
        key: k,
        profile: allProfiles.find((p) => p.member_key === k),
        meta: FAMILY.find((f) => f.key === k) || {},
      })).filter((k) => k.profile),
    [allProfiles],
  )

  // 아이를 바꾸면 그 아이의 저장값(없으면 기본값)을 초안으로 가져온다
  useEffect(() => {
    const p = allProfiles.find((x) => x.member_key === child)
    if (!p) return
    setDraft(resolveFeatures(child, p.enabled_features))
    setMsg('')
  }, [child, allProfiles])

  if (!isParent) return <Navigate to="/" replace />

  const on = new Set(draft || [])
  const groupsLive = resolveGroups(draft || [])
  const childMeta = FAMILY.find((f) => f.key === child) || {}
  const savedProfile = allProfiles.find((x) => x.member_key === child)
  const isDefault = !Array.isArray(savedProfile?.enabled_features)
  const dirty =
    draft &&
    JSON.stringify([...draft].sort()) !==
      JSON.stringify([...resolveFeatures(child, savedProfile?.enabled_features)].sort())

  function toggle(key) {
    setMsg('')
    setDraft((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))
  }

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ enabled_features: draft })
        .eq('member_key', child)
      if (error) throw error
      await refreshAllProfiles()
      setMsg(`✅ ${childMeta.name} 화면에 저장했어요`)
    } catch (e) {
      // step15 를 아직 Supabase 에서 실행하지 않았으면 컬럼이 없어 여기서 걸린다
      const hint = /enabled_features/.test(e.message || '')
        ? ' — database/step15_visibility.sql 을 Supabase SQL Editor에서 먼저 실행해 주세요.'
        : ''
      setMsg('⚠️ ' + e.message + hint)
    } finally {
      setSaving(false)
    }
  }

  function resetToDefault() {
    setDraft(DEFAULT_FEATURES[child] || [])
    setMsg('나이별 기본값을 불러왔어요. 저장을 눌러야 반영돼요.')
  }

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-40">
      <header className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/me')} className="text-slate-400 text-sm">← 나</button>
        <h1 className="text-xl font-bold">🎛 화면 설정</h1>
      </header>
      <p className="text-slate-400 text-sm mb-4">아이에게 어떤 탭을 보여줄지 정합니다</p>

      {/* 아이 선택 */}
      <div className="flex gap-1.5 mb-3">
        {kids.map((k) => {
          const active = k.key === child
          return (
            <button
              key={k.key}
              onClick={() => setChild(k.key)}
              className={`flex-1 rounded-2xl py-2.5 text-center border ${active ? 'border-white' : 'border-slate-700'}`}
              style={{
                background: active ? colorOf(k.key) : '#1e293b',
                color: active ? textOnColor(k.key) : '#cbd5e1',
              }}
            >
              <div className="text-xl leading-none">{k.meta.emoji}</div>
              <div className="text-xs mt-1 font-bold">{k.meta.name}</div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700 rounded-2xl px-3.5 py-2.5 mb-4 leading-relaxed">
        끈 기능은 {childMeta.name} 화면에서 완전히 사라집니다. 그룹 안이 전부 꺼지면 하단 탭도 함께 사라져요.
        {isDefault && <span className="block mt-1 text-slate-500">지금은 나이별 기본값을 쓰는 중이에요.</span>}
      </p>

      {/* 그룹별 스위치 */}
      {GROUPS.map((g) => {
        const items = FEATURES.filter((f) => f.group === g.key)
        const live = items.filter((f) => on.has(f.key)).length
        return (
          <div key={g.key} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold">
                {g.emoji} {g.label}
              </h2>
              <span className="text-xs" style={{ color: live ? g.tint : '#64748b' }}>
                {live ? `${live} / ${items.length} 켜짐` : '전부 꺼짐 · 탭 사라짐'}
              </span>
            </div>
            <div className="space-y-1.5">
              {items.map((f) => {
                const isOn = on.has(f.key)
                return (
                  <button
                    key={f.key}
                    onClick={() => toggle(f.key)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left border transition ${
                      isOn ? 'bg-slate-800/80 border-slate-600' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <span className={`text-xl ${isOn ? '' : 'grayscale opacity-40'}`}>{f.emoji}</span>
                    <span className="min-w-0">
                      <span className={`block font-bold text-sm ${isOn ? 'text-white' : 'text-slate-500'}`}>{f.name}</span>
                      <span className="block text-[11px] text-slate-500 truncate">{f.desc}</span>
                    </span>
                    <span
                      className={`ml-auto w-12 h-7 rounded-full relative shrink-0 transition ${
                        isOn ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isOn ? 'left-6' : 'left-1'}`}
                      />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* 하단 탭 미리보기 */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 mb-4">
        <p className="text-xs text-slate-400 mb-2">{childMeta.name}에게 보이는 하단 탭</p>
        <div
          className="grid gap-1 bg-slate-800/70 rounded-2xl p-2"
          style={{ gridTemplateColumns: `repeat(${groupsLive.length + 2}, minmax(0,1fr))` }}
        >
          {[{ emoji: '🏠', label: '홈' }, ...groupsLive, { emoji: '⚙️', label: '나' }].map((t, i) => (
            <div key={i} className="text-center py-1.5">
              <div className="text-lg leading-none">{t.emoji}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {msg && <p className="text-sm text-slate-200 mb-3 whitespace-pre-wrap">{msg}</p>}

      <div className="fixed bottom-16 inset-x-0 z-30 max-w-md mx-auto px-5 pb-3">
        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            className="px-4 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-medium"
          >
            기본값
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex-1 py-3.5 rounded-2xl bg-level-c font-bold disabled:opacity-40"
          >
            {saving ? '저장 중…' : dirty ? `${childMeta.name} 화면 저장` : '저장됨'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
