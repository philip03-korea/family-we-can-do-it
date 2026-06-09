-- ============================================================
-- FamTalk 통합 셋업 SQL (자동 생성) — SQL Editor에 전체 붙여넣고 Run
-- 정책은 멱등 처리(drop if exists) 되어 재실행해도 안전합니다.
-- ============================================================


-- ========== schema.sql ==========
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
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "own profile upsert" on public.profiles;
create policy "own profile upsert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
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
drop policy if exists "words readable by all authed" on public.words;
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
drop policy if exists "audio cache readable by all authed" on public.audio_cache;
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
drop policy if exists "own progress all" on public.word_progress;
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
drop policy if exists "own attempts all" on public.speech_attempts;
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


-- ========== step3.sql ==========
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


-- ========== step4.sql ==========
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
drop policy if exists "ai_cache select authed" on public.ai_cache;
create policy "ai_cache select authed" on public.ai_cache
  for select using (auth.role() = 'authenticated');
drop policy if exists "ai_cache insert authed" on public.ai_cache;
create policy "ai_cache insert authed" on public.ai_cache
  for insert with check (auth.role() = 'authenticated');
drop policy if exists "ai_cache update authed" on public.ai_cache;
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


-- ========== step5.sql ==========
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
drop policy if exists "family msgs select authed" on public.family_messages;
create policy "family msgs select authed" on public.family_messages
  for select using (auth.role() = 'authenticated');
drop policy if exists "family msgs insert own" on public.family_messages;
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
drop policy if exists "profiles readable by authed" on public.profiles;
create policy "profiles readable by authed" on public.profiles
  for select using (auth.role() = 'authenticated');
-- (insert/update own 정책은 schema.sql 그대로 유지)

drop policy if exists "activity readable by authed" on public.daily_activity;
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


-- ========== step6.sql ==========
-- ============================================================
-- FamTalk — STEP 6: 하울 TOEFL 트랙 (영역별 훈련 + AI 채점 기록)
-- Supabase SQL Editor 에서 실행.
-- ============================================================

-- 1) TOEFL 연습 문제
create table if not exists public.toefl_prompts (
  id         bigint generated always as identity primary key,
  section    text not null check (section in ('speaking','writing','reading')),
  title      text not null,
  prompt     text not null,           -- 지시문/질문
  passage    text,                    -- reading 지문
  questions  jsonb default '[]'::jsonb,-- reading: [{q, options[], answer}]
  created_at timestamptz not null default now()
);
alter table public.toefl_prompts enable row level security;
drop policy if exists "toefl prompts readable" on public.toefl_prompts;
drop policy if exists "toefl prompts readable" on public.toefl_prompts;
create policy "toefl prompts readable" on public.toefl_prompts
  for select using (auth.role() = 'authenticated');

-- 2) 시도/채점 기록
create table if not exists public.toefl_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  section     text not null,
  prompt_id   bigint references public.toefl_prompts(id) on delete set null,
  prompt_text text,
  response    text,
  score       int,
  max_score   int default 30,
  feedback    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists toefl_attempts_user_idx on public.toefl_attempts(user_id, created_at);
alter table public.toefl_attempts enable row level security;
drop policy if exists "own toefl attempts" on public.toefl_attempts;
drop policy if exists "own toefl attempts" on public.toefl_attempts;
create policy "own toefl attempts" on public.toefl_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) 시드 문제
insert into public.toefl_prompts (section, title, prompt, passage, questions) values
('speaking', 'Independent Speaking 1',
 'Some students prefer to study alone. Others prefer to study with a group. Which do you prefer and why? Speak for 45 seconds.',
 null, '[]'::jsonb),
('speaking', 'Independent Speaking 2',
 'Describe a teacher who influenced you. Explain why this teacher was important to you.',
 null, '[]'::jsonb),
('writing', 'Independent Writing 1',
 'Do you agree or disagree with the following statement? "Technology has made people less creative." Use specific reasons and examples (write 250-300 words).',
 null, '[]'::jsonb),
