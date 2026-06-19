// ============================================================
// FamTalk — 웹푸시 발송 (web-push, VAPID). 무료.
// 호출 경로:
//  1) 사용자 테스트: 앱에서 invoke (JWT 포함) → 본인에게만 발송
//  2) 매일 아침 알람: cron 이 x-cron-secret 헤더로 호출 → 전체 발송
// 배포: supabase functions deploy send-push --no-verify-jwt
// 필요한 시크릿: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, CRON_SECRET
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:family@famtalk.app'
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: 'PUSH_NOT_CONFIGURED' }, 503)
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const body = await req.json().catch(() => ({}))
  const isCron = req.headers.get('x-cron-secret') && req.headers.get('x-cron-secret') === CRON_SECRET

  // 발송 대상 구독 선택
  let targetUserId: string | null = null
  if (!isCron) {
    // 사용자 경로 — JWT 검증
    const authHeader = req.headers.get('Authorization') ?? ''
    const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: u } = await asUser.auth.getUser()
    if (!u?.user) return json({ error: 'UNAUTHORIZED' }, 401)
    if (body.test) targetUserId = u.user.id // 테스트는 본인에게만
  }

  // 메시지 구성 (cron 일일 알람 기본 문구)
  const payload = {
    title: body.title || (isCron ? '🌅 좋은 아침이에요!' : 'FamTalk'),
    body: body.body || (isCron ? '오늘의 단어 학습과 집안일 잊지 마세요 💪 (family) WE CAN DO IT!' : ''),
    url: body.url || '/',
  }

  let q = admin.from('push_subscriptions').select('*')
  if (targetUserId) q = q.eq('user_id', targetUserId)
  if (body.target_member) q = q.eq('member_key', body.target_member)
  const { data: subs, error } = await q
  if (error) return json({ error: 'DB_ERROR', detail: error.message }, 500)

  let sent = 0
  let removed = 0
  await Promise.all(
    (subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        )
        sent++
      } catch (e: any) {
        const code = e?.statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          removed++
        }
      }
    }),
  )
  return json({ ok: true, sent, removed, total: (subs || []).length })
})
