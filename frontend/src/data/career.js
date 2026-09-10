import { VERIFIED_SCHOOLS, HAUL_STEPS, HAUL_CHECKS, verifiedContext } from './admissions2027.js'
// 대학별 공식 확인 결과는 admissions2027.js에서 관리한다.
// 전공 탐색 목록의 기존 내용과 검증된 지원 조건은 구분해서 표시한다.

export const DISCLAIMER =
  '전형명·어학기준·학과 구성은 해마다 바뀝니다. 방향을 잡는 참고용이고, 지원 전에는 그해 모집요강과 입학처 확인이 꼭 필요해요.'

export const KEY_WARNING =
  '검정고시 출신이 그 전형에 지원할 수 있는지는 대학마다 다릅니다. 관심 대학은 입학처에 직접 물어보세요.'

// ── 지원자격: 세 갈래 중 하울이 어디에 해당하는지
export const ELIGIBILITY = [
 {key:'ged',title:'① 학력 인정과 검정고시 경로 확인',emoji:'📋',tone:'info',mine:true,summary:'LIS 졸업장 발급 기관·국내 학력 인정 여부를 확인한 뒤 대학별 지원 자격을 판단한다',detail:['국내 소재 국제학교의 미국 졸업장을 해외 소재 고등학교 졸업과 동일하게 보지 않는다','해당 대학이 졸업장만으로 지원 자격을 인정하지 않으면 검정고시 경로를 검토한다','검정고시 지원 가능 전형과 대체서류·교과성적 환산 방식은 대학마다 다르다']},
 {key:'overseas',title:'② 재외국민 특별전형',emoji:'🌏',tone:'warn',mine:false,summary:'실제 해외 이수·체류·국적 등 해당 전형의 요건을 별도로 확인한다',detail:['국내 학교에서 외국 교육과정을 이수했다는 사실만으로 자격이 생기지 않는다','본인과 부모의 이력 및 지원 연도 요강의 예외 규정을 입학처에 확인한다']},
 {key:'foreign',title:'③ 외국인 전형',emoji:'🎫',tone:'warn',mine:false,summary:'국적·교육과정 요건을 충족하는 경우의 별도 전형',detail:['현재 가족의 국적 이력을 새로 확인하지 않았으므로 개인 자격을 단정하지 않는다']},
]
export const WHY_GLOBAL = {title:'글로벌·국제학부를 준비하는 이유',points:[
 {emoji:'🗣',text:'영어로 읽고 토론하는 수업 경험을 면접·대학 수업 준비에 연결한다'},
 {emoji:'🔎',text:'국제학부라는 이름만으로 영어성적 중심 선발이라고 판단하지 않는다'},
 {emoji:'📝',text:'탐구 과정과 학업 역량을 대학이 허용하는 서류에 담는다'},
 {emoji:'⚖️',text:'SAT·TOEFL 제출 허용 여부부터 확인한다. 성적이 있어도 받지 않는 전형이 있다'},
]}

// ── 학과 계열 (「학과」 탭에서 역으로 대학을 찾는 용도)
export const MAJOR_GROUPS = [
  { key: 'intl', name: '국제·정치', emoji: '🌏', desc: '국제학 · 통상 · 개발협력 · 정치외교' },
  { key: 'biz', name: '경제·경영', emoji: '📈', desc: '경제 · 경영 · 금융 · 물류' },
  { key: 'sci', name: '이공·융합', emoji: '🔬', desc: '공학 · 생명 · 데이터 · AI' },
  { key: 'hum', name: '인문·문화', emoji: '📚', desc: '문학 · 지역학 · 문화연구' },
  { key: 'tech', name: '기술·디자인', emoji: '🎨', desc: '기술경영 · 인터랙션 디자인 · 컬처테크' },
]