('writing', 'Independent Writing 2',
 'Some people think university students should take courses outside their major. Others disagree. State your opinion with reasons.',
 null, '[]'::jsonb),
('reading', 'Reading: The Water Cycle',
 'Read the passage and answer the questions.',
 'The water cycle describes how water moves through the environment. Energy from the sun causes water on the surface of oceans, lakes, and rivers to evaporate into the air as vapor. As this vapor rises, it cools and condenses into tiny droplets, forming clouds. When the droplets become heavy enough, they fall back to the ground as precipitation, such as rain or snow. Some of this water flows over the land into rivers, while some soaks into the soil and becomes groundwater. Eventually, much of it returns to the oceans, and the cycle begins again.',
 '[
   {"q":"What causes water to evaporate?","options":["Wind","Energy from the sun","Cold air","Groundwater"],"answer":1},
   {"q":"What forms when water vapor cools and condenses?","options":["Rivers","Groundwater","Clouds","Oceans"],"answer":2},
   {"q":"According to the passage, where does some rainwater go after reaching the ground?","options":["It disappears","It soaks into the soil as groundwater","It turns into vapor immediately","It freezes permanently"],"answer":1}
 ]'::jsonb)
on conflict do nothing;


-- ========== seed_words.sql ==========
-- ============================================================
-- FamTalk — 단어 시드 (무료 엄선 셋, 비용 0원)
-- Supabase SQL Editor 에서 실행. 여러 번 실행해도 중복 안 됨.
-- 나중에 AI 생성/공개 단어셋(NGSL 등)으로 확장 가능.
-- ============================================================

-- (level, term) 중복 방지 제약 — 없으면 추가
do $$
begin
  alter table public.words add constraint words_level_term_uniq unique (level, term);
exception when duplicate_table or duplicate_object then null;
end $$;

insert into public.words (level, term, meaning_ko, example_en, example_ko, pos) values
-- ===== A (Pre-A1 · 입문) =====
('A','hello','안녕하세요','Hello, nice to meet you.','안녕하세요, 만나서 반가워요.','interj'),
('A','water','물','I drink water every day.','나는 매일 물을 마신다.','noun'),
('A','book','책','This book is fun.','이 책은 재미있다.','noun'),
('A','friend','친구','He is my friend.','그는 내 친구이다.','noun'),
('A','eat','먹다','I eat breakfast at seven.','나는 7시에 아침을 먹는다.','verb'),
('A','school','학교','We go to school by bus.','우리는 버스로 학교에 간다.','noun'),
('A','big','큰','That is a big dog.','저것은 큰 개다.','adj'),
('A','today','오늘','Today is Monday.','오늘은 월요일이다.','noun'),

-- ===== B (A1 · 기초) — 하람 =====
('B','apple','사과','I eat an apple every morning.','나는 매일 아침 사과를 먹는다.','noun'),
('B','happy','행복한','She looks very happy today.','그녀는 오늘 아주 행복해 보인다.','adj'),
('B','family','가족','I love my family.','나는 우리 가족을 사랑한다.','noun'),
('B','study','공부하다','We study English together.','우리는 함께 영어를 공부한다.','verb'),
('B','animal','동물','The zoo has many animals.','동물원에는 많은 동물이 있다.','noun'),
('B','play','놀다, (운동을)하다','The kids play in the park.','아이들이 공원에서 논다.','verb'),
('B','color','색깔','My favorite color is blue.','내가 좋아하는 색은 파란색이다.','noun'),
('B','morning','아침','I run every morning.','나는 매일 아침 달린다.','noun'),
('B','help','돕다','Can you help me?','나를 도와줄 수 있어?','verb'),
('B','small','작은','It is a small house.','그것은 작은 집이다.','adj'),

