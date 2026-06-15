-- ============================================================
-- FamTalk — 집안일(가족 분업) 기능
-- Supabase SQL Editor 에서 실행. 정책 멱등 처리(재실행 안전).
-- ============================================================

-- 1) 집안일 항목 (한 줄 = 특정 날짜에 특정 사람이 할 일 1개)
create table if not exists public.chores (
  id           bigint generated always as identity primary key,
  week_start   date not null,                 -- 그 주 월요일
  due_date     date not null,                 -- 실제 수행 날짜
  title        text not null,
  category     text,
  points       int  not null default 10,
  assignee_key text,                          -- mom/dad/haeum/haul/haram
  done         boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists chores_week_idx on public.chores(week_start);
create index if not exists chores_due_idx on public.chores(due_date);

alter table public.chores enable row level security;
-- 비공개 가족 앱: 로그인한 가족은 모두 보고 관리 가능
drop policy if exists "chores select authed" on public.chores;
drop policy if exists "chores write authed" on public.chores;
create policy "chores select authed" on public.chores
  for select using (auth.role() = 'authenticated');
create policy "chores write authed" on public.chores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2) 가족별 주간 목표 포인트
create table if not exists public.chore_goals (
  member_key  text primary key,
  weekly_goal int not null default 100
);
alter table public.chore_goals enable row level security;
drop policy if exists "chore_goals select authed" on public.chore_goals;
drop policy if exists "chore_goals write authed" on public.chore_goals;
create policy "chore_goals select authed" on public.chore_goals
  for select using (auth.role() = 'authenticated');
create policy "chore_goals write authed" on public.chore_goals
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 기본 목표 (하음=고3 입시로 완화)
insert into public.chore_goals (member_key, weekly_goal) values
  ('mom', 100), ('dad', 100), ('haeum', 50), ('haul', 90), ('haram', 80)
on conflict (member_key) do nothing;
