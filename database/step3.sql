-- ============================================================
-- FamTalk — STEP 3: 일일 학습 기록(연속 학습일/통계용)
-- Supabase SQL Editor 에서 실행.
-- ============================================================

create table if not exists public.daily_activity (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null default current_date,
  reviews  int  not null default 0,
  primary key (user_id, day)
);

alter table public.daily_activity enable row level security;

drop policy if exists "own activity all" on public.daily_activity;
create policy "own activity all" on public.daily_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 오늘 학습 수를 누적(없으면 생성)하는 함수
create or replace function public.add_activity(p_reviews int)
returns void
language sql
as $$
  insert into public.daily_activity (user_id, day, reviews)
  values (auth.uid(), current_date, p_reviews)
  on conflict (user_id, day)
  do update set reviews = public.daily_activity.reviews + excluded.reviews;
$$;