-- ===== C (A2 · 생활) — 엄마·아빠 =====
('C','travel','여행하다','We want to travel to Japan.','우리는 일본으로 여행 가고 싶다.','verb'),
('C','restaurant','식당','Let''s eat at a Korean restaurant.','한식당에서 먹자.','noun'),
('C','reserve','예약하다','I want to reserve a table for two.','2인 테이블을 예약하고 싶어요.','verb'),
('C','weather','날씨','The weather is nice today.','오늘 날씨가 좋다.','noun'),
('C','expensive','비싼','This hotel is too expensive.','이 호텔은 너무 비싸다.','adj'),
('C','direction','방향, 길','Can you give me directions?','길 좀 알려주실래요?','noun'),
('C','meeting','회의','I have a meeting at three.','나는 3시에 회의가 있다.','noun'),
('C','schedule','일정','What is your schedule tomorrow?','내일 일정이 어떻게 돼?','noun'),
('C','recommend','추천하다','Can you recommend a good dish?','맛있는 요리 하나 추천해 줄래?','verb'),
('C','luggage','짐, 수하물','Where can I leave my luggage?','짐을 어디에 맡길 수 있나요?','noun'),

-- ===== D (B1 · 소통) — 하음 =====
('D','opinion','의견','What is your opinion about this?','이것에 대한 네 의견은 뭐야?','noun'),
('D','agree','동의하다','I totally agree with you.','네 말에 전적으로 동의해.','verb'),
('D','experience','경험','It was an amazing experience.','그것은 놀라운 경험이었다.','noun'),
('D','decision','결정','It was a hard decision.','그것은 어려운 결정이었다.','noun'),
('D','suggest','제안하다','I suggest we leave early.','일찍 출발할 것을 제안해.','verb'),
('D','realize','깨닫다','I didn''t realize it was so late.','이렇게 늦은 줄 몰랐어.','verb'),
('D','prefer','선호하다','I prefer tea to coffee.','나는 커피보다 차를 더 좋아해.','verb'),
('D','reason','이유','There is a good reason for it.','그것에는 타당한 이유가 있다.','noun'),
('D','improve','향상시키다','I want to improve my English.','나는 영어 실력을 키우고 싶어.','verb'),
('D','although','비록 ~지만','Although it rained, we went out.','비가 왔지만 우리는 나갔다.','conj'),

-- ===== E (B2 · 심화) — 하울 (TOEFL 병행) =====
('E','significant','중요한, 상당한','The results show a significant change.','결과는 상당한 변화를 보여준다.','adj'),
('E','approach','접근법, 다가가다','We need a new approach to the problem.','그 문제에 대한 새로운 접근이 필요하다.','noun'),
('E','consequence','결과','Every choice has consequences.','모든 선택에는 결과가 따른다.','noun'),
('E','evidence','증거','There is strong evidence for the theory.','그 이론을 뒷받침하는 강력한 증거가 있다.','noun'),
('E','demonstrate','입증하다, 보여주다','The study demonstrates a clear trend.','그 연구는 명확한 경향을 보여준다.','verb'),
('E','perspective','관점','Try to see it from her perspective.','그녀의 관점에서 보려고 해봐.','noun'),
('E','contribute','기여하다','Exercise contributes to good health.','운동은 건강에 기여한다.','verb'),
('E','adequate','충분한, 적절한','The funding was not adequate.','자금이 충분하지 않았다.','adj'),
('E','furthermore','게다가','Furthermore, the data supports this.','게다가, 그 데이터가 이를 뒷받침한다.','adv'),
('E','tendency','경향','He has a tendency to be late.','그는 늦는 경향이 있다.','noun'),

-- ===== F (C1 · 유창) =====
('F','nevertheless','그럼에도 불구하고','It was risky; nevertheless, we tried.','위험했지만 그럼에도 우리는 시도했다.','adv'),
('F','comprehensive','종합적인, 포괄적인','We need a comprehensive plan.','우리는 포괄적인 계획이 필요하다.','adj'),
('F','inevitable','피할 수 없는','Change is inevitable.','변화는 피할 수 없다.','adj'),
('F','articulate','명확히 표현하다','She can articulate complex ideas clearly.','그녀는 복잡한 생각을 명확히 표현할 수 있다.','verb'),
('F','profound','심오한','The book had a profound impact on me.','그 책은 내게 깊은 영향을 주었다.','adj'),
('F','undermine','약화시키다','Doubt can undermine confidence.','의심은 자신감을 약화시킬 수 있다.','verb'),
('F','prevalent','널리 퍼진','This view is prevalent among experts.','이 견해는 전문가들 사이에 널리 퍼져 있다.','adj'),
('F','scrutiny','면밀한 조사','The plan came under close scrutiny.','그 계획은 면밀한 조사를 받았다.','noun')
on conflict (level, term) do nothing;


