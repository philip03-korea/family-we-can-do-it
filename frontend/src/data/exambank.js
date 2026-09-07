// 문제은행 — TOEFL iBT + 고졸 검정고시, 과목별로 언제든 풀 수 있게.
//
// 문제 유형
//   mcq    — 객관식. choices + answer(정답 인덱스) + explain
//   prompt — 말하기·쓰기처럼 정답이 하나가 아닌 과제. structure(답변 뼈대) + tips
//
// 실제 기출이 아니라 유형을 따라 만든 연습 문제다. 시험 범위·형식은 해마다
// 바뀔 수 있으니 공식 안내(ETS / 시·도 교육청 공고)를 함께 확인할 것.

export const BANKS = [
  {
    key: 'ged',
    name: '고졸 검정고시',
    emoji: '📗',
    bg: 'bg-level-b',
    note: '각 과목 60점 이상 + 전 과목 평균 60점 이상이면 합격. 과목별 합격이 남으니 나눠서 봐도 된다.',
    subjects: [
      { key: 'ged_kor', name: '국어', emoji: '📖' },
      { key: 'ged_math', name: '수학', emoji: '📐' },
      { key: 'ged_eng', name: '영어', emoji: '🔤' },
      { key: 'ged_soc', name: '사회', emoji: '🌏' },
      { key: 'ged_sci', name: '과학', emoji: '🔬' },
      { key: 'ged_his', name: '한국사', emoji: '🏯' },
    ],
  },
  {
    key: 'toefl',
    name: 'TOEFL iBT',
    emoji: '🎓',
    bg: 'bg-level-e',
    note: '4영역 각 30점, 총 120점. 읽기·듣기는 객관식, 말하기·쓰기는 과제형이라 뼈대를 익히는 게 먼저다.',
    subjects: [
      { key: 'tf_read', name: 'Reading', emoji: '📚' },
      { key: 'tf_listen', name: 'Listening', emoji: '🎧' },
      { key: 'tf_speak', name: 'Speaking', emoji: '🎤' },
      { key: 'tf_write', name: 'Writing', emoji: '✍️' },
    ],
  },
]

export const SUBJECT_MAP = Object.fromEntries(
  BANKS.flatMap((b) => b.subjects.map((s) => [s.key, { ...s, bank: b.key, bankName: b.name, bg: b.bg }])),
)

