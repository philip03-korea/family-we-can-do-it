import { supabase } from './supabase'

// ============================================================
// 웹 푸시 알림 — 구독/해제 + 구독정보 저장 (push_subscriptions)
// VAPID 공개키는 노출돼도 안전. 발송은 서버(Edge Function send-push).
// ============================================================
const VAPID_PUBLIC = 'BJRx5cvNi-uKdJrgWLAD3V0ZGkxZwb537WyqC4qzEZBIvchxDwLqNqHG1OwfgQGynUvwhYDXd3fHfSriDpJkktM'

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export async function getPushEnabled() {
  if (!isPushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return !!sub && Notification.permission === 'granted'
  } catch {
    return false
  }
}

/** 알림 켜기: 권한 요청 → 구독 → DB 저장 */
export async function enablePush({ userId, memberKey }) {
  if (!isPushSupported()) throw new Error('이 브라우저는 알림을 지원하지 않아요. (아이폰은 홈 화면에 추가 후 가능)')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.')
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_id: userId,
      member_key: memberKey,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
  return true
}

/** 알림 끄기: 구독 해제 + DB 삭제 */
export async function disablePush() {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    const endpoint = sub.endpoint
    await sub.unsubscribe().catch(() => {})
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }
}

/** 테스트 알림 — 나에게 즉시 발송 */
export async function sendTestPush() {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { test: true, title: 'FamTalk 🔔', body: '알림이 잘 와요! 오늘도 화이팅 💪' },
  })
  if (error) throw new Error('알림 발송 실패 — send-push 함수 배포/VAPID 설정을 확인해 주세요.')
  return data
}