// ── 대학 (첫 화면). 대학을 누르면 그 대학에서 갈 수 있는 학과가 나온다.
const EXPLORATION_UNIVERSITIES = [
  {
    "key": "yonsei",
    "name": "연세대학교",
    "college": "언더우드국제대학 (UIC)",
    "en": "Underwood International College",
    "campus": "국제캠퍼스(송도) · 신촌",
    "color": "#0033a0",
    "lang": "전 과목 영어 강의",
    "scale": "국내 글로벌학부 중 규모가 가장 크다 (3개 학부)",
    "majors": [
      {
        "name": "국제학",
        "en": "International Studies",
        "group": "intl",
        "note": "UIC의 대표 전공"
      },
      {
        "name": "정치외교학",
        "en": "Political Science & International Relations",
        "group": "intl"
      },
      {
        "name": "지속개발협력",
        "en": "Sustainable Development & Cooperation",
        "group": "intl"
      },
      {
        "name": "경제학",
        "en": "Economics",
        "group": "biz"
      },
      {
        "name": "계량위험관리",
        "en": "Quantitative Risk Management",
        "group": "biz",
        "hot": true,
        "note": "수학·통계로 금융 위험을 다룬다 — 하울 수학 관심과 직결"
      },
      {
        "name": "나노과학공학",
        "en": "Nano Science & Engineering",
        "group": "sci",
        "hot": true
      },
      {
        "name": "에너지환경융합",
        "en": "Energy & Environmental Science & Engineering",
        "group": "sci"
      },
      {
        "name": "생명융합",
        "en": "Bio-convergence",
        "group": "sci",
        "hot": true
      },
      {
        "name": "비교문학과문화",
        "en": "Comparative Literature & Culture",
        "group": "hum"
      },
      {
        "name": "아시아학",
        "en": "Asian Studies",
        "group": "hum"
      },
      {
        "name": "창의기술경영",
        "en": "Creative Technology Management",
        "group": "tech"
      },
      {
        "name": "문화디자인경영",
        "en": "Culture & Design Management",
        "group": "tech"
      },
      {
        "name": "정보인터랙션디자인",
        "en": "Information & Interaction Design",
        "group": "tech"
      }
    ]
  },
  {
    "key": "korea",
    "name": "고려대학교",
    "college": "국제학부 (DIS)",
    "en": "Division of International Studies",
    "campus": "안암(서울)",
    "color": "#8c1a3d",
    "lang": "100% 영어 강의",
    "scale": "국제학 단일 학부 — 전공이 하나로 모여 있다",
    "majors": [
      {
        "name": "국제통상",
        "en": "International Commerce",
        "group": "intl"
      },
      {
        "name": "국제개발협력",
        "en": "International Development & Cooperation",
        "group": "intl"
      },
      {
        "name": "국제평화안보",
        "en": "International Peace & Security",
        "group": "intl"
      },
      {
        "name": "지역학 (동아시아·한국학)",
        "en": "Regional Studies",
        "group": "hum"
      }
    ]
  },
  {
    "key": "skku",
    "name": "성균관대학교",
    "college": "글로벌 계열 학부",
    "en": "Global Programs",
    "campus": "인문사회(명륜) · 자연과학(수원)",
    "color": "#00593f",
    "lang": "학부별로 영어 강의 비중이 높다",
    "scale": "글로벌 이름이 붙은 학부가 여럿 — 이공까지 폭이 넓다",
    "majors": [
      {
        "name": "글로벌리더학부",
        "en": "Global Leader",
        "group": "intl",
        "note": "사회과학 중심"
      },
      {
        "name": "글로벌경제학과",
        "en": "Global Economics",
        "group": "biz"
      },
      {
        "name": "글로벌경영학과",
        "en": "Global Business Administration",
        "group": "biz"
      },
      {
        "name": "글로벌바이오메디컬공학과",
        "en": "Global Biomedical Engineering",
        "group": "sci",
        "hot": true,
        "note": "이 학교 이공 글로벌 트랙의 간판"
      },
      {
        "name": "글로벌융합학부 — 데이터사이언스",
        "en": "Data Science",
        "group": "sci",
        "hot": true
      },
      {
        "name": "글로벌융합학부 — 인공지능",
        "en": "Artificial Intelligence",
        "group": "sci",
        "hot": true
      },
      {
        "name": "글로벌융합학부 — 컬처앤테크놀로지",
        "en": "Culture & Technology",
        "group": "tech",
        "note": "음악·콘텐츠 관심과 이어진다"
      }
    ]
  },
  {
    "key": "hanyang",
    "name": "한양대학교",
    "college": "국제학부 (DIS)",
    "en": "Division of International Studies",
    "campus": "서울(행당)",
    "color": "#0e4194",
    "lang": "영어 강의 중심",
    "scale": "국제학 단일 학부",
    "majors": [
      {
        "name": "국제학",
        "en": "International Studies",
        "group": "intl"
      },
      {
        "name": "국제정치·통상",
        "en": "International Politics & Commerce",
        "group": "intl"
      }
    ]
  },
  {
    "key": "sogang",
    "name": "서강대학교",
    "college": "국제인문학부",
    "en": "School of International Humanities",
    "campus": "신촌(서울)",
    "color": "#96172e",
    "lang": "영어 강의 비중이 높다",
    "scale": "어문·지역 문화 중심",
    "majors": [
      {
        "name": "영미문화계",
        "en": "American Culture",
        "group": "hum"
      },
      {
        "name": "유럽문화계",
        "en": "European Culture",
        "group": "hum"
      },
      {
        "name": "중국문화계",
        "en": "Chinese Culture",
        "group": "hum"
      }
    ]
  },
  {
    "key": "hufs",
    "name": "한국외국어대학교",
    "college": "국제학부 · LD · LT 학부",
    "en": "Division of International Studies",
    "campus": "서울 · 글로벌(용인)",
    "color": "#00447c",
    "lang": "영어 강의 + 제2외국어",
    "scale": "외국어 특화 — 언어를 하나 더 얹고 싶을 때",
    "majors": [
      {
        "name": "국제학",
        "en": "International Studies",
        "group": "intl"
      },
      {
        "name": "LD학부 (언어·외교)",
        "en": "Language & Diplomacy",
        "group": "intl",
        "note": "외교관 지망 특화"
      },
      {
        "name": "LT학부 (언어·통상)",
        "en": "Language & Trade",
        "group": "biz",
        "note": "통상·무역 특화"
      }
    ]
  },
  {
    "key": "khu",
    "name": "경희대학교",
    "college": "국제학과",
    "en": "Department of International Studies",
    "campus": "국제캠퍼스(용인)",
    "color": "#8b1e3f",
    "lang": "영어 강의 중심",
    "scale": "학과 단위",
    "majors": [
      {
        "name": "국제학",
        "en": "International Studies",
        "group": "intl"
      }
    ]
  },
  {
    "key": "cau",
    "name": "중앙대학교",
    "college": "글로벌 계열 전공",
    "en": "Global Programs",
    "campus": "서울(흑석)",
    "color": "#0b3d91",
    "lang": "전공별 영어 강의",
    "scale": "물류·금융 등 실무 색이 강하다",
    "majors": [
      {
        "name": "국제물류학과",
        "en": "International Logistics",
        "group": "biz"
      },
      {
        "name": "글로벌금융전공",
        "en": "Global Finance",
        "group": "biz"
      }
    ]
  },
  {
    "key": "kaist",
    "name": "KAIST",
    "college": "무학과 입학 (새내기과정)",
    "en": "Korea Advanced Institute of Science and Technology",
    "campus": "대전",
    "color": "#004191",
    "lang": "전 과목 영어 강의",
    "scale": "1학년은 전공 없이 입학해 2학년에 고른다",
    "majors": [
      {
        "name": "전산학부",
        "en": "Computer Science",
        "group": "sci",
        "hot": true
      },
      {
        "name": "수리과학과",
        "en": "Mathematical Sciences",
        "group": "sci",
        "hot": true
      },
      {
        "name": "물리학과",
        "en": "Physics",
        "group": "sci"
      },
      {
        "name": "생명과학과",
        "en": "Biological Sciences",
        "group": "sci"
      },
      {
        "name": "산업및시스템공학과",
        "en": "Industrial & Systems Engineering",
        "group": "sci"
      },
      {
        "name": "기술경영학부",
        "en": "Business & Technology Management",
        "group": "tech"
      }
    ]
  },
  {
    "key": "unist",
    "name": "UNIST",
    "college": "이공계 무학과 입학",
    "en": "Ulsan National Institute of Science and Technology",
    "campus": "울산",
    "color": "#005596",
    "lang": "전 과목 영어 강의",
    "scale": "1학년 무학과 후 전공 선택",
    "majors": [
      {
        "name": "컴퓨터공학",
        "en": "Computer Science & Engineering",
        "group": "sci",
        "hot": true
      },
      {
        "name": "인공지능",
        "en": "Artificial Intelligence",
        "group": "sci",
        "hot": true
      },
      {
        "name": "기계공학",
        "en": "Mechanical Engineering",
        "group": "sci"
      },
      {
        "name": "생명과학",
        "en": "Biological Sciences",
        "group": "sci"
      },
      {
        "name": "디자인학",
        "en": "Design",
        "group": "tech"
      }
    ]
  }
]

