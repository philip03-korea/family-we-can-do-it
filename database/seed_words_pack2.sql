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