-- ========== seed_words_pack2.sql ==========
-- ============================================================
-- FamTalk — 단어 시드 팩2 (레벨별 대폭 보강, 무료 엄선 = 비용 0원)
-- 기존 seed_words.sql 와 중복되지 않는 새 단어들.
-- Supabase SQL Editor 에서 실행. 여러 번 실행해도 중복 안 됨.
-- ============================================================

-- (level, term) 중복 방지 제약 — 없으면 추가 (seed_words.sql 미실행 대비)
do $$
begin
  alter table public.words add constraint words_level_term_uniq unique (level, term);
exception when duplicate_table or duplicate_object then null;
end $$;

insert into public.words (level, term, meaning_ko, example_en, example_ko, pos) values
-- ===== A (Pre-A1 · 입문) =====
('A','cat','고양이','The cat is sleeping.','고양이가 자고 있다.','noun'),
('A','dog','개','My dog likes to run.','내 개는 달리기를 좋아한다.','noun'),
('A','milk','우유','I drink milk in the morning.','나는 아침에 우유를 마신다.','noun'),
('A','bread','빵','She eats bread for breakfast.','그녀는 아침으로 빵을 먹는다.','noun'),
('A','run','달리다','We run in the park.','우리는 공원에서 달린다.','verb'),
('A','walk','걷다','I walk to school.','나는 학교에 걸어간다.','verb'),
('A','red','빨간','The apple is red.','그 사과는 빨갛다.','adj'),
('A','blue','파란','The sky is blue.','하늘이 파랗다.','adj'),
('A','house','집','This is my house.','이것은 우리 집이다.','noun'),
('A','mother','엄마','My mother is kind.','우리 엄마는 친절하다.','noun'),
('A','father','아빠','My father reads a lot.','우리 아빠는 책을 많이 읽는다.','noun'),
('A','name','이름','What is your name?','네 이름이 뭐야?','noun'),
('A','night','밤','I sleep at night.','나는 밤에 잔다.','noun'),
('A','open','열다','Please open the door.','문을 열어 주세요.','verb'),

-- ===== B (A1 · 기초) — 하람 =====
('B','time','시간','What time is it?','지금 몇 시야?','noun'),
('B','people','사람들','Many people are here.','많은 사람들이 여기 있다.','noun'),
('B','year','년, 해','We meet every year.','우리는 매년 만난다.','noun'),
('B','week','주, 일주일','I study five days a week.','나는 일주일에 닷새 공부한다.','noun'),
('B','music','음악','She loves pop music.','그녀는 팝 음악을 좋아한다.','noun'),
('B','money','돈','I save my money.','나는 돈을 모은다.','noun'),
('B','country','나라','Korea is a beautiful country.','한국은 아름다운 나라이다.','noun'),
('B','language','언어','English is a useful language.','영어는 유용한 언어이다.','noun'),
('B','weekend','주말','We relax on the weekend.','우리는 주말에 쉰다.','noun'),
('B','breakfast','아침 식사','Breakfast is ready.','아침 식사가 준비됐다.','noun'),
('B','teacher','선생님','My teacher is funny.','우리 선생님은 재미있다.','noun'),
('B','student','학생','She is a good student.','그녀는 좋은 학생이다.','noun'),
('B','question','질문','I have a question.','질문이 있어요.','noun'),
('B','answer','대답, 답하다','Please answer my question.','내 질문에 답해 줘.','verb'),
('B','easy','쉬운','This game is easy.','이 게임은 쉽다.','adj'),
('B','difficult','어려운','The test was difficult.','시험이 어려웠다.','adj'),
('B','remember','기억하다','I remember your name.','나는 네 이름을 기억한다.','verb'),
('B','forget','잊다','Do not forget your bag.','가방을 잊지 마.','verb'),
('B','buy','사다','I want to buy a book.','나는 책을 한 권 사고 싶다.','verb'),
('B','clean','청소하다, 깨끗한','We clean our room every day.','우리는 매일 방을 청소한다.','verb'),

