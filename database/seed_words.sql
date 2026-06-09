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
