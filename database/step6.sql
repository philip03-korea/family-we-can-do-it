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
