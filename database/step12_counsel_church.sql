-- ============================================================
-- step12: 심리상담(하23) + 교회교육프로그램(하24)
--
-- counsel_results : 심리검사 결과 (PHQ-9/GAD-7/RSES/PSS-10)
--   · 기본 비공개. shared=true 로 본인이 명시적으로 공유해야 가족이 볼 수 있음.
--   · crisis=true(위기문항 양성) 결과는 절대 공유 불가 — DB 제약으로 강제.
-- church_plans    : 교회 교육 기획안 (아빠 전용, 본인만 접근)
-- 멱등(여러 번 실행해도 안전)
-- ============================================================

-- ── 심리검사 결과 ──────────────────────────────────────────
create table if not exists counsel_results (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  member_key  text not null,
  test_key    text not null,               -- phq9 | gad7 | rses | pss10
  score       int  not null,
  max_score   int  not null,
  level_key   text not null,               -- 해석 구간 키
  level_label text not null,               -- 해석 라벨(한글)
  answers     jsonb not null default '[]'::jsonb,
  crisis      boolean not null default false,  -- 위기문항 양성(PHQ-9 9번 등)
  shared      boolean not null default false,  -- 가족회의 공유 여부(본인 동의)
  note        text,                            -- 본인 메모(가족회의용)
  created_at  timestamptz not null default now(),
  -- ⚠️ 안전장치: 위기 결과는 공유 상태가 될 수 없다
  constraint counsel_crisis_never_shared check (not (crisis and shared))
);

create index if not exists counsel_results_user_idx   on counsel_results (user_id, created_at desc);
create index if not exists counsel_results_shared_idx on counsel_results (shared, created_at desc) where shared = true;

alter table counsel_results enable row level security;

-- 본인 결과는 모두 조회 / 가족은 공유된 것만 조회
drop policy if exists counsel_select_own on counsel_results;
create policy counsel_select_own on counsel_results
  for select using (auth.uid() = user_id);

drop policy if exists counsel_select_shared on counsel_results;
create policy counsel_select_shared on counsel_results
  for select using (shared = true and auth.uid() is not null);

drop policy if exists counsel_insert_own on counsel_results;
create policy counsel_insert_own on counsel_results
  for insert with check (auth.uid() = user_id);

drop policy if exists counsel_update_own on counsel_results;
create policy counsel_update_own on counsel_results
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists counsel_delete_own on counsel_results;
create policy counsel_delete_own on counsel_results
  for delete using (auth.uid() = user_id);

-- ── 교회 교육 기획안 (아빠 전용) ────────────────────────────
create table if not exists church_plans (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  kind        text not null default '학생회모임',  -- 학생회모임 | 수련회 | VBS | 교사훈련 | 청년회 | 질문
  target      text not null default '중고등부',
  content     text not null default '',            -- AI 생성 기획안(마크다운)
  prompt      text,                                -- 입력한 요청/질문
  created_at  timestamptz not null default now()
);

create index if not exists church_plans_user_idx on church_plans (user_id, created_at desc);

alter table church_plans enable row level security;

-- 본인(아빠)만 접근 — 가족 공유 없음
drop policy if exists church_all_own on church_plans;
create policy church_all_own on church_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
