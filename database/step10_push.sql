-- ============================================================
-- FamTalk — 웹푸시 구독 저장 + (선택) 매일 아침 알람 cron
-- Supabase SQL Editor 에서 실행. 재실행 안전.
-- ============================================================

create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  p256dh     text not null,
  auth       text not null,
  user_id    uuid references auth.users(id) on delete cascade,
  member_key text,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push select authed" on public.push_subscriptions;
drop policy if exists "push write authed" on public.push_subscriptions;
create policy "push select authed" on public.push_subscriptions
  for select using (auth.role() = 'authenticated');
create policy "push write authed" on public.push_subscriptions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- (선택) 매일 아침 7시(KST) 푸시 알람 — Edge Function 시크릿 설정 후 실행
--   1) supabase secrets set VAPID_PUBLIC/VAPID_PRIVATE/VAPID_SUBJECT/CRON_SECRET
--   2) 아래 <CRON_SECRET> 을 위에서 정한 값으로 바꿔 실행
-- pg_cron 은 UTC 기준 → 07:00 KST = 22:00 UTC
-- ============================================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule('famtalk-morning', '0 22 * * *', $$
--   select net.http_post(
--     url := 'https://ghmroezwdwkvruygrqzv.supabase.co/functions/v1/send-push',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--     body := jsonb_build_object('daily', true)
--   );
-- $$);
