// 하울 진학 가이드 데이터
//
// 출처: docs/하울_진로_조사.md (2026-09-03 조사) + 공개 입시 자료.
// ⚠️ 성적·조건 숫자는 전부 "대략적인 참고 범위"다. 대학 요강은 해마다 바뀌므로
//    실제 지원 전에는 반드시 각 대학 공식 요강으로 다시 확인해야 한다.
//    화면 상단에도 같은 경고를 띄운다.

export const DISCLAIMER =
  '아래 점수·조건은 공개 자료 기준의 대략적인 참고 범위예요. 해마다 바뀌니 지원 전에 각 대학 공식 요강으로 꼭 다시 확인하세요.'

// ── 0. 지금 상황 요약 (등대글로벌스쿨 재학 전제)
export const SITUATION = {
  school: '등대글로벌스쿨 (Lighthouse International School, LIS)',
  facts: [
    { label: '학사일정', value: '1학기 8~12월 / 2학기 1~6월 — 미국식 학년제', tone: 'info' },
    { label: '한국 학력', value: 'LIS 졸업장은 한국에서 고졸 학력이 아니다 (미인가 대안학교)', tone: 'warn' },
    { label: '해외 지원', value: 'MSA-CESS 인증 기반으로 해외대에는 정규 고교 성적표로 제출 가능', tone: 'ok' },
    { label: '재외국민 특례', value: '국내 소재 국제학교라 3년·12년 특례 모두 불가', tone: 'bad' },
    { label: '트랙 분기', value: '9학년 2학기부터 국제반(해외대) / 국내반(국내대)', tone: 'info' },
  ],
}

// ── 1. 진학 경로
export const PATHS = [
  {
    key: 'usa',
    title: 'A · 미국 대학 (국제반)',
    emoji: '🇺🇸',
    verdict: '가능',
    tone: 'ok',
    summary: 'LIS 성적표 + SAT/ACT + 공인영어 + 에세이로 정상 지원',
    need: ['LIS transcript (GPA)', 'SAT 또는 ACT', 'TOEFL / IELTS / Duolingo', '에세이 · 추천서 · 활동기록'],
    pros: ['LIS 커리큘럼(영어·토론·글쓰기)과 그대로 이어진다', '검정고시가 필요 없다', '학교 카운슬러 지원을 받을 수 있다'],
    cons: ['학비·생활비 부담이 크다 (장학금 확보가 관건)', '학교 진학실적은 "합격"과 "등록"이 다르니 확인 필요'],
  },
  {
    key: 'kor',
    title: 'B · 한국 대학',
    emoji: '🇰🇷',
    verdict: '검정고시 필수',
    tone: 'warn',
    summary: '고졸 검정고시 합격이 지원 자격의 전제. 현실적 주력은 수능 정시 또는 논술',
    need: ['고졸 검정고시 합격', '수능 (정시) 또는 논술 준비', '(대학에 따라) 공인영어·서류'],
    pros: ['학비 부담이 훨씬 작다', '가족과 함께 지낼 수 있다'],
    cons: [
      '생활기록부·내신이 없어 학생부교과는 사실상 막힌다',
      '학생부종합도 가능 대학이 적다 (서울대 일반전형은 검정고시 합격자를 자격에 명시)',
      'LIS 커리큘럼과 수능 국어·수학·탐구의 접점이 거의 없어 별도 트랙을 이중으로 져야 한다',
    ],
  },
  {
    key: 'special',
    title: 'C · 재외국민 특례',
    emoji: '🚫',
    verdict: '불가능',
    tone: 'bad',
    summary: '3년·12년 특례 모두 "해외에서 이수" 요건 — 국내 국제학교는 인정되지 않는다',
    need: [],
    pros: [],
    cons: ['한 학기라도 국내 재학 기록이 있으면 12년 특례 자격은 즉시 상실된다', '이 경로는 처음부터 선택지가 아니다'],
  },
]