-- ===== C (A2 · 생활) — 엄마·아빠 =====
('C','airport','공항','We arrived at the airport early.','우리는 공항에 일찍 도착했다.','noun'),
('C','ticket','표, 티켓','I bought two movie tickets.','나는 영화표 두 장을 샀다.','noun'),
('C','passport','여권','Do not forget your passport.','여권을 잊지 마세요.','noun'),
('C','hotel','호텔','The hotel is near the station.','그 호텔은 역 근처에 있다.','noun'),
('C','customer','손님, 고객','The customer asked for help.','그 손님이 도움을 요청했다.','noun'),
('C','order','주문하다','I would like to order a coffee.','커피 한 잔 주문할게요.','verb'),
('C','price','가격','The price is too high.','가격이 너무 비싸다.','noun'),
('C','discount','할인','Is there a discount today?','오늘 할인이 있나요?','noun'),
('C','refund','환불','Can I get a refund?','환불받을 수 있을까요?','noun'),
('C','appointment','약속, 예약','I have a doctor appointment.','나는 병원 예약이 있다.','noun'),
('C','available','이용 가능한','Is this seat available?','이 자리 비어 있나요?','adj'),
('C','cancel','취소하다','I need to cancel my booking.','예약을 취소해야 해요.','verb'),
('C','deliver','배달하다','They deliver food at night.','그들은 밤에 음식을 배달한다.','verb'),
('C','neighbor','이웃','My neighbor is very friendly.','우리 이웃은 아주 친절하다.','noun'),
('C','comfortable','편안한','This chair is comfortable.','이 의자는 편안하다.','adj'),
('C','however','그러나','It was late; however, we kept going.','늦었지만 우리는 계속 갔다.','adv'),
('C','instead','대신에','Let us walk instead.','대신 걷자.','adv'),
('C','probably','아마도','It will probably rain today.','오늘은 아마 비가 올 것이다.','adv'),
('C','borrow','빌리다','Can I borrow your pen?','펜 좀 빌릴 수 있을까?','verb'),
('C','arrive','도착하다','We arrive at six.','우리는 6시에 도착한다.','verb'),

-- ===== D (B1 · 소통) — 하음 =====
('D','situation','상황','The situation is getting better.','상황이 점점 나아지고 있다.','noun'),
('D','develop','발전시키다','I want to develop my skills.','나는 내 능력을 키우고 싶다.','verb'),
('D','manage','관리하다, 해내다','She manages a small team.','그녀는 작은 팀을 관리한다.','verb'),
('D','achieve','성취하다','He achieved his goal.','그는 목표를 이루었다.','verb'),
('D','consider','고려하다','Please consider my idea.','내 생각을 고려해 줘.','verb'),
('D','describe','묘사하다','Can you describe the place?','그 장소를 설명해 줄래?','verb'),
('D','explain','설명하다','Let me explain the plan.','계획을 설명할게.','verb'),
('D','compare','비교하다','Let us compare the two options.','두 선택지를 비교해 보자.','verb'),
('D','advantage','장점','One advantage is the low price.','한 가지 장점은 낮은 가격이다.','noun'),
('D','disadvantage','단점','The main disadvantage is time.','가장 큰 단점은 시간이다.','noun'),
('D','environment','환경','We must protect the environment.','우리는 환경을 보호해야 한다.','noun'),
('D','society','사회','Technology changes society.','기술은 사회를 바꾼다.','noun'),
('D','culture','문화','I am interested in Korean culture.','나는 한국 문화에 관심이 있다.','noun'),
('D','encourage','격려하다','My parents encourage me.','우리 부모님은 나를 격려해 주신다.','verb'),
('D','mention','언급하다','She mentioned a good book.','그녀가 좋은 책을 언급했다.','verb'),
('D','attitude','태도','He has a positive attitude.','그는 긍정적인 태도를 가지고 있다.','noun'),
('D','recognize','알아보다, 인정하다','I did not recognize him.','나는 그를 알아보지 못했다.','verb'),
('D','opportunity','기회','This is a great opportunity.','이것은 좋은 기회이다.','noun'),
('D','responsible','책임이 있는','You are responsible for this task.','너는 이 일에 책임이 있다.','adj'),
('D','express','표현하다','Try to express your feelings.','네 감정을 표현해 봐.','verb'),

