import FoodArt from '../components/FoodArt'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, RECIPES, recipesOf, LEVEL_LABEL, SAFETY_LABEL, HEAT_LABEL } from '../data/recipes'
import { getFavorites, toggleFavorite } from '../lib/localProgress'
import BottomNav from '../components/BottomNav'

// 요리 코너 — 하람. 요즘 인기 레시피를 사진 카드처럼 보고 따라 만든다.
// 사진은 외부 URL에 기대지 않고 그라데이션 + 이모지로 그린다.
// (레시피에 image 필드를 넣으면 그 사진을 대신 띄운다)
export default function Cooking() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const who = profile?.member_key || 'me'

  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get('recipe')) // 열려 있는 레시피 id
  const [favs, setFavs] = useState([])
  const [checked, setChecked] = useState({}) // 만드는 중 단계 체크

  useEffect(() => {
    setFavs(getFavorites('recipe', who))
    setChecked({})
  }, [who])

  const recipe = open ? RECIPES.find((r) => r.id === open) : null
  const list = cat === 'fav' ? RECIPES.filter((r) => favs.includes(r.id)) : recipesOf(cat)

  // ── 레시피 상세
  if (recipe) {
    const safety = SAFETY_LABEL[recipe.safety]
    const isFav = favs.includes(recipe.id)
    const done = recipe.steps.filter((_, i) => checked[`${recipe.id}:${i}`]).length

    return (
      <div className="min-h-screen max-w-md mx-auto pb-28">
        <Hero recipe={recipe} big />

        <div className="p-5 -mt-6 relative">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => { setOpen(null); setChecked({}) }} className="text-slate-400 text-sm">← 목록</button>
            <button
              onClick={() => setFavs(toggleFavorite('recipe', who, recipe.id))}
              className={`ml-auto text-sm px-3 py-1.5 rounded-full border ${isFav ? 'bg-rose-500/20 border-rose-500/50 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {isFav ? '♥ 저장됨' : '♡ 저장'}
            </button>
          </div>

          <h1 className="text-2xl font-black mb-1">{recipe.name}</h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">{recipe.intro}</p>

          <div className="grid grid-cols-4 gap-1.5 mb-5">
            <Chip label="시간" value={recipe.time} />
            <Chip label="난이도" value={LEVEL_LABEL[recipe.level]} />
            <Chip label="분량" value={recipe.servings} />
            <Chip label="불" value={HEAT_LABEL[recipe.heat]} />
          </div>

          <div
            className={`rounded-2xl px-4 py-3 mb-5 border text-sm ${
              safety.tone === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                : 'bg-amber-400/10 border-amber-400/35 text-amber-100'
            }`}
          >
            {safety.emoji} <span className="font-bold">{safety.text}</span>
            {recipe.safety === 'adult' && ' — 불·기름·칼을 쓰는 단계는 어른과 같이 하세요'}
          </div>

          <h2 className="font-bold mb-2">🧺 재료</h2>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 mb-5">
            {recipe.ingredients.map(([item, amount], i) => (
              <div
                key={i}
                className={`flex justify-between py-2 text-sm ${i ? 'border-t border-slate-700/60' : ''}`}
              >
                <span className="text-slate-200">{item}</span>
                <span className="text-slate-400">{amount}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">👩‍🍳 만드는 법</h2>
            <span className="text-xs text-slate-400">
              {done} / {recipe.steps.length} 단계
            </span>
          </div>
          <div className="space-y-2 mb-5">
            {recipe.steps.map((s, i) => {
              const key = `${recipe.id}:${i}`
              const on = !!checked[key]
              return (
                <button
                  key={i}
                  onClick={() => setChecked((c) => ({ ...c, [key]: !c[key] }))}
                  className={`w-full flex gap-3 text-left rounded-2xl p-4 border transition ${
                    on ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${
                      on ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {on ? '✓' : i + 1}
                  </span>
                  <span className={`text-sm leading-relaxed ${on ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                    {s}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/35 rounded-2xl p-4">
            <p className="text-xs font-bold text-indigo-300 mb-1">💡 팁</p>
            <p className="text-sm text-indigo-100 leading-relaxed">{recipe.tip}</p>
          </div>

          {done === recipe.steps.length && (
            <p className="text-center font-bold text-emerald-400 mt-5">다 만들었어요! 맛있게 드세요 🎉</p>
          )}
        </div>

        <BottomNav />
      </div>
    )
  }

  // ── 목록
  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/g/home')} className="text-slate-400 text-sm">← 집안</button>
        <h1 className="text-xl font-bold">🍳 요리</h1>
      </header>
      <p className="text-slate-400 text-sm mb-4">요즘 인기 레시피 {RECIPES.length}개 · 재료와 만드는 법까지</p>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {[...CATEGORIES, { key: 'fav', name: '저장함', emoji: '♥' }].map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-bold ${
              cat === c.key ? 'bg-level-f text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-16">
          아직 저장한 레시피가 없어요.<br />마음에 드는 요리에 ♡ 를 눌러보세요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map((r) => (
            <button key={r.id} onClick={() => { setOpen(r.id); setChecked({}) }} className="text-left">
              <Hero recipe={r} />
              <p className="font-bold text-sm mt-2">{r.name}</p>
              <p className="text-[11px] text-slate-400">
                {r.time} · {LEVEL_LABEL[r.level]}
                {favs.includes(r.id) && <span className="text-rose-400"> ♥</span>}
              </p>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// 사진 자리 — image 가 있으면 사진, 없으면 그라데이션 + 이모지 카드
function Hero({ recipe, big }) {
  if (recipe.image) return <img src={recipe.image} alt={recipe.name} className="w-full aspect-square object-cover rounded-2xl" />
  return <FoodArt id={recipe.id} name={recipe.name} className={big ? 'food-detail' : ''} />
}

function Chip({ label, value }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-1.5 py-2 text-center">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-[11px] font-bold text-slate-200 mt-0.5 leading-tight">{value}</div>
    </div>
  )
}
