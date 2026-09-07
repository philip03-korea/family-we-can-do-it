// 하울 진학 가이드 — 한국 대학 글로벌·국제학부 중심.
//
// 전제 (2026-09-07 가족 확인):
//   하울은 국내 국제학교(등대글로벌스쿨, 미인가)에 다닌다.
//   → 한국에서 고졸 학력이 아니므로 「고졸 검정고시」로 지원자격을 만든 뒤
//     글로벌·국제학부의 수시 국제계열 전형에 지원하는 경로다.
//   → 재외국민 특별전형(해외 이수)·외국인 전형(외국 국적)은 해당되지 않는다.
//
// ⚠️ 전형명·어학기준·학과 구성은 해마다 바뀐다. 여기 적힌 건 방향을 잡기 위한
//    참고이고, 실제 지원 전에는 그해 모집요강과 입학처 확인이 반드시 필요하다.
//    특히 「검정고시 출신이 그 전형에 지원 가능한가」는 대학마다 다르다.

export const DISCLAIMER =
  '전형명·어학기준·학과 구성은 해마다 바뀝니다. 방향을 잡는 참고용이고, 지원 전에는 그해 모집요강과 입학처 확인이 꼭 필요해요.'

export const KEY_WARNING =
  '검정고시 출신이 그 전형에 지원할 수 있는지는 대학마다 다릅니다. 관심 대학은 입학처에 직접 물어보세요.'

// ── 지원자격: 세 갈래 중 하울이 어디에 해당하는지
export const ELIGIBILITY = [
  {
    key: 'ged',
    title: '① 국내 학력 인정 — 고졸 검정고시',
    emoji: '✅',
    tone: 'ok',
    mine: true,
    summary: '하울의 경로. 검정고시에 합격하면 「고교 졸업자와 동등 이상의 학력」이 되어 지원자격이 생긴다',
    detail: [
      'LIS는 초중등교육법상 학교가 아니라 졸업장만으로는 한국에서 고졸 학력이 아니다',
      '검정고시는 걸림돌이 아니라 지원자격을 만드는 티켓이다 — 합격하면 수시·정시 모두 문이 열린다',
      '생활기록부·내신이 없으므로 학생부교과는 사실상 막히지만, 국제계열 수시는 원래 그 비중이 낮다',
    ],
  },
  {
    key: 'overseas',
    title: '② 재외국민 특별전형',
    emoji: '🚫',
    tone: 'bad',
    mine: false,
    summary: '해외에서 이수한 경우에만 해당. 국내 소재 국제학교 재학은 인정되지 않는다',
    detail: [
      '3년 특례·12년 특례 모두 「해외에서 이수」가 요건이다',
      '한 학기라도 국내 재학 기록이 있으면 12년 특례 자격은 즉시 사라진다',
      '만약 앞으로 해외 학교로 옮긴다면 그때 다시 따져볼 경로다',
    ],
  },
  {
    key: 'foreign',
    title: '③ 외국인 특별전형',
    emoji: '🚫',
    tone: 'bad',
    mine: false,
    summary: '본인과 부모가 모두 외국 국적일 때만 해당',
    detail: ['하울은 한국 국적이므로 해당되지 않는다'],
  },
]

// ── 국제계열 수시가 하울에게 맞는 이유
export const WHY_GLOBAL = {
  title: '왜 글로벌·국제학부인가',
  points: [
    { emoji: '🗣', text: '수업이 대부분 영어다. LIS에서 3년 쌓은 영어가 그대로 강점이 된다' },
    { emoji: '📝', text: '내신·생기부 비중이 낮고 어학성적·에세이·면접 비중이 크다 — 검정고시 출신에게 상대적으로 유리한 구조' },
    { emoji: '🌏', text: 'LIS의 토론·글쓰기 중심 커리큘럼이 국제학부 과제 방식과 이어진다' },
    { emoji: '⚖️', text: '다만 어학성적은 명확한 숫자로 요구되는 경우가 많다. TOEFL은 미국대와 한국 글로벌학부 양쪽에 쓰이니 먼저 확보할 것' },
  ],
}