-- ===== E (B2 · 심화) — 하울 (TOEFL 병행) =====
('E','analyze','분석하다','We need to analyze the data.','우리는 그 데이터를 분석해야 한다.','verb'),
('E','assume','가정하다','Do not assume the worst.','최악을 가정하지 마라.','verb'),
('E','conduct','수행하다','They conducted an experiment.','그들은 실험을 수행했다.','verb'),
('E','emphasize','강조하다','The teacher emphasized practice.','선생님은 연습을 강조했다.','verb'),
('E','illustrate','예시로 보여주다','This graph illustrates the trend.','이 그래프는 그 경향을 보여준다.','verb'),
('E','indicate','나타내다','The results indicate progress.','그 결과는 진전을 나타낸다.','verb'),
('E','interpret','해석하다','How do you interpret this poem?','이 시를 어떻게 해석하니?','verb'),
('E','phenomenon','현상','This is a common phenomenon.','이것은 흔한 현상이다.','noun'),
('E','principle','원칙, 원리','He acts on strong principles.','그는 확고한 원칙대로 행동한다.','noun'),
('E','framework','틀, 체계','We built a clear framework.','우리는 명확한 틀을 만들었다.','noun'),
('E','substantial','상당한','There was a substantial increase.','상당한 증가가 있었다.','adj'),
('E','subsequent','뒤이은','The subsequent chapter is harder.','다음 장은 더 어렵다.','adj'),
('E','constitute','구성하다','These parts constitute the whole.','이 부분들이 전체를 구성한다.','verb'),
('E','implication','함의, 영향','Consider the implications carefully.','그 함의를 신중히 고려하라.','noun'),
('E','correlate','상관관계가 있다','Sleep correlates with health.','수면은 건강과 상관관계가 있다.','verb'),
('E','empirical','경험적인','We rely on empirical evidence.','우리는 경험적 증거에 의존한다.','adj'),
('E','hypothesis','가설','The hypothesis was confirmed.','그 가설은 확인되었다.','noun'),
('E','derive','이끌어내다','We derive meaning from context.','우리는 맥락에서 의미를 끌어낸다.','verb'),
('E','distinct','뚜렷한, 별개의','These are two distinct issues.','이것은 별개의 두 문제이다.','adj'),
('E','reluctant','꺼리는','He was reluctant to agree.','그는 동의하기를 꺼렸다.','adj'),

