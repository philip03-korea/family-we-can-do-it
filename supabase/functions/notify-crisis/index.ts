// ============================================================
// FamTalk — 위기 알림 푸시 (부모에게)
//
// 자녀가 검사에서 자해/죽음 문항에 응답하면(crisis=true) 부모(엄마·아빠) 폰으로 즉시 푸시.
// 이 동작은 검사 시작 전 자녀에게 **미리 고지된 범위**다(하23 '비밀보장의 한계').
//   "네 답은 너만 봐. 딱 하나 — 스스로를 해치고 싶다는 답을 하면 엄마·아빠한테 알려질 거야."
// ⚠️ 평상시 점수는 절대 보내지 않는다. crisis=true 인 건에 대해서만 발송한다.
//
// 악용 방지: 클라이언트가 보낸 내용을 그대로 믿지 않는다.
//   서버가 result_id 를 직접 조회해 (본인 것인지 / 진짜 crisis 인지 / 자녀인지) 검증 후 발송.
//
// 배포: supabase functions deploy notify-crisis
// 시크릿: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (send-push 와 공유)
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:family@famtalk.app'

const CHILD_KEYS = ['haeum', 'haul', 'haram']
const PARENT_KEYS = ['mom', 'dad']
const NAMES: Record<string, string> = { haeum: '하음', haul: '하울', haram: '하람' }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: 'PUSH_NOT_CONFIGURED' }, 503)

    // 1) 호출자 인증
    const authHeader = req.headers.get('Authorization') ?? ''
    const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: u } = await asUser.auth.getUser()
    if (!u?.user) return json({ error: 'UNAUTHORIZED' }, 401)

    const { result_id } = await req.json().catch(() => ({}))
    if (!result_id) return json({ error: 'MISSING_RESULT_ID' }, 400)

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)

    // 2) 호출자가 자녀인지 확인 (부모 본인 결과는 알림 대상 아님)
    const { data: prof } = await admin
      .from('profiles')
      .select('member_key')
      .eq('id', u.user.id)
      .maybeSingle()
    const childKey = prof?.member_key ?? ''
    if (!CHILD_KEYS.includes(childKey)) {
      // 부모 본인 검사 → 아무에게도 안 보냄 (정상 종료)
      return json({ ok: true, sent: 0, reason: 'NOT_A_CHILD' })
    }

    // 3) ★ 서버가 직접 검증 — 본인 것이고, 실제로 crisis 인 결과인지
    const { data: row } = await admin
      .from('counsel_results')
      .select('id, user_id, member_key, crisis, created_at')
      .eq('id', result_id)
      .maybeSingle()
    if (!row) return json({ error: 'RESULT_NOT_FOUND' }, 404)
    if (row.user_id !== u.user.id) return json({ error: 'FORBIDDEN' }, 403)
    if (!row.crisis) {
      // 위기가 아니면 절대 발송하지 않는다 (평상시 점수는 부모에게 안 감)
      return json({ ok: true, sent: 0, reason: 'NOT_CRISIS' })
    }

    // 4) 부모 구독 조회
    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('*')
      .in('member_key', PARENT_KEYS)
    if (error) return json({ error: 'DB_ERROR', detail: error.message }, 500)

    const name = NAMES[childKey] ?? '아이'
    const payload = {
      title: `🚨 ${name}이에게 지금 관심이 필요해요`,
      body: '마음 상담 검사에서 위기 신호가 있었어요. 오늘 안에 이야기해주세요.',
      url: '/counsel',
    }

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

    return json({ ok: true, sent, removed, parents: (subs || []).length })
  } catch (e) {
    return json({ error: 'SERVER_ERROR', detail: String(e) }, 500)
  }
})
