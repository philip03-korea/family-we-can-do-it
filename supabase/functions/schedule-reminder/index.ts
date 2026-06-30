// ============================================================
// FamTalk — 하람 계획표 시간대별 리마인더 (웹푸시). 무료.
// cron 이 30분마다 x-cron-secret 헤더로 호출 → 지금 시작하는 "할 일"이
// 아직 완료/미루기 안 됐으면 하람에게 푸시.
// 배포: supabase functions deploy schedule-reminder --no-verify-jwt
// 필요한 시크릿: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, CRON_SECRET (send-push 와 동일)
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:family@famtalk.app'
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

const MEMBER = 'haram'
const NON_TASK = new Set(['_', 'D', 'Z', 'P']) // 빈칸/미정/잠/잠준비 제외
const TYPE_LB: Record<string, string> = {
  S: '학교', A: '집도착', R: '쉬기', E: '영단', K: '국어', M: '수학',
  X: '운동', G: '게임', F: '밥+샤워', C: '교회',
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

// KST(UTC+9) 기준 현재 시각 정보
function kstNow() {
  const d = new Date(Date.now() + 9 * 3600 * 1000)
  const h = d.getUTCHours()
  const m = d.getUTCMinutes()
  // 30분 슬롯으로 내림 (예: 16:05 → 16:00, 16:40 → 16:30)
  const slotM = m < 30 ? 0 : 30
  const slot = `${h}:${slotM === 0 ? '00' : '30'}`
  const col = (d.getUTCDay() + 6) % 7 // 월=0 … 일=6
  const day = d.toISOString().slice(0, 10) // KST 날짜 (이미 +9 보정됨)
  return { slot, col, day }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.headers.get('x-cron-secret') !== CRON_SECRET || !CRON_SECRET) return json({ error: 'UNAUTHORIZED' }, 401)
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: 'PUSH_NOT_CONFIGURED' }, 503)
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { slot, col, day } = kstNow()

  // 계획표 불러오기
  const { data: sched } = await admin.from('family_schedule').select('doc').eq('id', MEMBER).maybeSingle()
  const rows: string[][] = sched?.doc?.data || []
  const cust: Record<string, { icon?: string; text?: string }> = sched?.doc?.cust || {}
  if (!rows.length) return json({ ok: true, skipped: 'no_schedule' })

  // 현재 슬롯에 해당하는 행 찾기
  const r = rows.findIndex((row) => row[0] === slot)
  if (r < 0) return json({ ok: true, skipped: 'no_slot', slot })

  const code = rows[r][col + 1]
  if (NON_TASK.has(code)) return json({ ok: true, skipped: 'non_task', slot, code })

  // 블록 시작 슬롯에서만 1회 알림 (같은 활동이 이어지면 첫 칸에서만)
  if (r > 0 && rows[r - 1][col + 1] === code) return json({ ok: true, skipped: 'mid_block', slot })

  // 이미 완료/미루기면 알림 안 함
  const { data: prog } = await admin
    .from('schedule_progress')
    .select('status')
    .eq('member_key', MEMBER)
    .eq('day', day)
    .eq('slot', slot)
    .maybeSingle()
  if (prog?.status) return json({ ok: true, skipped: 'already_' + prog.status, slot })

  // 표시 라벨/아이콘 (CUST 우선)
  const cu = cust[`${r}-${col}`]
  const label = (cu?.text !== undefined ? cu.text : TYPE_LB[code]) || '일정'
  const icon = cu?.icon !== undefined ? cu.icon : ''

  const payload = {
    title: `⏰ ${slot} ${icon} ${label}`.trim(),
    body: `${label} 할 시간이에요! 끝나면 앱에서 완료 체크 ✅`,
    url: '/schedule',
    tag: `sched-${slot}`,
  }

  // 하람 구독에만 발송
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('member_key', MEMBER)
  let sent = 0
  let removed = 0
  await Promise.all(
    (subs || []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload))
        sent++
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          removed++
        }
      }
    }),
  )
  return json({ ok: true, slot, label, sent, removed })
})