-- ===== F (C1 · 유창) =====
('F','notwithstanding','~에도 불구하고','Notwithstanding the risks, they proceeded.','위험에도 불구하고 그들은 진행했다.','prep'),
('F','ubiquitous','어디에나 있는','Smartphones are now ubiquitous.','스마트폰은 이제 어디에나 있다.','adj'),
('F','meticulous','꼼꼼한','She is meticulous about details.','그녀는 세부 사항에 꼼꼼하다.','adj'),
('F','ambiguous','모호한','The instructions were ambiguous.','그 지시는 모호했다.','adj'),
('F','cogent','설득력 있는','He made a cogent argument.','그는 설득력 있는 주장을 펼쳤다.','adj'),
('F','salient','두드러진','Let us focus on the salient points.','두드러진 요점에 집중하자.','adj'),
('F','mitigate','완화하다','We must mitigate the damage.','우리는 피해를 완화해야 한다.','verb'),
('F','exacerbate','악화시키다','Stress can exacerbate the problem.','스트레스가 문제를 악화시킬 수 있다.','verb'),
('F','pragmatic','실용적인','She took a pragmatic approach.','그녀는 실용적인 접근을 택했다.','adj'),
('F','nuance','미묘한 차이','He understands every nuance.','그는 모든 미묘한 차이를 이해한다.','noun'),
('F','discern','분별하다','It is hard to discern the truth.','진실을 분별하기는 어렵다.','verb'),
('F','infer','추론하다','We can infer the cause.','우리는 그 원인을 추론할 수 있다.','verb'),
('F','tenuous','희박한, 미약한','The link is rather tenuous.','그 연관성은 다소 미약하다.','adj'),
('F','coherent','일관성 있는','She gave a coherent explanation.','그녀는 일관성 있는 설명을 했다.','adj')
on conflict (level, term) do nothing;


-- ========== seed_topics_pack2.sql ==========
-- ============================================================
-- FamTalk — 주간 공통 토론 주제 팩2 (무료, 정적 콘텐츠)
-- Supabase SQL Editor 에서 실행. week_start 중복 시 무시.
-- ============================================================

insert into public.weekly_topics (week_start, title, prompt_en, prompt_ko, questions) values
('2026-06-22', 'My Best Friend', 'Talk about a friend who is special to you.',
 '나에게 특별한 친구에 대해 이야기해요.',
 '["Who is your best friend?","How did you meet?","What do you like to do together?"]'::jsonb),

('2026-06-29', 'A Movie I Love', 'Share a movie you really enjoyed and why.',
 '정말 좋았던 영화와 그 이유를 나눠요.',
 '["What is the movie about?","Who is your favorite character?","Would you recommend it? Why?"]'::jsonb),

('2026-07-06', 'My Dream Job', 'Describe a job you would love to have in the future.',
 '미래에 갖고 싶은 직업을 묘사해요.',
 '["What job do you want?","Why does it interest you?","What skills do you need for it?"]'::jsonb),

('2026-07-13', 'A Special Memory', 'Tell a story about a happy memory with your family.',
 '가족과의 행복한 추억을 이야기해요.',
 '["When did it happen?","Who was there?","Why is it special to you?"]'::jsonb),

('2026-07-20', 'Healthy Habits', 'Talk about how you stay healthy.',
 '건강을 지키는 방법에 대해 이야기해요.',
 '["What healthy habits do you have?","What would you like to improve?","How do you feel after exercise?"]'::jsonb),

('2026-07-27', 'My Favorite Season', 'Describe the season you like most and why.',
 '가장 좋아하는 계절과 이유를 묘사해요.',
 '["Which season do you like best?","What do you do in that season?","What is the weather like?"]'::jsonb),

('2026-08-03', 'Technology in Our Lives', 'Discuss how technology helps or hurts us.',
 '기술이 우리 삶을 어떻게 돕거나 해치는지 토론해요.',
 '["What technology do you use every day?","How does it help you?","Is there a downside?"]'::jsonb),

('2026-08-10', 'A Place I Visited', 'Talk about a trip or a place you have been to.',
 '가봤던 여행지나 장소에 대해 이야기해요.',
 '["Where did you go?","What did you see or do?","Would you go again?"]'::jsonb),

('2026-08-17', 'Books and Reading', 'Share a book you read or want to read.',
 '읽은 책이나 읽고 싶은 책을 나눠요.',
 '["What kind of books do you like?","What are you reading now?","Why do you read?"]'::jsonb),

('2026-08-24', 'Goals for This Year', 'Talk about something you want to achieve this year.',
 '올해 이루고 싶은 목표를 이야기해요.',
 '["What is your goal?","Why is it important to you?","What is your first step?"]'::jsonb)
on conflict (week_start) do nothing;

