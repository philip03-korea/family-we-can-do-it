-- ============================================================
-- FamTalk — 하람 오늘의 할 일 (완료/미루기) 진행상황
-- Supabase SQL Editor 에서 실행. 재실행 안전.
-- 날짜별로 각 시간대 항목의 상태를 저장 → 가족이 진행상황을 함께 본다.
-- ============================================================

create table if not exists public.schedule_progress (
  member_key text not null,                 -- 누구 계획표인지 ('haram')
  day        date not null,                 -- 실제 날짜
  slot       text not null,                 -- 항목 키 (시작 시각, 예: '16:00')
  status     text not null check (status in ('done', 'postponed')),
  updated_at timestamptz not null default now(),
  primary key (member_key, day, slot)
);

alter table public.schedule_progress enable row level security;
drop policy if exists "sched_progress select authed" on public.schedule_progress;
drop policy if exists "sched_progress write authed" on public.schedule_progress;
create policy "sched_progress select authed" on public.schedule_progress
  for select using (auth.role() = 'authenticated');
create policy "sched_progress write authed" on public.schedule_progress
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 하루 완료 보너스 포인트는 point_ledger.ref('schedule_day:haram:날짜')의
-- 기존 unique 제약으로 같은 날 중복 적립이 자동 차단된다 (step8 에서 생성됨).

-- ============================================================
-- (선택) 시간대별 푸시 리마인더 cron — 앱이 닫혀 있어도 알림
--   1) supabase functions deploy schedule-reminder --no-verify-jwt
--   2) 시크릿은 send-push 와 동일(VAPID_*, CRON_SECRET) — 이미 등록돼 있으면 추가 작업 없음
--   3) 아래 <CRON_SECRET> 을 실제 값으로 바꿔 실행
-- 30분마다 호출 → 함수가 "지금 KST 시각"에 시작하는 할 일을 보고, 미완료면 하람에게 푸시.
-- 매시 정각/30분(KST). pg_cron 은 UTC 기준이라 분만 맞추면 됨(0,30분은 KST에서도 0,30분).
-- ============================================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule('famtalk-schedule-reminder', '0,30 * * * *', $$
--   select net.http_post(
--     url := 'https://ghmroezwdwkvruygrqzv.supabase.co/functions/v1/schedule-reminder',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--     body := '{}'::jsonb
--   );
-- $$);
