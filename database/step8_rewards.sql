-- ============================================================
-- FamTalk — 보상 상점 (포인트로 면제권·쿠폰 구매)
-- Supabase SQL Editor 에서 실행. 재실행 안전.
-- 통화 = 집안일 포인트(point_ledger 합계). 외부 API 없음 → 비용 0원.
-- ============================================================

-- 1) 포인트 원장(지갑) — 적립(+)/사용(-) 기록. 잔액 = delta 합계
create table if not exists public.point_ledger (
  id         bigint generated always as identity primary key,
  member_key text not null,                 -- mom/dad/haeum/haul/haram
  delta      int  not null,                 -- +적립 / -사용
  reason     text,                          -- chore/purchase/refund/bonus
  ref        text unique,                   -- 중복 방지 키 (chore:ID, purchase:ID)
  created_at timestamptz not null default now()
);
create index if not exists point_ledger_member_idx on public.point_ledger(member_key);
alter table public.point_ledger enable row level security;
drop policy if exists "ledger select authed" on public.point_ledger;
drop policy if exists "ledger write authed" on public.point_ledger;
create policy "ledger select authed" on public.point_ledger
  for select using (auth.role() = 'authenticated');
create policy "ledger write authed" on public.point_ledger
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2) 상점 상품
create table if not exists public.reward_items (
  id          bigint generated always as identity primary key,
  title       text not null unique,
  description text,
  cost        int not null,
  category    text,
  icon        text,
  active      boolean not null default true,
  sort        int not null default 0
);
alter table public.reward_items enable row level security;
drop policy if exists "items select authed" on public.reward_items;
drop policy if exists "items write authed" on public.reward_items;
create policy "items select authed" on public.reward_items
  for select using (auth.role() = 'authenticated');
create policy "items write authed" on public.reward_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3) 구매(교환) 내역
create table if not exists public.reward_purchases (
  id         bigint generated always as identity primary key,
  member_key text not null,
  item_id    bigint references public.reward_items(id) on delete set null,
  item_title text not null,
  cost       int not null,
  status     text not null default 'requested',  -- requested/approved/used/canceled
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists purchases_member_idx on public.reward_purchases(member_key, created_at);
alter table public.reward_purchases enable row level security;
drop policy if exists "purchases select authed" on public.reward_purchases;
drop policy if exists "purchases write authed" on public.reward_purchases;
create policy "purchases select authed" on public.reward_purchases
  for select using (auth.role() = 'authenticated');
create policy "purchases write authed" on public.reward_purchases
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3-1) 소원 (각자 직접 원하는 보상 요청 → 부모 승인 시 상점에 추가)
create table if not exists public.reward_wishes (
  id            bigint generated always as identity primary key,
  member_key    text not null,
  title         text not null,
  note          text,
  suggested_cost int,
  status        text not null default 'requested', -- requested/approved/rejected
  created_at    timestamptz not null default now()
);
create index if not exists wishes_status_idx on public.reward_wishes(status);
alter table public.reward_wishes enable row level security;
drop policy if exists "wishes select authed" on public.reward_wishes;
drop policy if exists "wishes write authed" on public.reward_wishes;
create policy "wishes select authed" on public.reward_wishes
  for select using (auth.role() = 'authenticated');
create policy "wishes write authed" on public.reward_wishes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4) 상품 시드 (앞서 정리한 보상 아이디어 전부)
insert into public.reward_items (title, description, cost, category, icon, sort) values
  ('용돈 5,000원', '포인트를 용돈으로 교환', 100, '용돈', '💰', 10),
  ('게임/유튜브 30분 추가권', '미디어 시간 30분 추가', 50, '미디어', '🎮', 20),
  ('주말 늦잠 쿠폰', '주말 아침 집안일 면제', 80, '미디어', '😴', 30),
  ('영화 고르기 권한', '가족 영화의 밤 영화 선택', 120, '미디어', '🎬', 40),
  ('저녁 메뉴 결정권', '오늘 저녁 메뉴를 내가 결정', 100, '특권', '🍽️', 50),
  ('리모컨 권한 하루', 'TV/넷플릭스 리모컨 독점 하루', 60, '특권', '📺', 60),
  ('앞자리(조수석) 탑승권', '외출 시 조수석 탑승', 40, '특권', '🚗', 70),
  ('설거지 1회 면제권', '설거지 당번 1회 패스', 30, '면제', '🧽', 80),
  ('집안일 패스권 (1회)', '하기 싫은 집안일 1회 패스', 50, '면제', '🎟️', 90),
  ('당번 바꿔치기권', '내 당번을 형제와 1회 교환', 40, '면제', '🔄', 100),
  ('하루 휴무권 (집안일)', '하루 집안일 전체 면제 (월 1회)', 100, '면제', '🏖️', 110),
  ('배달 파티 제안권', '주말 배달 음식 파티 제안', 150, '가족', '🍕', 120),
  ('가족 나들이 장소 선택권', '다음 나들이 장소를 내가 결정', 200, '가족', '🗺️', 130),
  ('갖고 싶은 것 신청 (예산 내)', '원하는 물건 하나 신청', 300, '누적', '🎁', 140)
on conflict (title) do nothing;