// 전공 탐색 목록은 유지하되 검증 전 입시 점수선·합격 가능성 단정은 사용하지 않는다.
export const UNIVERSITIES = EXPLORATION_UNIVERSITIES.map(u => ({...u,
 tier: VERIFIED_SCHOOLS[u.key] ? '요강 확인' : '전공 탐색',
 tracks: u.key === 'yonsei' ? ['국제형(해외고/검정고시) · 개인 자격 확인 필요'] : u.key === 'korea' ? ['학생부종합 계열적합전형 · 개인 자격 확인 필요'] : ['지원 연도 전형별 확인 필요'],
 english: '공통 TOEFL 점수선 없음. 해당 전형의 제출 허용·필수 여부 확인',
 fit: '관심 전공과 교육과정을 살펴보고, 지원 자격·평가 방식은 최신 모집요강으로 확인하세요.',
 check: ['졸업장/검정고시로 지원 가능한 전형은?', '시험 성적·활동 증빙의 제출 허용 범위는?', '목표 입학연도 모집단위와 졸업 시점 조건은?'],
}))

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
const EXPLORATION_USA = [
  {
    "name": "UCLA",
    "type": "주립 · 캘리포니아"
  },
  {
    "name": "Boston College",
    "type": "사립 · 매사추세츠"
  },
  {
    "name": "Northeastern University",
    "type": "사립 · 보스턴"
  },
  {
    "name": "Purdue University",
    "type": "주립 · 인디애나"
  },
  {
    "name": "Texas A&M",
    "type": "주립 · 텍사스"
  },
  {
    "name": "Ohio State University",
    "type": "주립 · 오하이오"
  },
  {
    "name": "Rutgers University",
    "type": "주립 · 뉴저지"
  },
  {
    "name": "University of Iowa",
    "type": "주립 · 아이오와"
  },
  {
    "name": "University of South Florida",
    "type": "주립 · 플로리다"
  }
]