export const QUESTIONS = {
  // ─────────────────────────── 검정고시 · 국어
  ged_kor: [
    { id: 'gk1', type: 'mcq', q: '다음 밑줄 친 단어의 품사로 알맞은 것은?\n\n"그는 매우 빠르게 달렸다."\n(밑줄: 빠르게)', choices: ['명사', '부사', '형용사', '조사'], answer: 1, explain: '용언(달렸다)을 꾸미고 있으므로 부사다. 기본형 "빠르다"는 형용사지만, "빠르게"로 활용되어 서술어를 수식하면 부사어 역할을 한다.' },
    { id: 'gk2', type: 'mcq', q: '다음 중 맞춤법이 옳은 것은?', choices: ['왠일이니', '웬일이니', '왼일이니', '웨일이니'], answer: 1, explain: '"어찌 된"의 뜻은 "웬"이다. "왠"은 "왠지(왜인지)"에만 쓴다. → 웬일 / 왠지.' },
    { id: 'gk3', type: 'mcq', q: '다음 시조에서 두드러지는 표현 방법은?\n\n"이 몸이 죽어 죽어 일백 번 고쳐 죽어\n백골이 진토 되어 넋이라도 있고 없고\n임 향한 일편단심이야 가실 줄이 있으랴"', choices: ['반어법', '점층법', '풍유법', '역설법'], answer: 1, explain: '"죽어 죽어 → 일백 번 고쳐 죽어 → 백골이 진토 되어"로 뜻을 점점 강하게 쌓아 올리는 점층법이다. 정몽주 「단심가」.' },
    { id: 'gk4', type: 'mcq', q: '"발이 넓다"의 뜻으로 알맞은 것은?', choices: ['걸음이 빠르다', '아는 사람이 많다', '욕심이 많다', '참을성이 있다'], answer: 1, explain: '관용어로 "사교적이어서 아는 사람이 많다"는 뜻이다.' },
    { id: 'gk5', type: 'mcq', q: '다음 문장에서 주어는?\n\n"어제 형이 사 준 책이 무척 재미있다."', choices: ['어제', '형이', '책이', '재미있다'], answer: 2, explain: '서술어 "재미있다"의 주체는 "책이"다. "형이"는 관형절(형이 사 준) 안의 주어다.' },
    { id: 'gk6', type: 'mcq', q: '설명문을 읽을 때 가장 먼저 파악해야 할 것은?', choices: ['글쓴이의 감정', '중심 화제와 설명 대상', '작품의 배경', '인물의 성격'], answer: 1, explain: '설명문은 정보 전달이 목적이므로 "무엇에 대한 글인가"(중심 화제)를 먼저 잡아야 한다.' },
    { id: 'gk7', type: 'mcq', q: '다음 중 높임 표현이 바르게 쓰인 문장은?', choices: ['할머니께서 진지를 잡수신다.', '할머니가 밥을 먹는다.', '할머니께서 밥을 잡수신다.', '할머니가 진지를 드신다.'], answer: 0, explain: '주체 높임(께서, -시-)과 어휘 높임(진지, 잡수시다)이 모두 맞게 쓰인 것은 1번이다.' },
    { id: 'gk8', type: 'mcq', q: '"인과"의 방식으로 글을 전개한 것은?', choices: ['봄, 여름, 가을, 겨울의 특징을 차례로 든다', '고래와 상어의 공통점을 비교한다', '지구 기온이 올라 빙하가 녹았다고 설명한다', '민주주의의 뜻을 사전처럼 밝힌다'], answer: 2, explain: '원인(기온 상승)과 결과(빙하 융해)를 잇는 것이 인과 전개다. 1은 나열, 2는 비교, 4는 정의.' },
  ],

  // ─────────────────────────── 검정고시 · 수학
  ged_math: [
    { id: 'gm1', type: 'mcq', q: '이차방정식 x² − 5x + 6 = 0 의 두 근의 합은?', choices: ['−5', '5', '6', '−6'], answer: 1, explain: '근과 계수의 관계에서 두 근의 합은 −b/a = 5. (실제 근은 2와 3이고 합은 5)' },
    { id: 'gm2', type: 'mcq', q: '일차함수 y = 2x − 3 의 그래프가 y축과 만나는 점의 좌표는?', choices: ['(0, −3)', '(0, 2)', '(−3, 0)', '(3, 0)'], answer: 0, explain: 'y축과 만나는 점은 x = 0 일 때이므로 y = −3. 즉 (0, −3).' },
    { id: 'gm3', type: 'mcq', q: '반지름이 5cm인 원의 넓이는? (π는 그대로 둔다)', choices: ['10π cm²', '25π cm²', '50π cm²', '100π cm²'], answer: 1, explain: '원의 넓이 = πr² = π × 5² = 25π cm².' },
    { id: 'gm4', type: 'mcq', q: '등차수열 3, 7, 11, 15, … 의 제10항은?', choices: ['39', '40', '43', '35'], answer: 0, explain: '첫째항 3, 공차 4. aₙ = 3 + (n−1)·4 이므로 a₁₀ = 3 + 36 = 39.' },
    { id: 'gm5', type: 'mcq', q: '주사위 한 개를 던질 때 3의 배수가 나올 확률은?', choices: ['1/6', '1/3', '1/2', '2/3'], answer: 1, explain: '3의 배수는 3, 6 두 가지. 2/6 = 1/3.' },
    { id: 'gm6', type: 'mcq', q: '2x + 3y = 12, x = 3 일 때 y의 값은?', choices: ['1', '2', '3', '4'], answer: 1, explain: '2(3) + 3y = 12 → 6 + 3y = 12 → 3y = 6 → y = 2.' },
    { id: 'gm7', type: 'mcq', q: '직각삼각형에서 두 변의 길이가 3, 4 일 때 빗변의 길이는?', choices: ['5', '6', '7', '12'], answer: 0, explain: '피타고라스 정리: 3² + 4² = 9 + 16 = 25 = 5².' },
    { id: 'gm8', type: 'mcq', q: '자료 4, 6, 8, 10, 12 의 평균은?', choices: ['7', '8', '9', '10'], answer: 1, explain: '(4+6+8+10+12) ÷ 5 = 40 ÷ 5 = 8.' },
  ],

  // ─────────────────────────── 검정고시 · 영어
  ged_eng: [
    { id: 'ge1', type: 'mcq', q: '빈칸에 알맞은 것은?\n\nShe has lived in Seoul ____ 2015.', choices: ['for', 'since', 'during', 'from'], answer: 1, explain: '현재완료에서 "특정 시점 이후로"는 since. for는 기간(for 10 years)과 함께 쓴다.' },
    { id: 'ge2', type: 'mcq', q: '대화의 빈칸에 알맞은 응답은?\n\nA: How often do you exercise?\nB: ____', choices: ['For two hours.', 'Three times a week.', 'At the gym.', 'Because I like it.'], answer: 1, explain: 'How often(얼마나 자주)은 빈도를 묻는다. "일주일에 세 번"이 알맞다.' },
    { id: 'ge3', type: 'mcq', q: '밑줄 친 부분과 뜻이 가장 가까운 것은?\n\nThe test was a piece of cake.', choices: ['very difficult', 'very easy', 'very long', 'very boring'], answer: 1, explain: 'a piece of cake = 아주 쉬운 일 (관용 표현).' },
    { id: 'ge4', type: 'mcq', q: '어법상 옳은 문장은?', choices: ['He don’t like coffee.', 'She go to school by bus.', 'They are studying now.', 'I am know the answer.'], answer: 2, explain: '3번만 어법에 맞다. 1은 doesn’t, 2는 goes, 4는 I know.' },
    { id: 'ge5', type: 'mcq', q: '글의 목적으로 알맞은 것은?\n\n"Our library will be closed from July 1 to July 5 for repairs. Please return your books before June 30."', choices: ['도서 추천', '휴관 안내', '회원 모집', '독후감 대회 공고'], answer: 1, explain: '수리로 인한 휴관 기간과 도서 반납 요청을 알리는 안내문이다.' },
    { id: 'ge6', type: 'mcq', q: '빈칸에 알맞은 것은?\n\nIf it ____ tomorrow, we will cancel the picnic.', choices: ['rains', 'will rain', 'rained', 'is raining'], answer: 0, explain: '조건의 부사절에서는 미래를 현재시제로 쓴다. If it rains…, we will cancel….' },
    { id: 'ge7', type: 'mcq', q: '다음 중 나머지와 성격이 다른 단어는?', choices: ['apply', 'application', 'applicant', 'applied'], answer: 1, explain: 'application만 명사다. apply(동사), applicant(사람 명사지만 여기서는 동사 파생 인칭), applied(과거·과거분사).' },
    { id: 'ge8', type: 'mcq', q: '문맥상 빈칸에 알맞은 것은?\n\nAlthough he was tired, he ____ finished his homework.', choices: ['never', 'still', 'hardly', 'seldom'], answer: 1, explain: 'Although(비록 ~이지만)와 어울려 "그래도 여전히 끝냈다"가 자연스럽다.' },
  ],

  // ─────────────────────────── 검정고시 · 사회
  ged_soc: [
    { id: 'gs1', type: 'mcq', q: '우리나라 헌법이 규정한 국민의 4대 의무가 아닌 것은?', choices: ['납세의 의무', '국방의 의무', '투표의 의무', '교육의 의무'], answer: 2, explain: '4대 의무는 납세·국방·교육·근로다. 투표는 권리이며 의무가 아니다.' },
    { id: 'gs2', type: 'mcq', q: '수요가 늘고 공급이 그대로일 때 시장 가격은?', choices: ['내려간다', '올라간다', '변하지 않는다', '알 수 없다'], answer: 1, explain: '수요 곡선이 오른쪽으로 이동하면 균형 가격과 균형 거래량이 모두 오른다.' },
    { id: 'gs3', type: 'mcq', q: '삼권분립에서 법을 만드는 기관은?', choices: ['행정부', '입법부', '사법부', '헌법재판소'], answer: 1, explain: '입법부(국회)가 법률 제정, 행정부는 집행, 사법부는 재판을 맡는다.' },
    { id: 'gs4', type: 'mcq', q: '기후 변화의 주된 원인으로 지목되는 기체는?', choices: ['산소', '질소', '이산화탄소', '헬륨'], answer: 2, explain: '화석연료 연소로 배출되는 이산화탄소가 대표적인 온실기체다.' },
    { id: 'gs5', type: 'mcq', q: '문화를 그 사회의 맥락에서 이해하려는 태도는?', choices: ['자문화 중심주의', '문화 사대주의', '문화 상대주의', '문화 절대주의'], answer: 2, explain: '문화 상대주의는 각 문화를 그 사회의 환경·역사 속에서 이해하려는 태도다.' },
    { id: 'gs6', type: 'mcq', q: '국내총생산(GDP)에 포함되지 않는 것은?', choices: ['국내 공장에서 생산한 자동차', '국내 미용실의 서비스', '주부의 가사노동', '국내에서 지은 새 아파트'], answer: 2, explain: 'GDP는 시장에서 거래된 최종 생산물의 가치다. 시장을 거치지 않는 가사노동은 빠진다.' },
    { id: 'gs7', type: 'mcq', q: '인구 피라미드가 항아리 모양일 때 나타나는 사회 현상은?', choices: ['출산율 증가', '저출산·고령화', '급격한 인구 폭증', '유소년 인구 급증'], answer: 1, explain: '아랫부분(유소년)이 좁고 가운데·위가 두터운 항아리형은 저출산·고령화 사회의 전형이다.' },
    { id: 'gs8', type: 'mcq', q: '지도에서 등고선의 간격이 좁을수록 나타나는 지형은?', choices: ['평지', '완만한 경사', '급한 경사', '호수'], answer: 2, explain: '같은 높이차를 짧은 거리에 표현하므로 간격이 좁을수록 경사가 급하다.' },
  ],

  // ─────────────────────────── 검정고시 · 과학
  ged_sci: [
    { id: 'gc1', type: 'mcq', q: '물이 끓어 수증기가 되는 현상의 이름은?', choices: ['융해', '기화', '응고', '승화'], answer: 1, explain: '액체 → 기체는 기화(끓음·증발). 고체 → 액체는 융해, 액체 → 고체는 응고.' },
    { id: 'gc2', type: 'mcq', q: '식물이 빛을 이용해 양분을 만드는 과정은?', choices: ['호흡', '증산', '광합성', '발효'], answer: 2, explain: '엽록체에서 빛에너지로 이산화탄소와 물로부터 포도당을 만드는 것이 광합성이다.' },
    { id: 'gc3', type: 'mcq', q: '지구 대기에서 가장 많은 비율을 차지하는 기체는?', choices: ['산소', '질소', '이산화탄소', '아르곤'], answer: 1, explain: '질소가 약 78%, 산소가 약 21%다.' },
    { id: 'gc4', type: 'mcq', q: '옴의 법칙 V = IR 에서 저항이 2Ω, 전류가 3A 일 때 전압은?', choices: ['1.5V', '5V', '6V', '9V'], answer: 2, explain: 'V = IR = 3 × 2 = 6V.' },
    { id: 'gc5', type: 'mcq', q: '산성 용액의 성질로 옳은 것은?', choices: ['푸른 리트머스를 붉게 한다', '붉은 리트머스를 푸르게 한다', 'pH가 7보다 크다', '미끈거린다'], answer: 0, explain: '산성은 푸른 리트머스를 붉게 하고 pH < 7이다. 미끈거리는 것은 염기성.' },
    { id: 'gc6', type: 'mcq', q: '달의 모양이 변해 보이는 까닭은?', choices: ['달이 스스로 빛을 내기 때문', '지구 그림자가 달을 가리기 때문', '달이 지구 둘레를 돌며 햇빛 받는 면이 달라지기 때문', '달의 크기가 실제로 변하기 때문'], answer: 2, explain: '달의 공전으로 태양–지구–달의 위치 관계가 바뀌어 밝은 면이 보이는 정도가 달라진다.' },
    { id: 'gc7', type: 'mcq', q: '사람의 혈액에서 산소를 운반하는 성분은?', choices: ['백혈구', '적혈구', '혈소판', '혈장'], answer: 1, explain: '적혈구 속 헤모글로빈이 산소와 결합해 운반한다. 백혈구는 면역, 혈소판은 지혈.' },
    { id: 'gc8', type: 'mcq', q: '에너지 보존 법칙에 대한 설명으로 옳은 것은?', choices: ['에너지는 사용하면 사라진다', '에너지는 형태가 바뀌어도 총량은 일정하다', '에너지는 계속 늘어난다', '에너지는 물체마다 다르게 보존된다'], answer: 1, explain: '에너지는 형태(운동·위치·열·전기 등)만 바뀔 뿐 전체 총량은 변하지 않는다.' },
  ],

  // ─────────────────────────── 검정고시 · 한국사
  ged_his: [
    { id: 'gh1', type: 'mcq', q: '고조선의 건국 이야기가 실린 대표적인 문헌은?', choices: ['삼국사기', '삼국유사', '고려사', '조선왕조실록'], answer: 1, explain: '일연의 『삼국유사』에 단군 신화가 실려 있다. 『삼국사기』(김부식)는 삼국 중심의 정사다.' },
    { id: 'gh2', type: 'mcq', q: '신라가 삼국을 통일한 시기의 왕은?', choices: ['진흥왕', '법흥왕', '문무왕', '지증왕'], answer: 2, explain: '문무왕 때 나당전쟁까지 마무리하며 삼국 통일을 완성했다(676).' },
    { id: 'gh3', type: 'mcq', q: '고려 시대에 만들어진 세계기록유산은?', choices: ['훈민정음 해례본', '직지심체요절', '난중일기', '동의보감'], answer: 1, explain: '『직지심체요절』은 현존 최고(最古)의 금속활자 인쇄본으로 유네스코 세계기록유산이다.' },
    { id: 'gh4', type: 'mcq', q: '세종 대의 업적으로 볼 수 없는 것은?', choices: ['훈민정음 창제', '측우기 제작', '집현전 설치', '대동법 실시'], answer: 3, explain: '대동법은 광해군 때 경기도에서 처음 시행되어 이후 확대되었다.' },
    { id: 'gh5', type: 'mcq', q: '1919년에 일어난 전국적 항일 운동은?', choices: ['동학농민운동', '3·1 운동', '광주학생항일운동', '6·10 만세운동'], answer: 1, explain: '3·1 운동(1919)은 전국·전 계층이 참여한 항일 운동으로 대한민국 임시정부 수립으로 이어졌다.' },
    { id: 'gh6', type: 'mcq', q: '조선 후기 실학자 정약용의 저서는?', choices: ['목민심서', '택리지', '동국여지승람', '경국대전'], answer: 0, explain: '『목민심서』는 지방관이 지켜야 할 도리를 정리한 정약용의 대표 저서다.' },
    { id: 'gh7', type: 'mcq', q: '4·19 혁명의 직접적인 계기가 된 사건은?', choices: ['6·25 전쟁', '3·15 부정선거', '5·16 군사정변', '유신 헌법 선포'], answer: 1, explain: '1960년 3·15 부정선거에 대한 항의가 4·19 혁명으로 번져 이승만 대통령이 하야했다.' },
    { id: 'gh8', type: 'mcq', q: '고구려의 전성기를 이끈 왕으로, 만주 일대를 장악한 인물은?', choices: ['소수림왕', '광개토대왕', '고국천왕', '보장왕'], answer: 1, explain: '광개토대왕은 만주와 한강 이북으로 영토를 크게 넓혔고, 아들 장수왕이 평양 천도로 이를 이었다.' },
  ],

  // ─────────────────────────── TOEFL · Reading
  tf_read: [
    {
      id: 'tr1', type: 'mcq',
      passage: 'Coral reefs occupy less than one percent of the ocean floor, yet they shelter roughly a quarter of all marine species. This density is possible because reef-building corals host microscopic algae inside their tissues. The algae photosynthesize and pass most of the sugars they make to the coral; in return, the coral supplies shelter and the nitrogen the algae need. When water grows too warm, however, the coral expels the algae — an event known as bleaching. A bleached coral is not dead, but it has lost its main food source and will starve if the warm water persists.',
      q: 'According to the passage, what do the algae receive from the coral?', choices: ['Sugars produced by photosynthesis', 'Shelter and nitrogen', 'Protection from sunlight', 'A quarter of the ocean floor'], answer: 1,
      explain: '"in return, the coral supplies shelter and the nitrogen the algae need" — 산호가 조류에게 주는 것은 서식처와 질소다. 1번은 반대 방향(조류 → 산호).',
    },
    {
      id: 'tr2', type: 'mcq',
      passage: '(위와 같은 지문)',
      q: 'The word "expels" in the passage is closest in meaning to', choices: ['absorbs', 'drives out', 'feeds', 'multiplies'], answer: 1,
      explain: 'expel = 밖으로 내보내다 = drive out. 백화(bleaching)는 산호가 조류를 몸 밖으로 내보내는 현상이다. 어휘 문제는 앞뒤 문맥으로 확인하는 습관을 들일 것.',
    },
    {
      id: 'tr3', type: 'mcq',
      passage: '(위와 같은 지문)',
      q: 'It can be inferred from the passage that bleaching', choices: ['kills coral immediately', 'is reversible if the water cools soon enough', 'increases the number of marine species', 'is caused by a lack of sunlight'], answer: 1,
      explain: '"A bleached coral is not dead… will starve if the warm water persists" — 죽은 것은 아니고, 더운 물이 계속될 때 굶어 죽는다. 즉 빨리 식으면 회복 가능하다는 추론이 가능하다.',
    },
    {
      id: 'tr4', type: 'mcq',
      passage: 'Before the printing press, copying a book meant months of work by hand, and each copy introduced new errors. Gutenberg’s movable type did not merely make books cheaper; it made them identical. Scholars in different cities could finally argue about the same page. Historians now argue that this standardization, more than the lower price, is what accelerated the scientific revolution.',
      q: 'What is the main point of the passage?', choices: ['Books became cheaper after the printing press.', 'Hand copying was slow and tiring.', 'Standardization mattered more than cost.', 'Gutenberg invented paper.'], answer: 2,
      explain: '마지막 문장이 주제문이다: 가격보다 "동일한 판본"이라는 표준화가 더 중요했다. TOEFL 주제 문제는 지문 첫 문장보다 마지막 결론 문장에 답이 있는 경우가 많다.',
    },
    {
      id: 'tr5', type: 'mcq',
      passage: '(위와 같은 지문)',
      q: 'Why does the author mention "the same page"?', choices: ['To show that pages were numbered for the first time', 'To illustrate that scholars could now refer to identical text', 'To explain how paper was made', 'To criticize medieval scholars'], answer: 1,
      explain: '수사적 목적(rhetorical purpose) 문제. "같은 페이지"는 표준화된 동일 판본을 두고 토론할 수 있게 됐다는 점을 보여주기 위한 예시다.',
    },
    {
      id: 'tr6', type: 'mcq',
      passage: '(위와 같은 지문)',
      q: 'The word "accelerated" is closest in meaning to', choices: ['delayed', 'sped up', 'explained', 'replaced'], answer: 1,
      explain: 'accelerate = 속도를 높이다 = speed up.',
    },
  ],

  // ─────────────────────────── TOEFL · Listening (스크립트를 듣고 푸는 방식)
  tf_listen: [
    {
      id: 'tl1', type: 'mcq', audio: true,
      passage: 'Professor: Today I want to talk about why some birds migrate and others don’t. The short answer is food. A bird that eats insects has almost nothing to eat in a northern winter, so it flies south. A bird that eats seeds can often stay. But there is a cost. Migration burns enormous energy, and many young birds die on their first trip. So migration is not a better strategy — it is a trade-off.',
      q: 'What is the main idea of the talk?', choices: ['All birds migrate in winter.', 'Migration is a trade-off driven mainly by food.', 'Seed-eating birds are stronger than insect-eaters.', 'Young birds always survive migration.'], answer: 1,
      explain: '교수는 먹이 때문에 이동하지만 에너지 소모와 사망률이라는 대가가 있다고 정리한다. "it is a trade-off"가 핵심 문장이다.',
    },
    {
      id: 'tl2', type: 'mcq', audio: true,
      passage: '(위와 같은 강의)',
      q: 'Why does the professor mention young birds?', choices: ['To show that migration has a real cost', 'To explain how birds learn to fly', 'To compare species of insects', 'To argue that migration should be stopped'], answer: 0,
      explain: '어린 새의 높은 사망률은 "이동에는 큰 비용이 든다"는 주장을 뒷받침하는 근거로 언급됐다.',
    },
    {
      id: 'tl3', type: 'mcq', audio: true,
      passage: 'Student: Excuse me, I registered for the chemistry lab but the system says my section is full. Advisor: Let me look… Yes, section 3 closed yesterday. I can put you on the waitlist, or you could take section 5 — it meets Friday afternoon. Student: Friday afternoon is tough, I work then. Advisor: Then the waitlist it is. Most people get in by the second week.',
      q: 'What will the student most likely do?', choices: ['Take section 5 on Friday', 'Join the waitlist for section 3', 'Drop the chemistry lab', 'Change his job schedule'], answer: 1,
      explain: '금요일 오후는 아르바이트 때문에 어렵다고 했고, 조언자가 "Then the waitlist it is"로 정리했다. 대화형(conversation) 문항은 마지막 합의 내용이 답인 경우가 많다.',
    },
    {
      id: 'tl4', type: 'mcq', audio: true,
      passage: '(위와 같은 대화)',
      q: 'What does the advisor imply about the waitlist?', choices: ['It rarely works.', 'It usually works within about two weeks.', 'It costs extra money.', 'It is only for seniors.'], answer: 1,
      explain: '"Most people get in by the second week" — 대개 둘째 주에는 들어간다는 뜻이다. imply 문제는 직접 말하지 않은 함의를 묻는다.',
    },
    {
      id: 'tl5', type: 'mcq', audio: true,
      passage: 'Professor: A common misconception is that the Sahara has always been a desert. Cave paintings found there show cattle, swimmers, and rivers. About six thousand years ago the region was green. A slow shift in the Earth’s tilt changed the monsoon pattern, and within a few centuries the grassland dried out.',
      q: 'What evidence does the professor give that the Sahara was once green?', choices: ['Satellite photographs', 'Cave paintings showing cattle and rivers', 'Written records from traders', 'Modern rainfall data'], answer: 1,
      explain: '동굴 벽화에 소·수영하는 사람·강이 그려져 있다는 것이 근거로 제시됐다. 세부사항(detail) 문항.',
    },
    {
      id: 'tl6', type: 'mcq', audio: true,
      passage: '(위와 같은 강의)',
      q: 'According to the professor, what caused the change?', choices: ['Overgrazing by cattle', 'A shift in the Earth’s tilt affecting the monsoon', 'A volcanic eruption', 'Human irrigation projects'], answer: 1,
      explain: '"A slow shift in the Earth’s tilt changed the monsoon pattern" — 지축 기울기 변화가 몬순을 바꿨다.',
    },
  ],

  // ─────────────────────────── TOEFL · Speaking (과제형)
  tf_speak: [
    {
      id: 'ts1', type: 'prompt', task: 'Independent · Task 1', prep: '준비 15초 / 답변 45초',
      q: 'Some students prefer to study alone. Others prefer to study in a group. Which do you prefer, and why? Include reasons and examples.',
      structure: ['① 입장 한 문장 — I prefer studying in a group.', '② 이유 1 + 예시 — First, … For example, last semester …', '③ 이유 2 + 예시 — Second, … For instance, …', '④ 마무리 한 문장 — That’s why I prefer …'],
      tips: ['이유는 2개면 충분하다. 3개를 넣다가 시간에 쫓기는 경우가 가장 많다.', '예시는 반드시 구체적으로 — "지난 학기 수학 스터디에서" 처럼.', '완벽한 문장보다 끊기지 않는 흐름이 점수가 높다.'],
    },
    {
      id: 'ts2', type: 'prompt', task: 'Independent · Task 1', prep: '준비 15초 / 답변 45초',
      q: 'Do you agree or disagree with the following statement? Schools should require students to play a sport. Use specific reasons.',
      structure: ['① I disagree with this statement.', '② 이유 1 — 강제는 흥미를 떨어뜨린다 + 예시', '③ 이유 2 — 학생마다 재능이 다르다 + 예시', '④ For these reasons, I don’t think …'],
      tips: ['agree/disagree는 진심보다 "말하기 쉬운 쪽"을 고르는 게 전략이다.', 'because 하나로 붙이지 말고 First / Second 로 나눠 말할 것.'],
    },
    {
      id: 'ts3', type: 'prompt', task: 'Integrated · Task 2 (읽고 · 듣고 · 말하기)', prep: '읽기 45초 → 듣기 → 준비 30초 / 답변 60초',
      q: '학교 공지: The university will close the north parking lot to build a new dormitory. / 학생 대화: 남학생은 이 결정에 반대한다.\n\n남학생의 의견과 그 두 가지 이유를 설명하시오.',
      structure: ['① 공지 요약 한 문장 — The university announced that …', '② 화자의 입장 — The man disagrees with this decision.', '③ 이유 1 — He says that …', '④ 이유 2 — He also points out that …'],
      tips: ['Integrated는 내 의견을 넣지 않는다. 읽은 것·들은 것만 전달한다.', '"The man says / He argues that" 같은 전달 표현을 미리 외워둘 것.', '노트는 키워드만 — 문장으로 받아적으면 다음 말을 놓친다.'],
    },
    {
      id: 'ts4', type: 'prompt', task: 'Integrated · Task 4 (강의 요약)', prep: '듣기 → 준비 20초 / 답변 60초',
      q: '강의: 동물이 위장(camouflage)하는 두 가지 방식 — ① 배경과 색을 맞추는 방식 ② 다른 위험한 생물을 흉내 내는 방식.\n\n강의에서 든 예를 사용해 두 방식을 설명하시오.',
      structure: ['① 주제 한 문장 — The professor explains two ways animals use camouflage.', '② 방식 1 + 예 — The first is … For example, the professor mentioned …', '③ 방식 2 + 예 — The second is … such as …'],
      tips: ['시간이 모자라면 두 번째 예시를 짧게 줄이되 반드시 언급은 할 것.', '60초에 두 개를 넣어야 하므로 각 25초로 나눠 연습.'],
    },
  ],

  // ─────────────────────────── TOEFL · Writing (과제형)
  tf_write: [
    {
      id: 'tw1', type: 'prompt', task: 'Integrated Writing', prep: '읽기 3분 → 듣기 → 작성 20분 · 150~225 단어',
      q: '지문: 재택근무가 생산성을 높인다는 세 가지 근거를 제시한다.\n강의: 교수는 세 근거를 각각 반박한다.\n\n강의의 요점을 요약하고, 지문의 주장과 어떻게 대립하는지 설명하시오.',
      structure: [
        '도입 — The lecturer challenges the claims made in the reading passage.',
        '본문 1 — First, the reading argues that … However, the professor points out that …',
        '본문 2 — Second, … In contrast, the lecturer explains …',
        '본문 3 — Finally, … The professor refutes this by saying …',
      ],
      tips: ['내 의견은 절대 넣지 않는다. 두 자료의 대립만 정리한다.', '지문 문장을 그대로 베끼지 말고 바꿔 쓸 것(paraphrase).', '문단 3개 + 도입 1문장이 안전한 틀이다.'],
    },
    {
      id: 'tw2', type: 'prompt', task: 'Writing for an Academic Discussion', prep: '10분 · 100 단어 이상',
      q: '교수: 도시가 예산을 대중교통에 더 써야 할까, 아니면 자전거 도로에 더 써야 할까?\n학생 A는 대중교통, 학생 B는 자전거 도로를 지지한다.\n\n토론에 기여하는 글을 쓰시오.',
      structure: [
        '① 앞 사람 언급 — While I understand A’s point about …',
        '② 내 입장 — I believe cities should prioritize …',
        '③ 이유 + 구체적 근거 — because … For example, in my city …',
        '④ 짧은 마무리',
      ],
      tips: ['100단어 이상이면 되지만 120~150단어가 안정적이다.', '앞 학생 의견을 한 번은 언급해야 "토론에 기여"로 읽힌다.', '10분이라 개요를 오래 잡을 수 없다 — 입장부터 정하고 바로 쓸 것.'],
    },
    {
      id: 'tw3', type: 'prompt', task: 'Independent (연습용)', prep: '30분 · 300 단어 이상',
      q: 'Do you agree or disagree: It is better to learn from mistakes than to be taught the right way from the start? Use specific reasons and examples.',
      structure: ['서론 — 배경 한 문장 + 내 입장', '본론 1 — 이유 + 구체적 경험', '본론 2 — 이유 + 구체적 경험', '본론 3(선택) — 반대 의견 인정 후 재반박', '결론 — 입장 재확인'],
      tips: ['현재 시험 형식에서는 이 유형 대신 토론형이 나오지만, 긴 글 연습에는 여전히 좋다.', '예시는 개인 경험이 가장 쓰기 쉽다. 통계를 지어내지 말 것.'],
    },
  ],
}

export function questionsOf(subjectKey) {
  return QUESTIONS[subjectKey] || []
}

export const TOTAL_QUESTIONS = Object.values(QUESTIONS).reduce((n, list) => n + list.length, 0)