// ── 2. 하울 관심사 기반 학과 추천
// (앱에 이미 SAT·수학영어·과학영어·축구영어·랩음악영어 카테고리가 있다)
export const MAJORS = [
  {
    key: 'cs',
    name: '컴퓨터공학 · 소프트웨어',
    emoji: '💻',
    why: '수학 + 논리. 경시대회 공부가 그대로 이어진다',
    subjects: ['수학(미적분)', '물리', '정보'],
    usaNote: 'CS는 미국대에서 가장 경쟁이 센 전공군. 별도 정원·별도 심사인 학교가 많다',
    korNote: '정시 기준 상위권. 수학 비중이 큰 대학이 많다',
  },
  {
    key: 'ds',
    name: '데이터사이언스 · 통계',
    emoji: '📊',
    why: '수학·통계 중심. CS보다 문턱이 조금 낮은 편',
    subjects: ['수학(확률과통계)', '미적분'],
    usaNote: '최근 신설이 많아 상대적으로 기회가 있다',
    korNote: '신설 학과가 많아 첫 해 입결이 낮게 잡히는 경우가 있다',
  },
  {
    key: 'ie',
    name: '산업공학 · 경영과학',
    emoji: '⚙️',
    why: '수학을 쓰되 사람·조직 문제를 다룬다',
    subjects: ['수학', '경제'],
    usaNote: 'Industrial Engineering / Operations Research',
    korNote: '공대 안에서 상대적으로 접근이 수월한 편',
  },
  {
    key: 'bus',
    name: '경영 · 경제',
    emoji: '📈',
    why: '영어 실력이 그대로 강점이 된다',
    subjects: ['수학', '영어', '경제'],
    usaNote: '학부 경영(Business)은 별도 지원인 학교가 많다 (Wharton, Ross 등)',
    korNote: '논술전형 문이 비교적 넓다',
  },
  {
    key: 'sport',
    name: '스포츠과학 · 스포츠경영',
    emoji: '⚽',
    why: '축구 관심 + 과학/데이터. 선수가 아니어도 갈 수 있다',
    subjects: ['생명과학', '체육', '통계'],
    usaNote: 'Sport Management / Kinesiology',
    korNote: '실기 없는 이론 트랙이 있는 대학을 확인할 것',
  },
  {
    key: 'music',
    name: '실용음악 · 음악산업',
    emoji: '🎤',
    why: '랩·음악 관심을 살리는 길. 다만 실기 준비가 별도로 크다',
    subjects: ['실기', '음악이론'],
    usaNote: 'Music Business / Music Technology 는 실기 비중이 낮은 편',
    korNote: '실용음악과는 실기 경쟁률이 매우 높다. 병행보다는 선택의 문제',
  },
]

// ── 3. 대학별 참고 기준
// ⚠️ 숫자는 공개 자료 기반의 대략적인 범위이며 해마다 바뀐다.
export const SCHOOLS_USA = [
  { name: 'UCLA', type: '주립 · 캘리포니아', sat: '1440–1560', toefl: '100+', gpa: '4.0+ (가중)', note: 'LIS가 밝힌 진학 실적에 포함. UC는 공통지원서(UC App) 별도, 추천서 없음' },
  { name: 'Boston College', type: '사립 · 매사추세츠', sat: '1420–1520', toefl: '100+', gpa: '3.8+', note: '가톨릭 계열 · 리버럴아츠 성격이 강함' },
  { name: 'Northeastern University', type: '사립 · 보스턴', sat: '1450–1540', toefl: '100+', gpa: '4.0+', note: 'co-op(현장실습) 프로그램이 강점' },
  { name: 'Purdue University', type: '주립 · 인디애나', sat: '1250–1470', toefl: '88+', gpa: '3.6+', note: '공대가 강하고 주립이라 학비가 상대적으로 낮다' },
  { name: 'Texas A&M', type: '주립 · 텍사스', sat: '1180–1400', toefl: '80+', gpa: '3.5+', note: '공대·농생명 강세' },
  { name: 'Ohio State University', type: '주립 · 오하이오', sat: '1260–1440', toefl: '79+', gpa: '3.7+', note: '규모가 크고 전공 선택폭이 넓다' },
  { name: 'Rutgers University', type: '주립 · 뉴저지', sat: '1230–1440', toefl: '79+', gpa: '3.5+', note: '뉴욕 인접. 한국 학생이 많다' },
  { name: 'University of Iowa', type: '주립 · 아이오와', sat: '1130–1350', toefl: '80+', gpa: '3.4+', note: 'LIS 실적에 장학 $12,000/년 사례 언급' },
  { name: 'University of South Florida', type: '주립 · 플로리다', sat: '1180–1350', toefl: '79+', gpa: '3.5+', note: 'LIS 실적에 장학 $11,000/년 사례 언급' },
  { name: 'RISD / School of the Art Institute of Chicago', type: '예술 사립', sat: '선택 또는 미제출', toefl: '93+ / 85+', gpa: '3.3+', note: '포트폴리오가 결정적. 성적 비중이 상대적으로 낮다' },
]

export const SCHOOLS_KOR = [
  { name: '서울대', track: '정시 · 학생부종합(일반전형)', note: '일반전형 지원자격에 검정고시 합격자를 명시. 정시는 수능 중심 + 교과평가', level: '최상위' },
  { name: '연세대 · 고려대', track: '정시 · 논술', note: '논술은 검정고시 출신도 지원 가능한 경우가 많다. 수능 최저 확인 필수', level: '최상위' },
  { name: '성균관대 · 한양대 · 서강대', track: '정시 · 논술', note: '논술 문이 비교적 넓다. 자연계는 수학·과학 논술', level: '상위' },
  { name: '중앙대 · 경희대 · 외대 · 시립대', track: '정시 · 논술', note: '논술 모집인원이 많은 편', level: '상위' },
  { name: '건국대 · 동국대 · 홍익대', track: '정시 · 논술', note: '수능 최저가 없는 논술전형이 있는 해도 있다 — 매년 확인', level: '중상위' },
  { name: '국민대 · 숭실대 · 세종대', track: '정시', note: '정시 비중이 커서 검정고시 출신에게 불리함이 적다', level: '중상위' },
  { name: '한국체육대 · 용인대', track: '정시 · 실기', note: '스포츠 계열. 실기 없는 이론 전공 여부를 확인', level: '특성' },
  { name: '한국예술종합학교 · 동아방송예술대', track: '실기 위주', note: '실용음악은 실기 비중이 절대적', level: '특성' },
]