export const SCHOOLS_USA = EXPLORATION_USA.map(s => ({...s,sat:'정책 확인',toefl:'요건 확인',gpa:'기준 확인',note:'추가 탐색 대학. 지원 연도 공식 입학 안내의 시험·학력·서류 정책 확인 전입니다.'}))

export const TIMELINE = HAUL_STEPS.map(([stage,text], i) => ({when:`STEP ${i+1}`, title:stage, items:[text]}))

export const GED_INFO = {
  name: '고졸 검정고시',
  rounds: ['1회 — 매년 4월경 시행 (2월경 접수)', '2회 — 매년 8월경 시행 (6월경 접수)'],
  subjects: ['국어', '수학', '영어', '사회', '과학', '한국사', '선택 1과목(도덕·기술가정·체육·음악·미술 중)'],
  pass: '합격 기준과 과목 면제는 응시 지역 교육청의 해당 회차 공고로 확인',
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
    q: 'Grade 10인 하울의 졸업 예정일과 남은 이수 학점은?',
    why: '미국 Grade 10은 확인 완료. 졸업 시점과 학점 요건을 알아야 지원 일정을 정할 수 있다',
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
  ['검정고시', '학력 인정 시험. 해당 대학이 인정하는 고졸 학력이 없는 경우 지원 자격을 마련하는 경로'],
  ['수시 / 정시', '수시·정시는 전형별 평가가 다르다. 일반대 수시 6회 제한과 전문대 등 예외를 구분한다'],
  ['국제계열 전형', '대학 공통 전형명이 아니다. 국제형·계열적합 등 대학별 정확한 전형명을 확인한다'],
  ['재외국민 특별전형', '해외에서 이수한 학생 대상. 국내 국제학교 재학은 해당되지 않는다'],
  ['수능 최저', '수시에서 요구하는 수능 최소 등급 조건. 전형에 따라 없기도 하다'],
  ['이중전공 / 복수전공', '입학 후 다른 학과를 함께 전공하는 제도. 국제학부생이 공대를 얹는 식'],
  ['TOEFL iBT', '영어 시험. 대학·전형마다 제출 허용 여부와 필요 점수가 다르다'],
  ['GPA / Transcript', '고교 내신 평균과 학교가 발급하는 공식 성적증명서. 미국대 지원의 핵심 서류'],
]

