-- ============================================================
-- FamTalk — STEP 5: 가족 소통 (주간 토론 주제 + 실시간 가족 채팅 + 가족 현황)
-- Supabase SQL Editor 에서 실행.
-- 비공개 가족 앱이므로, 로그인한 가족끼리는 서로의 프로필/활동을 볼 수 있게 함.
-- ============================================================

-- 1) 주간 공통 토론 주제 (가족 전원 공유)
create table if not exists public.weekly_topics (
  id          bigint generated always as identity primary key,
  week_start  date not null unique,           -- 그 주 월요일
  title       text not null,
  prompt_en   text,
  prompt_ko   text,
  questions   jsonb default '[]'::jsonb,       -- 레벨별/공통 토론 질문
  created_at  timestamptz not null default now()
);
alter table public.weekly_topics enable row level security;
drop policy if exists "topics readable by authed" on public.weekly_topics;
create policy "topics readable by authed" on public.weekly_topics
  for select using (auth.role() = 'authenticated');

-- 2) 가족 채팅 메시지
create table if not exists public.family_messages (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  member_key   text,
  text         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists family_messages_time_idx on public.family_messages(created_at);
alter table public.family_messages enable row level security;
drop policy if exists "family msgs select authed" on public.family_messages;
drop policy if exists "family msgs insert own" on public.family_messages;
create policy "family msgs select authed" on public.family_messages
  for select using (auth.role() = 'authenticated');
create policy "family msgs insert own" on public.family_messages
  for insert with check (auth.uid() = user_id);

-- 실시간 구독 활성화
do $$
begin
  alter publication supabase_realtime add table public.family_messages;
exception when duplicate_object then null;
end $$;

-- 3) 가족 현황을 위해 프로필/활동을 가족끼리 읽기 허용
drop policy if exists "own profile select" on public.profiles;
drop policy if exists "profiles readable by authed" on public.profiles;
create policy "profiles readable by authed" on public.profiles
  for select using (auth.role() = 'authenticated');
-- (insert/update own 정책은 schema.sql 그대로 유지)

drop policy if exists "activity readable by authed" on public.daily_activity;
create policy "activity readable by authed" on public.daily_activity
  for select using (auth.role() = 'authenticated');

-- 4) 주간 주제 시드 (예시)
insert into public.weekly_topics (week_start, title, prompt_en, prompt_ko, questions) values
('2026-06-08', 'My Favorite Food', 'Talk about a food you love and why.',
 '좋아하는 음식과 그 이유를 영어로 이야기해요.',
 '["What is your favorite food?","When do you usually eat it?","Who do you eat it with?"]'::jsonb),
('2026-06-15', 'A Place I Want to Visit', 'Describe a place you dream of visiting.',
 '가보고 싶은 장소를 묘사해요.',
 '["Where do you want to go?","Why that place?","What would you do there?"]'::jsonb),
('2026-06-01', 'My Daily Routine', 'Share what a normal day looks like for you.',
 '나의 하루 일과를 공유해요.',
 '["What time do you wake up?","What do you do after school/work?","What is your favorite part of the day?"]'::jsonb)
on conflict (week_start) do nothing;
