-- ============================================================
-- step15 — 아이별 화면 노출 설정
-- ============================================================
-- 기능이 18개까지 늘면서 아이 화면에도 남의 기능이 전부 보였다.
-- 기능 코드는 그대로 두고, "누구에게 무엇을 열지"만 컬럼 하나로 관리한다.
--
--   null      → 앱의 나이별 기본값 (src/data/features.js DEFAULT_FEATURES)
--   text[]    → 그 아이에게 열린 기능 키 목록
--   부모(mom·dad)는 이 값과 무관하게 항상 전체를 본다 (앱에서 처리)
--
-- 되돌리기: 이 컬럼만 지우면 전원이 다시 전체를 본다. 기능 라우트는
-- 그대로 살아 있으므로 데이터 손실이 없다.
--
-- ⚠️ Supabase SQL Editor 에서 수동 실행할 것. 실행 후 HANDOFF.md 에 기록.
-- ============================================================

alter table public.profiles
  add column if not exists enabled_features text[];

-- ---------- 부모가 자녀 행을 수정할 수 있게 ----------
-- ⚠️ profiles 정책 안에서 profiles 를 직접 조회하면 RLS 무한재귀가 난다.
-- step13 에서 만들어 둔 is_parent() (security definer) 를 반드시 쓸 것.
drop policy if exists "parents update children" on public.profiles;
create policy "parents update children"
  on public.profiles for update
  using (member_key not in ('mom', 'dad') and is_parent())
  with check (member_key not in ('mom', 'dad'));

-- ---------- 가족 전체가 서로의 노출 설정을 읽을 수 있게 ----------
-- 부모용 「화면 설정」 화면이 자녀의 현재 값을 보여주려면 select 가 필요하다.
-- profiles 는 이미 가족 전체 select 정책이 있으므로 컬럼만 늘면 그대로 따라온다.
-- (정책이 컬럼 목록을 제한하고 있다면 아래 주석을 풀어 확인)
-- select policyname, cmd, qual from pg_policies
--   where schemaname = 'public' and tablename = 'profiles';

-- ---------- 확인 ----------
select member_key, display_name, enabled_features
from public.profiles
order by member_key;
