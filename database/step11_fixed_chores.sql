-- ============================================================
-- step11: 집안일 고정(pin) 기능
--   fixed: 이 집안일은 자동 로테이션에서 제외(담당 고정)
--   fixed_until: 고정 만료일(이 날짜까지 고정 유지). null이면 기간 무제한
-- 자동 로테이션은 fixed=true 행을 보존하고, 나머지를 포인트 기준 공평 분배.
-- 멱등(여러 번 실행해도 안전)
-- ============================================================

alter table chores add column if not exists fixed boolean not null default false;
alter table chores add column if not exists fixed_until date;

-- 고정 조회 가속(선택)
create index if not exists chores_fixed_idx on chores (fixed) where fixed = true;
