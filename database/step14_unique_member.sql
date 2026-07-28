-- ============================================================
-- STEP 14 — 구성원 중복 정리 + 재발 방지
--
-- 문제: 엄마가 두 계정으로 가입해 profiles에 member_key='mom' 행이 2개가 됐다.
--       (hr2514@hanmail.net 6/9 가입 → 6/10 이후 미사용 / hr25142514@gmail.com 6/20~ 실사용)
--       대시보드 미리보기 줄에 엄마가 두 번 뜨고, viewKey를 member_key로 찾기 때문에
--       엄마 미리보기가 항상 빈 계정 쪽으로 걸렸다.
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- ============================================================

-- ---------- 1) 안 쓰는 빈 엄마 계정 삭제 ----------
-- 삭제 대상: 92c29fe5-fbf3-48c0-8fa2-a2c91daa768b (hr2514@hanmail.net)
-- 보유 데이터: ai_usage 1행(6/10 호출 2회)뿐. 단어·상담·집안일·포인트 전부 0건.
-- ※ 실행 전 아래 확인 쿼리로 한 번 더 눈으로 보고 지우세요.
select p.id, p.member_key, p.display_name, u.email, u.last_sign_in_at
from public.profiles p join auth.users u on u.id = p.id
where p.member_key = 'mom';

delete from public.ai_usage
where user_id = '92c29fe5-fbf3-48c0-8fa2-a2c91daa768b';

delete from public.profiles
where id = '92c29fe5-fbf3-48c0-8fa2-a2c91daa768b';

delete from auth.users
where id = '92c29fe5-fbf3-48c0-8fa2-a2c91daa768b';

-- ---------- 2) 재발 방지: 한 구성원 = 한 계정 ----------
-- member_key에 유니크 인덱스. 이후 같은 구성원을 두 번 고르면 DB가 거부한다.
-- (프론트에서도 PickMember가 이미 선택된 구성원을 비활성화하지만, 최종 방어선은 여기)
create unique index if not exists profiles_member_key_uniq
  on public.profiles (member_key);

-- 확인: 5명(mom/dad/haeum/haul/haram)만 남아야 한다
select member_key, display_name, count(*) over () as total
from public.profiles
order by member_key;