// ── 학과 계열 (「학과」 탭에서 역으로 대학을 찾는 용도)
export const MAJOR_GROUPS = [
  { key: 'intl', name: '국제·정치', emoji: '🌏', desc: '국제학 · 통상 · 개발협력 · 정치외교' },
  { key: 'biz', name: '경제·경영', emoji: '📈', desc: '경제 · 경영 · 금융 · 물류' },
  { key: 'sci', name: '이공·융합', emoji: '🔬', desc: '공학 · 생명 · 데이터 · AI' },
  { key: 'hum', name: '인문·문화', emoji: '📚', desc: '문학 · 지역학 · 문화연구' },
  { key: 'tech', name: '기술·디자인', emoji: '🎨', desc: '기술경영 · 인터랙션 디자인 · 컬처테크' },
]

// ── 대학 (첫 화면). 대학을 누르면 그 대학에서 갈 수 있는 학과가 나온다.
export const UNIVERSITIES = [
  {
    key: 'yonsei',
    name: '연세대학교',
    college: '언더우드국제대학 (UIC)',
    en: 'Underwood International College',
    campus: '국제캠퍼스(송도) · 신촌',
    color: '#0033a0',
    tier: '최상위',
    lang: '전 과목 영어 강의',
    scale: '국내 글로벌학부 중 규모가 가장 크다 (3개 학부)',
    tracks: ['수시 국제계열 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: 'TOEFL iBT 100 안팎이 경쟁력 (참고)',
    fit: '하울에게 1순위. 인문사회부터 이공까지 다 있어서 전공을 늦게 정해도 된다',
    check: [
      '검정고시 출신이 UIC 국제계열 수시에 지원 가능한지',
      '어학성적을 지원자격으로 요구하는지, 반영 요소인지',
      '송도 캠퍼스 기숙사 의무 여부',
    ],
    majors: [
      { name: '국제학', en: 'International Studies', group: 'intl', note: 'UIC의 대표 전공' },
      { name: '정치외교학', en: 'Political Science & International Relations', group: 'intl' },
      { name: '지속개발협력', en: 'Sustainable Development & Cooperation', group: 'intl' },
      { name: '경제학', en: 'Economics', group: 'biz' },
      { name: '계량위험관리', en: 'Quantitative Risk Management', group: 'biz', hot: true, note: '수학·통계로 금융 위험을 다룬다 — 하울 수학 관심과 직결' },
      { name: '나노과학공학', en: 'Nano Science & Engineering', group: 'sci', hot: true },
      { name: '에너지환경융합', en: 'Energy & Environmental Science & Engineering', group: 'sci' },
      { name: '생명융합', en: 'Bio-convergence', group: 'sci', hot: true },
      { name: '비교문학과문화', en: 'Comparative Literature & Culture', group: 'hum' },
      { name: '아시아학', en: 'Asian Studies', group: 'hum' },
      { name: '창의기술경영', en: 'Creative Technology Management', group: 'tech' },
      { name: '문화디자인경영', en: 'Culture & Design Management', group: 'tech' },
      { name: '정보인터랙션디자인', en: 'Information & Interaction Design', group: 'tech' },
    ],
  },
  {
    key: 'korea',
    name: '고려대학교',
    college: '국제학부 (DIS)',
    en: 'Division of International Studies',
    campus: '안암(서울)',
    color: '#8c1a3d',
    tier: '최상위',
    lang: '100% 영어 강의',
    scale: '국제학 단일 학부 — 전공이 하나로 모여 있다',
    tracks: ['수시 국제계열 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: 'TOEFL iBT 100 안팎이 경쟁력 (참고)',
    fit: '국제관계·통상 쪽이 확실하면 좋은 선택. 다만 이공 전공은 없다',
    check: [
      '검정고시 출신 지원 가능 여부',
      '어학성적 최저 기준이 있는지',
      '입학 후 이중전공으로 이공계를 할 수 있는지',
    ],
    majors: [
      { name: '국제통상', en: 'International Commerce', group: 'intl' },
      { name: '국제개발협력', en: 'International Development & Cooperation', group: 'intl' },
      { name: '국제평화안보', en: 'International Peace & Security', group: 'intl' },
      { name: '지역학 (동아시아·한국학)', en: 'Regional Studies', group: 'hum' },
    ],
  },
  {
    key: 'skku',
    name: '성균관대학교',
    college: '글로벌 계열 학부',
    en: 'Global Programs',
    campus: '인문사회(명륜) · 자연과학(수원)',
    color: '#00593f',
    tier: '상위',
    lang: '학부별로 영어 강의 비중이 높다',
    scale: '글로벌 이름이 붙은 학부가 여럿 — 이공까지 폭이 넓다',
    tracks: ['수시 국제계열·글로벌 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: '학부마다 기준이 다르다 (참고)',
    fit: '이공 쪽으로 기울면 글로벌바이오메디컬공학·글로벌융합학부가 강력하다',
    check: [
      '글로벌 계열 각 학부의 검정고시 지원 가능 여부',
      '학부별 영어 강의 비중이 실제로 얼마나 되는지',
    ],
    majors: [
      { name: '글로벌리더학부', en: 'Global Leader', group: 'intl', note: '사회과학 중심' },
      { name: '글로벌경제학과', en: 'Global Economics', group: 'biz' },
      { name: '글로벌경영학과', en: 'Global Business Administration', group: 'biz' },
      { name: '글로벌바이오메디컬공학과', en: 'Global Biomedical Engineering', group: 'sci', hot: true, note: '이 학교 이공 글로벌 트랙의 간판' },
      { name: '글로벌융합학부 — 데이터사이언스', en: 'Data Science', group: 'sci', hot: true },
      { name: '글로벌융합학부 — 인공지능', en: 'Artificial Intelligence', group: 'sci', hot: true },
      { name: '글로벌융합학부 — 컬처앤테크놀로지', en: 'Culture & Technology', group: 'tech', note: '음악·콘텐츠 관심과 이어진다' },
    ],
  },
  {
    key: 'hanyang',
    name: '한양대학교',
    college: '국제학부 (DIS)',
    en: 'Division of International Studies',
    campus: '서울(행당)',
    color: '#0e4194',
    tier: '상위',
    lang: '영어 강의 중심',
    scale: '국제학 단일 학부',
    tracks: ['수시 국제계열 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: 'TOEFL iBT 90~100 안팎 (참고)',
    fit: '서울 도심 캠퍼스. 공대가 강해 이중전공으로 넓히기 좋다',
    check: ['검정고시 출신 지원 가능 여부', '공대 이중전공·복수전공 가능 여부'],
    majors: [
      { name: '국제학', en: 'International Studies', group: 'intl' },
      { name: '국제정치·통상', en: 'International Politics & Commerce', group: 'intl' },
    ],
  },
  {
    key: 'sogang',
    name: '서강대학교',
    college: '국제인문학부',
    en: 'School of International Humanities',
    campus: '신촌(서울)',
    color: '#96172e',
    tier: '상위',
    lang: '영어 강의 비중이 높다',
    scale: '어문·지역 문화 중심',
    tracks: ['수시 국제계열 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: '전형별 상이 (참고)',
    fit: '문학·문화 쪽 관심이 있으면. 이공 지망이면 우선순위가 낮다',
    check: ['검정고시 출신 지원 가능 여부', '전공 배정 방식(입학 후 선택인지)'],
    majors: [
      { name: '영미문화계', en: 'American Culture', group: 'hum' },
      { name: '유럽문화계', en: 'European Culture', group: 'hum' },
      { name: '중국문화계', en: 'Chinese Culture', group: 'hum' },
    ],
  },
  {
    key: 'hufs',
    name: '한국외국어대학교',
    college: '국제학부 · LD · LT 학부',
    en: 'Division of International Studies',
    campus: '서울 · 글로벌(용인)',
    color: '#00447c',
    tier: '상위',
    lang: '영어 강의 + 제2외국어',
    scale: '외국어 특화 — 언어를 하나 더 얹고 싶을 때',
    tracks: ['수시 국제계열 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: '전형별 상이 (참고)',
    fit: '영어에 언어를 하나 더 붙이고 싶다면. LD·LT는 소수정예 특성화 학부다',
    check: ['검정고시 출신 지원 가능 여부', 'LD·LT 학부의 선발 규모와 경쟁률'],
    majors: [
      { name: '국제학', en: 'International Studies', group: 'intl' },
      { name: 'LD학부 (언어·외교)', en: 'Language & Diplomacy', group: 'intl', note: '외교관 지망 특화' },
      { name: 'LT학부 (언어·통상)', en: 'Language & Trade', group: 'biz', note: '통상·무역 특화' },
    ],
  },
  {
    key: 'khu',
    name: '경희대학교',
    college: '국제학과',
    en: 'Department of International Studies',
    campus: '국제캠퍼스(용인)',
    color: '#8b1e3f',
    tier: '중상위',
    lang: '영어 강의 중심',
    scale: '학과 단위',
    tracks: ['수시 국제계열 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: '전형별 상이 (참고)',
    fit: '안정 지원 후보로 넣어둘 만하다',
    check: ['검정고시 출신 지원 가능 여부', '국제캠퍼스 통학·기숙 여건'],
    majors: [{ name: '국제학', en: 'International Studies', group: 'intl' }],
  },
  {
    key: 'cau',
    name: '중앙대학교',
    college: '글로벌 계열 전공',
    en: 'Global Programs',
    campus: '서울(흑석)',
    color: '#0b3d91',
    tier: '중상위',
    lang: '전공별 영어 강의',
    scale: '물류·금융 등 실무 색이 강하다',
    tracks: ['수시 국제계열 전형', '재외국민·외국인 특별전형(하울은 해당 없음)'],
    english: '전형별 상이 (참고)',
    fit: '경영·물류 쪽 실무를 보고 싶다면',
    check: ['검정고시 출신 지원 가능 여부', '글로벌금융전공 선발 방식'],
    majors: [
      { name: '국제물류학과', en: 'International Logistics', group: 'biz' },
      { name: '글로벌금융전공', en: 'Global Finance', group: 'biz' },
    ],
  },
  {
    key: 'kaist',
    name: 'KAIST',
    college: '무학과 입학 (새내기과정)',
    en: 'Korea Advanced Institute of Science and Technology',
    campus: '대전',
    color: '#004191',
    tier: '최상위 (이공)',
    lang: '전 과목 영어 강의',
    scale: '1학년은 전공 없이 입학해 2학년에 고른다',
    tracks: ['수시 일반전형·특기자전형', '외국인 전형(하울은 해당 없음)'],
    english: '영어 강의를 따라갈 수준이 전제 (참고)',
    fit: '이공 지망이면 최상위 선택지. 전 과목 영어라 LIS 배경이 오히려 유리하다. 수학 경시 실적이 그대로 쓰인다',
    check: [
      '검정고시 출신 지원 가능 여부 (이 학교는 특히 확인 필요)',
      '수학·과학 경시 실적을 어떻게 반영하는지',
      '학비·장학 제도 (국가 지원이 크다)',
    ],
    majors: [
      { name: '전산학부', en: 'Computer Science', group: 'sci', hot: true },
      { name: '수리과학과', en: 'Mathematical Sciences', group: 'sci', hot: true },
      { name: '물리학과', en: 'Physics', group: 'sci' },
      { name: '생명과학과', en: 'Biological Sciences', group: 'sci' },
      { name: '산업및시스템공학과', en: 'Industrial & Systems Engineering', group: 'sci' },
      { name: '기술경영학부', en: 'Business & Technology Management', group: 'tech' },
    ],
  },
  {
    key: 'unist',
    name: 'UNIST',
    college: '이공계 무학과 입학',
    en: 'Ulsan National Institute of Science and Technology',
    campus: '울산',
    color: '#005596',
    tier: '상위 (이공)',
    lang: '전 과목 영어 강의',
    scale: '1학년 무학과 후 전공 선택',
    tracks: ['수시 일반전형', '외국인 전형(하울은 해당 없음)'],
    english: '영어 강의를 따라갈 수준이 전제 (참고)',
    fit: 'KAIST와 같은 구조에 문턱이 조금 낮다. 이공 지망의 안정 후보',
    check: ['검정고시 출신 지원 가능 여부', '기숙사·장학 제도'],
    majors: [
      { name: '컴퓨터공학', en: 'Computer Science & Engineering', group: 'sci', hot: true },
      { name: '인공지능', en: 'Artificial Intelligence', group: 'sci', hot: true },
      { name: '기계공학', en: 'Mechanical Engineering', group: 'sci' },
      { name: '생명과학', en: 'Biological Sciences', group: 'sci' },
      { name: '디자인학', en: 'Design', group: 'tech' },
    ],
  },
]

// 학과 계열별로 「어느 대학에서 배울 수 있는지」 역참조
export function majorsByGroup(groupKey) {
  const out = []
  for (const u of UNIVERSITIES) {
    for (const m of u.majors) {
      if (m.group === groupKey) out.push({ ...m, univKey: u.key, univName: u.name, univColor: u.color })
    }
  }
  return out
}

export function universityOf(key) {
  return UNIVERSITIES.find((u) => u.key === key)
}

// ── 해외(미국) 대학 — 두 번째 경로로 계속 열어둔다
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
]

// ── 준비 일정 (검정고시 + 글로벌학부 수시 기준)
export const TIMELINE = [
  {
    when: '지금 ~ 검정고시 전',
    emoji: '📗',
    items: [
      '고졸 검정고시 준비 — 앱의 「문제은행 → 검정고시」로 과목별 감을 잡는다',
      'TOEFL 점수 확보 시작 (한국 글로벌학부·미국대 양쪽에 쓰인다)',
      '어느 대학의 어느 전형이 검정고시 출신을 받는지 입학처에 확인',
    ],
  },
  {
    when: '검정고시 4월 회차',
    emoji: '✏️',
    items: ['2월경 접수 · 4월경 시행', '과목별 합격이 남으므로 한 번에 다 못 붙어도 8월 회차에 남은 과목만'],
  },
  {
    when: '검정고시 8월 회차',
    emoji: '✏️',
    items: ['6월경 접수 · 8월경 시행', '수시 원서 접수(9월) 전에 합격증이 나와야 하므로 늦어도 이 회차까지 끝낸다'],
  },
  {
    when: '고3 해당 연도 6~8월',
    emoji: '📄',
    items: [
      'TOEFL 목표 점수 확정 (대체로 iBT 100 안팎이 경쟁력)',
      '자기소개서·에세이 초안 — 국제계열은 글이 크게 작용한다',
      '지원 대학 6곳 확정 (수시는 6회 제한)',
    ],
  },
  {
    when: '9월',
    emoji: '📮',
    items: ['수시 원서 접수 (대개 9월 초중순)', '검정고시 합격증·성적증명서 준비'],
  },
  {
    when: '10~12월',
    emoji: '🎤',
    items: ['면접·구술고사 (국제계열은 영어 면접이 흔하다)', '수능 최저가 걸린 전형이면 수능 응시', '12월 수시 합격 발표'],
  },
]

// ── 검정고시
export const GED_INFO = {
  name: '고졸 검정고시',
  rounds: ['1회 — 매년 4월경 시행 (2월경 접수)', '2회 — 매년 8월경 시행 (6월경 접수)'],
  subjects: ['국어', '수학', '영어', '사회', '과학', '한국사', '선택 1과목(도덕·기술가정·체육·음악·미술 중)'],
  pass: '각 과목 100점 만점에 60점 이상, 전 과목 평균 60점 이상이면 합격',
  note: '과목별 합격(과목 면제)이 인정되므로 한 번에 다 못 붙어도 다음 회차에 남은 과목만 보면 된다. 수시 원서 접수 전에 합격증이 나와야 하니 늦어도 8월 회차까지는 끝낼 것. 시행 일정·과목은 시·도 교육청 공고로 매번 확인.',
}

// ── 학교·입학처에 확인해야 할 것
export const ASK_SCHOOL = [
  {
    q: '관심 대학 입학처에 — 검정고시 출신이 그 국제계열 전형에 지원할 수 있는가?',
    why: '대학마다 다르다. 이 한 가지가 지원 가능 대학 목록을 결정한다',
    to: '각 대학 입학처',
    priority: true,
  },
  {
    q: '하울이 미국 학제로 몇 학년인가? (Grade 10? 11?)',
    why: 'LIS는 8월 시작이라 한국 고1과 어긋난다. 남은 준비 시간이 1년 차이 난다',
    to: '등대글로벌스쿨 031-971-2731',
    priority: true,
  },
  {
    q: '국제계열 전형이 요구하는 어학성적 기준과 반영 방식은?',
    why: '지원자격인지 점수 반영인지에 따라 TOEFL 목표가 달라진다',
    to: '각 대학 입학처',
  },
  {
    q: '학교가 검정고시를 지도하는가, 각자 알아서인가?',
    why: '국내대 경로의 실행 가능성이 여기서 갈린다',
    to: '등대글로벌스쿨',
  },
  {
    q: '국제반 / 국내반 중 어디인가, 아직이면 결정 시점은?',
    why: '미국대를 병행할지 정하는 분기점',
    to: '등대글로벌스쿨',
  },
  {
    q: 'MSA 인증서 유효기간 · 디렉토리 등재 여부 (사본 요청)',
    why: '미국대 지원 시 성적표 인정의 근거. 인증은 갱신 주기가 있어 만료될 수 있다',
    to: '등대글로벌스쿨',
  },
  {
    q: '최근 3년 「실제 등록」 기준 진학 명단',
    why: '합격과 등록은 다르다. 입결 과장이 업계에서 반복 지적된다',
    to: '등대글로벌스쿨',
  },
]

// ── 용어집
export const GLOSSARY = [
  ['검정고시', '학력 인정 시험. 합격해야 한국 대학 지원 자격이 생긴다'],
  ['수시 / 정시', '수시는 9월 원서·서류와 면접 중심(6회 제한), 정시는 12월 원서·수능 성적 중심'],
  ['국제계열 전형', '글로벌·국제학부가 쓰는 수시 전형. 어학성적·에세이·면접 비중이 크다'],
  ['재외국민 특별전형', '해외에서 이수한 학생 대상. 국내 국제학교 재학은 해당되지 않는다'],
  ['수능 최저', '수시에서 요구하는 수능 최소 등급 조건. 전형에 따라 없기도 하다'],
  ['이중전공 / 복수전공', '입학 후 다른 학과를 함께 전공하는 제도. 국제학부생이 공대를 얹는 식'],
  ['TOEFL iBT', '영어 시험. 한국 글로벌학부와 미국 대학 양쪽에 쓰인다'],
  ['GPA / Transcript', '고교 내신 평균과 학교가 발급하는 공식 성적증명서. 미국대 지원의 핵심 서류'],
]
