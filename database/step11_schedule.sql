-- ============================================================
-- FamTalk — 하람 주간 계획표 (가족 공유)
-- Supabase SQL Editor 에서 실행. 재실행 안전.
-- 가족당 하나의 문서(JSONB)를 공유 → 모든 구성원이 같은 표를 본다.
-- ============================================================

create table if not exists public.family_schedule (
  id          text primary key,           -- 'haram' (계획표 식별자)
  doc         jsonb not null default '{}'::jsonb,  -- { data, cust, memo }
  updated_by  text,                        -- 마지막 수정자 member_key
  updated_at  timestamptz not null default now()
);

alter table public.family_schedule enable row level security;
drop policy if exists "family_schedule select authed" on public.family_schedule;
drop policy if exists "family_schedule write authed" on public.family_schedule;
create policy "family_schedule select authed" on public.family_schedule
  for select using (auth.role() = 'authenticated');
create policy "family_schedule write authed" on public.family_schedule
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 초기 행(빈 문서) — 앱이 기본 시간표를 채워 저장한다.
insert into public.family_schedule (id, doc)
values ('haram', '{}'::jsonb)
on conflict (id) do nothing;
