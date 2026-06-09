-- ============================================================
-- FamTalk — STEP 4: AI 회화용 캐시 + 일일 사용량(쿼터)
-- Supabase SQL Editor 에서 실행.
-- 비용 관리 핵심: 같은 질문은 캐시로 0원, 사용량은 쿼터로 상한.
-- ============================================================

-- 1) AI 응답 캐시 (텍스트 LLM 결과 재사용)
create table if not exists public.ai_cache (
  hash       text primary key,        -- sha256(level + message + 직전맥락)
  level      text,
  prompt     text,
  response   jsonb not null,
  hit_count  int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ai_cache enable row level security;
drop policy if exists "ai_cache select authed" on public.ai_cache;
drop policy if exists "ai_cache insert authed" on public.ai_cache;
drop policy if exists "ai_cache update authed" on public.ai_cache;
create policy "ai_cache select authed" on public.ai_cache
  for select using (auth.role() = 'authenticated');
create policy "ai_cache insert authed" on public.ai_cache
  for insert with check (auth.role() = 'authenticated');
create policy "ai_cache update authed" on public.ai_cache
  for update using (auth.role() = 'authenticated');

-- 2) 사용자별 일일 AI 사용량 (쿼터)
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "own ai_usage all" on public.ai_usage;
create policy "own ai_usage all" on public.ai_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 오늘 사용량 1 증가시키고 새 값 반환
create or replace function public.bump_ai_usage()
returns int
language plpgsql
as $$
declare c int;
begin
  insert into public.ai_usage (user_id, day, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day)
  do update set count = public.ai_usage.count + 1
  returning count into c;
  return c;
end $$;

-- 캐시 적중 횟수 +1 (비용 절감 추적)
create or replace function public.bump_ai_cache_hit(p_hash text)
returns void
language sql
as $$
  update public.ai_cache set hit_count = hit_count + 1 where hash = p_hash;
$$;
