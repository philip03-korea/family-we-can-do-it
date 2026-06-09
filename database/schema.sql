-- ============================================================
-- FamTalk — Supabase 스키마 (STEP 1~2)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- 모든 테이블에 RLS(행 수준 보안)를 적용해 가족 데이터를 보호합니다.
-- ============================================================

-- ---------- 1) 프로필 (가족 구성원) ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  member_key   text not null,                 -- mom/dad/haeum/haul/haram
  display_name text not null,
  level        text not null default 'B'      -- A~F
               check (level in ('A','B','C','D','E','F')),
  toefl_track  boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 읽기/쓰기 (가족 전체 조회는 STEP 5에서 정책 확장)
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile upsert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

-- ---------- 2) 레벨/단어 콘텐츠 (모두 공유, 읽기 전용) ----------
create table if not exists public.words (
  id          bigint generated always as identity primary key,
  level       text not null check (level in ('A','B','C','D','E','F')),
  term        text not null,                  -- 영어 단어/표현
  meaning_ko  text not null,                  -- 한국어 뜻
  example_en  text,                           -- 예문
  example_ko  text,
  pos         text,                           -- 품사
  created_at  timestamptz not null default now()
);
create index if not exists words_level_idx on public.words(level);

alter table public.words enable row level security;
create policy "words readable by all authed" on public.words
  for select using (auth.role() = 'authenticated');

-- ---------- 3) 음성 캐시 (★ 비용 핵심) ----------
-- "한 번 생성 → 저장 → 영구 재사용" — 같은 텍스트 재요청은 0원.
-- (브라우저 무료 TTS를 쓰는 동안엔 비어 있어도 되고,
--  나중에 클라우드 TTS를 붙이면 여기에 적재됨)
create table if not exists public.audio_cache (
  text_hash   text primary key,               -- sha256(text + voice + lang + speed)
  text        text not null,
  voice       text not null,
  lang        text not null default 'en-US',
  file_path   text not null,                  -- storage 경로
  char_count  int not null default 0,
  hit_count   int not null default 0,         -- 재사용 횟수(절감 추적)
  created_at  timestamptz not null default now()
);

alter table public.audio_cache enable row level security;
create policy "audio cache readable by all authed" on public.audio_cache
  for select using (auth.role() = 'authenticated');

-- ---------- 4) 단어 학습 진행도 (FSRS — STEP 2에서 사용) ----------
create table if not exists public.word_progress (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  word_id     bigint not null references public.words(id) on delete cascade,
  -- FSRS 상태
  stability   real not null default 0,
  difficulty  real not null default 0,
  due_at      timestamptz not null default now(),
  reps        int not null default 0,
  lapses      int not null default 0,
  last_review timestamptz,
  unique (user_id, word_id)
);
create index if not exists word_progress_due_idx on public.word_progress(user_id, due_at);

alter table public.word_progress enable row level security;
create policy "own progress all" on public.word_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 5) 발음 시도 기록 (무료 STT 점수 저장) ----------
create table if not exists public.speech_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  word_id     bigint references public.words(id) on delete set null,
  target_text text not null,
  transcript  text,
  score       int,                            -- 0~100 (무료 단어 일치율)
  created_at  timestamptz not null default now()
);
create index if not exists speech_attempts_user_idx on public.speech_attempts(user_id, created_at);

alter table public.speech_attempts enable row level security;
create policy "own attempts all" on public.speech_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 6) 샘플 단어 시드 (테스트용) ----------
insert into public.words (level, term, meaning_ko, example_en, example_ko, pos) values
  ('B', 'apple',  '사과',     'I eat an apple every morning.', '나는 매일 아침 사과를 먹는다.', 'noun'),
  ('B', 'happy',  '행복한',   'She looks very happy today.',   '그녀는 오늘 아주 행복해 보인다.', 'adj'),
  ('C', 'travel', '여행하다', 'We want to travel to Japan.',   '우리는 일본으로 여행 가고 싶다.', 'verb'),
  ('D', 'opinion','의견',     'What is your opinion about this?', '이것에 대한 네 의견은 뭐야?', 'noun'),
  ('E', 'although','비록 ~지만','Although it rained, we went out.', '비가 왔지만 우리는 나갔다.', 'conj')
on conflict do nothing;
