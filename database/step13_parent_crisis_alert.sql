-- ============================================================
-- step13: 부모 위기 알림 (A안 — 미리 고지하는 방식)
--
-- 설계 원칙 (하23 상담 윤리 "비밀보장과 그 한계"):
--   자녀에게 검사 시작 전 이렇게 고지한다 —
--     "네 답은 기본적으로 너만 봐.
--      딱 하나 예외: 스스로를 해치고 싶다는 답을 하면 엄마·아빠한테 알려질 거야.
--      숨기려는 게 아니라 미리 말해주는 거고, 네가 걱정돼서야."
--   이 SQL은 그 고지 내용과 **정확히 일치**해야 한다.
--   → 평상시 점수(우울·불안·자존감·스트레스)는 부모에게 열리지 않는다.
--   → crisis=true 인 행만 열린다.
--
-- ⚠️ 이 정책을 "모든 결과"로 넓히려면 반드시 고지문(data/counsel.js의
--    CONFIDENTIALITY)도 함께 고쳐야 한다. 고지와 동작이 어긋나면 안 된다.
-- 멱등(여러 번 실행해도 안전)
-- ============================================================

-- 요청자가 부모(엄마·아빠)인지
create or replace function is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and member_key in ('mom','dad')
  )
$$;

-- 부모가 자녀의 "위기 결과만" 조회
drop policy if exists counsel_select_parent_crisis on counsel_results;
create policy counsel_select_parent_crisis on counsel_results
  for select using (
    crisis = true
    and member_key in ('haeum', 'haul', 'haram')
    and is_parent()
  );

-- 부모가 "아이와 이야기했음" 확인 표시
alter table counsel_results add column if not exists parent_seen_at timestamptz;

drop policy if exists counsel_update_parent_seen on counsel_results;
create policy counsel_update_parent_seen on counsel_results
  for update using (
    crisis = true
    and member_key in ('haeum', 'haul', 'haram')
    and is_parent()
  ) with check (
    crisis = true
    and member_key in ('haeum', 'haul', 'haram')
    and is_parent()
  );

-- ── 검증 결과 (2026-07-15, 실제 RLS 시뮬레이션) ──────────────
--   하람 결과 3건(일반2 + 위기1) 기준
--   · 아빠가 보는 하람 결과 전체     = 1  (위기만)
--   · 아빠가 보는 하람 평상시 점수   = 0  ✅ 고지대로 안 보임
--   · 아빠가 보는 하람 위기          = 1  ✅
--   · 하람 본인이 보는 자기 것       = 3  ✅ 전부