// ── 4. 준비 타임라인 (미국 학제 기준)
export const TIMELINE = [
  { when: 'Grade 10 (10학년)', items: ['GPA 관리 시작 — 미국대는 9~11학년 성적을 본다', 'SAT는 아직 이르다. 영어 독해량 늘리기', '관심 분야 활동 1~2개 정하기 (축구 · 음악 · 수학 경시)'] },
  { when: 'Grade 11 상반기', items: ['SAT 1차 응시 (진단 목적)', 'TOEFL 1차 응시', 'AP 개설 과목이 있으면 신청'] },
  { when: 'Grade 11 하반기', items: ['SAT 2차·3차 — 목표 점수 확보', '지원 대학 리스트 12~15곳 확정 (안정 · 적정 · 도전)', '여름 활동 · 캠프 · 대회 참가'] },
  { when: 'Grade 12 8~11월', items: ['Common App 작성 · 에세이 완성', '추천서 요청 (최소 6주 전)', 'Early Decision / Early Action 마감 (11/1, 11/15)'] },
  { when: 'Grade 12 12~1월', items: ['Regular Decision 마감 (대개 1/1~1/15)', 'CSS Profile · 장학 서류', '(국내대 병행 시) 검정고시 4월 시험 접수 준비'] },
  { when: 'Grade 12 3~5월', items: ['합격 발표 · 장학 비교', '5/1 등록 결정 (미국 대학 공통 마감일)', '비자(I-20 → F-1) 준비'] },
]

// ── 5. 국내대 병행 시 검정고시 일정
export const GED_INFO = {
  name: '고졸 검정고시',
  rounds: ['1회 — 매년 4월경 시행 (2월 접수)', '2회 — 매년 8월경 시행 (6월 접수)'],
  subjects: ['국어', '수학', '영어', '사회', '과학', '한국사', '선택 1과목(도덕·기술가정·체육·음악·미술 중)'],
  pass: '각 과목 100점 만점에 60점 이상, 전 과목 평균 60점 이상이면 합격',
  note: '과목별 합격(과목 면제)이 인정되므로 한 번에 다 못 붙어도 다음 회차에 남은 과목만 보면 된다. 시행 일정·과목은 시·도 교육청 공고로 매번 확인할 것.',
}

// ── 6. 학교에 확인해야 할 것 (조사 메모 5장)
export const ASK_SCHOOL = [
  { q: '하울이 미국 학제로 몇 학년인가? (Grade 10? 11?)', why: '8월 시작이라 한국 고1과 어긋난다. 남은 시간이 1년 차이 난다', priority: true },
  { q: '국제반 / 국내반 중 어디인가, 아직이면 결정 시점은?', why: '모든 계획의 분기점', priority: true },
  { q: 'AP 개설 여부 · GPA 산출 방식 · 카운슬러가 Common App / 추천서 / School Profile을 실제로 처리해주는가?', why: '미국대 지원의 실무가 학교에서 되는지 여부' },
  { q: '국내반이 검정고시를 지도하는가, 각자 알아서인가?', why: '국내대 경로의 실행 가능성' },
  { q: 'MSA 인증서 유효기간 · 디렉토리 등재 여부 (사본 요청)', why: '인증은 갱신 주기가 있어 만료될 수 있다' },
  { q: '최근 3년 "실제 등록" 기준 진학 명단', why: '합격과 등록은 다르다. 입결 과장이 업계에서 반복 지적된다' },
  { q: '학비 (학기별 · 추가비용 포함)', why: '해외대 학비와 합산해 총비용을 봐야 한다' },
]

// ── 7. 용어집
export const GLOSSARY = [
  ['GPA', '고교 내신 평균. 미국대는 보통 9~11학년을 본다'],
  ['SAT / ACT', '미국 대학 표준화 시험. 둘 중 하나만 내면 된다'],
  ['Common App', '미국 대학 공통지원서. 한 번 쓰면 여러 학교에 낸다 (UC 계열은 별도)'],
  ['ED / EA', 'Early Decision(합격 시 등록 의무) / Early Action(의무 없음)'],
  ['Transcript', '학교가 발급하는 공식 성적증명서'],
  ['MSA-CESS', '미국 중부교육위원회 인증. 학교 품질 인증이지 정부 인가(license)가 아니다'],
  ['검정고시', '학력 인정 시험. 합격해야 국내 대학 지원 자격이 생긴다'],
  ['수능 최저', '수시(논술 등)에서 요구하는 수능 최소 등급 조건'],
]