// ── 대학별 입시 조건 (상세)
//
// ⚠️ 아래는 「국제계열 수시가 대체로 이렇게 굴러간다」는 구조 설명이다.
//    모집인원·반영비율·어학 커트라인은 해마다 바뀌고 대학마다 다르므로
//    숫자는 범위로만 적고, 확정이 필요한 항목은 ask 에 넣어 입학처에 묻게 했다.
export const ADMISSION = Object.fromEntries(UNIVERSITIES.map(u => [u.key, {
 track:u.tracks.join(' / '), when:'목표 입학연도 요강의 원서·서류 마감 확인', english:u.english,
 eval:['yonsei','korea'].includes(u.key)?'1단계 서류 100%, 2단계 1단계 성적 60% + 면접 40%':'전형별 공식 요강 확인 전',
 interview:u.key==='yonsei'?'현장 녹화 면접: 제시문 기반 논리·의사소통 평가. 영어 제시문 가능':'실시 여부·방식 확인 전',
 minimum:['yonsei','korea'].includes(u.key)?'안내한 해당 전형은 수능 최저 없음':'전형별 확인 전',
 docs:['지원 자격을 입증할 학력 서류','대학이 정한 대체 활동 서류와 증빙 (해당 시)'],
 key:'학교 이름만으로 지원 자격이 정해지지 않습니다. 로드맵의 공식 원문을 먼저 확인하세요.'
}]))

export const COMMON_PROCESS = HAUL_STEPS.map(([name,what],i)=>({step:String(i+1),name,what,when:'개인 일정 확인 후 배치'}))
export const DOC_CHECKLIST = HAUL_CHECKS.map(name=>({name,note:'본인의 지원 전형에 적용되는지 확인한 뒤 준비',must:false}))

// ── 입시박사에게 넘길 컨텍스트
// 화면에 실제로 실린 내용만 문자열로 만들어 넘긴다. 박사는 이걸 근거로만 답한다.
export function tutorContext() { return verifiedContext('haul') }

export const TUTOR_PRESETS = [
  '나는 어떤 전형으로 지원할 수 있어?',
  '검정고시는 언제까지 붙어야 해?',
  '수학을 좋아하는데 어느 학과가 맞을까?',
  'TOEFL 점수는 얼마나 필요해?',
  '지금부터 뭘 먼저 해야 해?',
]
