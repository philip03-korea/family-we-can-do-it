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
  STATUS_LABEL,
} from '../lib/rewards'
import { FAMILY } from '../data/family'
import { PARENT_KEYS } from '../data/chores'

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

  async function refresh() {
    const [it, bal, my] = await Promise.all([
      listRewardItems(),
      getBalance(myKey).catch(() => 0),
      listMyPurchases(myKey).catch(() => []),
    ])
    setItems(it)
    setBalance(bal)
    setMine(my)
    if (isParent) setPending(await listPendingPurchases().catch(() => []))
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

  const categories = [...new Set(items.map((i) => i.category))]

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-24">
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
        {isParent && <TabBtn on={tab === 'approve'} onClick={() => setTab('approve')}>승인 {pending.length ? `(${pending.length})` : ''}</TabBtn>}
      </div>

      {msg && <p className="text-xs text-slate-300 mb-3">{msg}</p>}

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

      {/* 내 쿠폰함 */}
      {tab === 'mine' && (
        mine.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">아직 교환한 보상이 없어요.</p>
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
        )
      )}

      {/* 부모 승인 */}
      {tab === 'approve' && isParent && (
        pending.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">승인 대기 중인 교환이 없어요.</p>
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
        )
      )}
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
