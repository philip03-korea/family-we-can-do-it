import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  listRewardItems,
  getBalance,
  purchaseItem,
  listMyPurchases,
  listPendingPurchases,
  updatePurchaseStatus,
  cancelPurchase,
  addWish,
  listMyWishes,
  listPendingWishes,
  approveWish,
  rejectWish,
  listAllRewardItems,
  createRewardItem,
  updateRewardItem,
  deleteRewardItem,
  STATUS_LABEL,
} from '../lib/rewards'
import { FAMILY } from '../data/family'
import { PARENT_KEYS } from '../data/chores'
import BottomNav from '../components/BottomNav'

const nameOf = (key) => FAMILY.find((f) => f.key === key)?.name || key
const emojiOf = (key) => FAMILY.find((f) => f.key === key)?.emoji || '🙂'

export default function Shop() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const myKey = profile?.member_key
  const isParent = PARENT_KEYS.includes(myKey)

  const [items, setItems] = useState([])
  const [balance, setBalance] = useState(0)
  const [mine, setMine] = useState([])
  const [pending, setPending] = useState([])
  const [tab, setTab] = useState('shop') // shop | mine | approve
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [myWishes, setMyWishes] = useState([])
  const [pendingWishes, setPendingWishes] = useState([])
  const [wishForm, setWishForm] = useState(null) // {title, note, cost} or null
  const [allItems, setAllItems] = useState([]) // 관리용(비활성 포함)

  async function refresh() {
    const [it, bal, my, mw] = await Promise.all([
      listRewardItems(),
      getBalance(myKey).catch(() => 0),
      listMyPurchases(myKey).catch(() => []),
      listMyWishes(myKey).catch(() => []),
    ])
    setItems(it)
    setBalance(bal)
    setMine(my)
    setMyWishes(mw)
    if (isParent) {
      setPending(await listPendingPurchases().catch(() => []))
      setPendingWishes(await listPendingWishes().catch(() => []))
      setAllItems(await listAllRewardItems().catch(() => []))
    }
  }
  useEffect(() => {
    refresh().catch((e) => setMsg(friendly(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myKey])

  function friendly(e) {
    if (/reward_items|point_ledger|reward_purchases|exist|schema cache|42P01/i.test(e?.message || '')) {
      return '상점 테이블이 아직 없어요. Supabase에서 database/step8_rewards.sql 을 먼저 실행해 주세요.'
    }
    return e?.message || '오류'
  }

  async function buy(item) {
    if (busy) return
    setBusy(true)
    setMsg('')
    try {
      await purchaseItem(myKey, item)
      await refresh()
      setMsg(`✅ "${item.title}" 교환 완료! 부모님 승인 후 사용할 수 있어요.`)
    } catch (e) {
      setMsg('⚠️ ' + friendly(e))
    } finally {
      setBusy(false)
    }
  }

  async function act(p, status) {
    try {
      if (status === 'canceled') await cancelPurchase(p)
      else await updatePurchaseStatus(p.id, status)
      await refresh()
    } catch (e) {
      setMsg('⚠️ ' + friendly(e))
    }
  }

  async function submitWish() {
    if (!wishForm?.title?.trim()) return
    try {
      await addWish(myKey, { title: wishForm.title.trim(), note: wishForm.note, suggestedCost: wishForm.cost })
      setWishForm(null)
      await refresh()
      setMsg('✨ 소원을 보냈어요! 부모님이 승인하면 상점에 추가돼요.')
    } catch (e) {
      setMsg('⚠️ ' + friendly(e))
    }
  }

  async function okWish(w) {
    const cost = prompt(`"${w.title}" 를 몇 포인트로 상점에 올릴까요?`, w.suggested_cost || 100)
    if (cost == null) return
    try {
      await approveWish(w, cost)
      await refresh()
    } catch (e) {
      setMsg('⚠️ ' + friendly(e))
    }
  }
  async function noWish(id) {
    try {
      await rejectWish(id)
      await refresh()
    } catch (e) {
      setMsg('⚠️ ' + friendly(e))
    }
  }

  const categories = [...new Set(items.map((i) => i.category))]

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="text-slate-400 text-sm">← 대시보드</button>
        <h1 className="text-xl font-bold">🛒 보상 상점</h1>
      </header>

      {/* 내 포인트 */}
      <div className="bg-level-c rounded-3xl p-5 mb-4 text-center">
        <p className="text-white/80 text-sm">{emojiOf(myKey)} {nameOf(myKey)}의 포인트</p>
        <p className="text-4xl font-black text-white mt-1">{balance}P</p>
        <p className="text-white/70 text-xs mt-1">집안일을 완료하면 포인트가 쌓여요</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <TabBtn on={tab === 'shop'} onClick={() => setTab('shop')}>상점</TabBtn>
        <TabBtn on={tab === 'mine'} onClick={() => setTab('mine')}>내 쿠폰함</TabBtn>
        {isParent && <TabBtn on={tab === 'approve'} onClick={() => setTab('approve')}>승인 {pending.length + pendingWishes.length ? `(${pending.length + pendingWishes.length})` : ''}</TabBtn>}
        {isParent && <TabBtn on={tab === 'admin'} onClick={() => setTab('admin')}>상품관리</TabBtn>}
      </div>

      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

      {/* 소원 추가 */}
      {tab === 'shop' && (
        <div className="mb-4">
          {!wishForm ? (
            <button
              onClick={() => setWishForm({ title: '', note: '', cost: '' })}
              className="w-full py-3 rounded-2xl border border-dashed border-indigo-400/60 text-indigo-300 text-sm font-medium"
            >
              ✨ 소원 추가하기 (원하는 보상 직접 요청)
            </button>
          ) : (
            <div className="bg-slate-800/60 border border-indigo-500/40 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-bold">✨ 내 소원 보내기</p>
              <input
                value={wishForm.title}
                onChange={(e) => setWishForm({ ...wishForm, title: e.target.value })}
                placeholder="원하는 보상 (예: 친구랑 PC방 2시간)"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm"
              />
              <input
                value={wishForm.note}
                onChange={(e) => setWishForm({ ...wishForm, note: e.target.value })}
                placeholder="설명 (선택)"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm"
              />
              <input
                type="number"
                value={wishForm.cost}
                onChange={(e) => setWishForm({ ...wishForm, cost: e.target.value })}
                placeholder="희망 포인트 (선택, 부모님이 최종 결정)"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm"
              />
              <div className="flex gap-2">
                <button onClick={submitWish} className="flex-1 py-2 rounded-lg bg-indigo-600 text-sm font-bold">보내기</button>
                <button onClick={() => setWishForm(null)} className="px-4 py-2 rounded-lg bg-slate-700 text-sm">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 상점 */}
      {tab === 'shop' && (
        items.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">상품이 없어요. (step8_rewards.sql 실행 확인)</p>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="mb-5">
              <h2 className="text-sm font-bold text-slate-400 mb-2">{cat}</h2>
              <div className="space-y-2">
                {items.filter((i) => i.category === cat).map((item) => {
                  const afford = balance >= item.cost
                  return (
                    <div key={item.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{item.title}</div>
                        <div className="text-xs text-slate-400">{item.description}</div>
                      </div>
                      <button
                        onClick={() => buy(item)}
                        disabled={!afford || busy}
                        className={`shrink-0 px-3 py-2 rounded-xl text-sm font-bold ${afford ? 'bg-indigo-600' : 'bg-slate-700 text-slate-500'}`}
                      >
                        {item.cost}P
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )
      )}

      {/* 내 쿠폰함 + 내 소원 */}
      {tab === 'mine' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-400 mb-2">교환한 보상</h2>
            {mine.length === 0 ? (
              <p className="text-slate-500 text-sm">아직 교환한 보상이 없어요.</p>
            ) : (
              <ul className="space-y-2">
                {mine.map((p) => (
                  <li key={p.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{p.item_title}</div>
                      <div className="text-xs text-slate-500">{p.created_at.slice(5, 10)} · -{p.cost}P</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-400 mb-2">내 소원 ✨</h2>
            {myWishes.length === 0 ? (
              <p className="text-slate-500 text-sm">보낸 소원이 없어요. 상점에서 "소원 추가하기"로 요청해요.</p>
            ) : (
              <ul className="space-y-2">
                {myWishes.map((w) => (
                  <li key={w.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{w.title}</div>
                      <div className="text-xs text-slate-500">{w.suggested_cost ? `희망 ${w.suggested_cost}P` : '포인트 미정'}</div>
                    </div>
                    <StatusBadge status={w.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 부모 승인 — 소원 + 교환 */}
      {tab === 'approve' && isParent && (
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-400 mb-2">소원 승인 ✨</h2>
            {pendingWishes.length === 0 ? (
              <p className="text-slate-500 text-sm">대기 중인 소원이 없어요.</p>
            ) : (
              <ul className="space-y-2">
                {pendingWishes.map((w) => (
                  <li key={w.id} className="bg-slate-800/60 border border-indigo-500/30 rounded-2xl p-3">
                    <div className="font-bold text-sm mb-0.5">{emojiOf(w.member_key)} {nameOf(w.member_key)} · {w.title}</div>
                    {w.note && <div className="text-xs text-slate-400 mb-1">{w.note}</div>}
                    <div className="text-xs text-slate-500 mb-2">{w.suggested_cost ? `희망 ${w.suggested_cost}P` : '포인트 미정'}</div>
                    <div className="flex gap-2">
                      <button onClick={() => okWish(w)} className="flex-1 py-2 rounded-lg bg-emerald-600 text-sm font-medium">상점에 추가</button>
                      <button onClick={() => noWish(w.id)} className="flex-1 py-2 rounded-lg bg-rose-600/80 text-sm font-medium">거절</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
          <h2 className="text-sm font-bold text-slate-400 mb-2">교환 승인</h2>
          {pending.length === 0 ? (
          <p className="text-slate-500 text-sm">승인 대기 중인 교환이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm">{emojiOf(p.member_key)} {nameOf(p.member_key)} · {p.item_title}</div>
                  <span className="text-xs text-slate-400">-{p.cost}P</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => act(p, 'approved')} className="flex-1 py-2 rounded-lg bg-emerald-600 text-sm font-medium">승인</button>
                  <button onClick={() => act(p, 'used')} className="flex-1 py-2 rounded-lg bg-slate-600 text-sm font-medium">사용완료</button>
                  <button onClick={() => act(p, 'canceled')} className="flex-1 py-2 rounded-lg bg-rose-600/80 text-sm font-medium">취소·환불</button>
                </div>
              </li>
            ))}
          </ul>
            )}
          </div>
        </div>
      )}

      {/* 상품 관리 (부모) */}
      {tab === 'admin' && isParent && (
        <RewardAdmin items={allItems} onChanged={refresh} onError={(m) => setMsg('⚠️ ' + friendly({ message: m }))} />
      )}

      <BottomNav />
    </div>
  )
}

// 부모: 보상 상품 추가/수정/삭제
function RewardAdmin({ items, onChanged, onError }) {
  const [form, setForm] = useState({ icon: '🎁', title: '', description: '', cost: '', category: '' })

  async function add() {
    if (!form.title.trim() || !form.cost) return
    try {
      await createRewardItem(form)
      setForm({ icon: '🎁', title: '', description: '', cost: '', category: '' })
      await onChanged()
    } catch (e) {
      onError(e.message)
    }
  }

  return (
    <div className="space-y-5">
      {/* 새 상품 추가 */}
      <div className="bg-slate-800/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-bold">➕ 새 보상 추가</p>
        <div className="flex gap-2">
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎁"
            className="w-12 text-center px-2 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none" />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="보상 이름"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm" />
        </div>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="설명 (선택)"
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm" />
        <div className="flex gap-2">
          <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="포인트"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="분류 (예: 특권)"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm" />
        </div>
        <button onClick={add} className="w-full py-2 rounded-lg bg-emerald-600 text-sm font-bold">추가하기</button>
      </div>

      {/* 기존 상품 수정/삭제 */}
      <div>
        <p className="text-sm font-bold text-slate-400 mb-2">기존 보상 ({items.length})</p>
        <div className="space-y-2">
          {items.map((it) => (
            <AdminItemRow key={it.id} item={it} onChanged={onChanged} onError={onError} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminItemRow({ item, onChanged, onError }) {
  const [title, setTitle] = useState(item.title)
  const [cost, setCost] = useState(item.cost)
  const dirty = title !== item.title || Number(cost) !== item.cost

  async function save() {
    try {
      await updateRewardItem(item.id, { title, cost })
      await onChanged()
    } catch (e) {
      onError(e.message)
    }
  }
  async function toggle() {
    try {
      await updateRewardItem(item.id, { active: !item.active })
      await onChanged()
    } catch (e) {
      onError(e.message)
    }
  }
  async function remove() {
    if (!confirm(`"${item.title}" 삭제할까요?`)) return
    try {
      await deleteRewardItem(item.id)
      await onChanged()
    } catch (e) {
      onError(e.message)
    }
  }

  return (
    <div className={`bg-slate-800/60 border border-slate-700 rounded-2xl p-3 ${item.active ? '' : 'opacity-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{item.icon}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm" />
        <input type="number" value={cost} onChange={(e) => setCost(e.target.value)}
          className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm" />
        <span className="text-xs text-slate-500">P</span>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={!dirty} className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-xs font-medium disabled:opacity-40">저장</button>
        <button onClick={toggle} className="flex-1 py-1.5 rounded-lg bg-slate-600 text-xs font-medium">{item.active ? '숨기기' : '보이기'}</button>
        <button onClick={remove} className="flex-1 py-1.5 rounded-lg bg-rose-600/80 text-xs font-medium">삭제</button>
      </div>
    </div>
  )
}

function TabBtn({ on, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2 rounded-xl text-sm font-bold ${on ? 'bg-level-c text-white' : 'bg-slate-800 text-slate-400'}`}>
      {children}
    </button>
  )
}

function StatusBadge({ status }) {
  const map = {
    requested: 'bg-amber-500/20 text-amber-300',
    approved: 'bg-emerald-500/20 text-emerald-300',
    used: 'bg-slate-600/40 text-slate-300',
    canceled: 'bg-rose-500/20 text-rose-300',
  }
  return <span className={`text-xs px-2.5 py-1 rounded-full ${map[status] || ''}`}>{STATUS_LABEL[status] || status}</span>
}
