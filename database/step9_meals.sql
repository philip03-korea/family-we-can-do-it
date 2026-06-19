-- ============================================================
-- FamTalk — 식단표 (월/주/일) + 추천·희망 음식 + 공감(투표)
-- Supabase SQL Editor 에서 실행. 재실행 안전.
-- ============================================================

-- 1) 날짜별 식단 (아침/저녁)
create table if not exists public.meal_plan (
  day        date primary key,
  breakfast  text,
  lunch      text,
  dinner     text,
  note       text,
  updated_at timestamptz not null default now()
);
alter table public.meal_plan enable row level security;
drop policy if exists "meal_plan select authed" on public.meal_plan;
drop policy if exists "meal_plan write authed" on public.meal_plan;
create policy "meal_plan select authed" on public.meal_plan
  for select using (auth.role() = 'authenticated');
create policy "meal_plan write authed" on public.meal_plan
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2) 추천·희망 음식 (누구나 제안)
create table if not exists public.meal_wishes (
  id          bigint generated always as identity primary key,
  member_key  text not null,
  title       text not null,
  note        text,
  month       text,                         -- 'YYYY-MM' (선택: 어느 달 희망인지)
  created_at  timestamptz not null default now()
);
create index if not exists meal_wishes_time_idx on public.meal_wishes(created_at);
alter table public.meal_wishes enable row level security;
drop policy if exists "meal_wishes select authed" on public.meal_wishes;
drop policy if exists "meal_wishes write authed" on public.meal_wishes;
create policy "meal_wishes select authed" on public.meal_wishes
  for select using (auth.role() = 'authenticated');
create policy "meal_wishes write authed" on public.meal_wishes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3) 공감(추천 투표) — 한 사람당 한 표
create table if not exists public.meal_wish_votes (
  wish_id    bigint not null references public.meal_wishes(id) on delete cascade,
  member_key text not null,
  created_at timestamptz not null default now(),
  primary key (wish_id, member_key)
);
alter table public.meal_wish_votes enable row level security;
drop policy if exists "meal_votes select authed" on public.meal_wish_votes;
drop policy if exists "meal_votes write authed" on public.meal_wish_votes;
create policy "meal_votes select authed" on public.meal_wish_votes
  for select using (auth.role() = 'authenticated');
create policy "meal_votes write authed" on public.meal_wish_votes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
