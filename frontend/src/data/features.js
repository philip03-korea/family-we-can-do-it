// 기능 노출 설정 — 「배움 / 집안 / 마음 / 나」 4그룹
//
// 부모(mom·dad)는 이 설정과 무관하게 항상 전체를 본다.
// 아이는 profiles.enabled_features (text[]) 에 담긴 키만 본다.
// 값이 null 이면 아래 DEFAULT_FEATURES 를 쓴다.

export const GROUPS = [
  { key: 'learn', label: '배움', emoji: '🎓', tint: '#818cf8', bg: 'bg-level-e' },
  { key: 'home', label: '집안', emoji: '🏠', tint: '#2dd4bf', bg: 'bg-level-f' },
  { key: 'heart', label: '마음', emoji: '💗', tint: '#f472b6', bg: 'bg-level-c' },
]

// 「나」 탭은 그룹이 아니라 항상 있는 고정 탭이다 (GROUPS 에 넣지 않는다).
export const ME_TAB = { key: 'me', label: '나', emoji: '⚙️', route: '/me' }

export const FEATURES = [
  // ── 배움
  { key: 'study', name: '단어 학습', emoji: '📘', route: '/study', group: 'learn', desc: '오늘의 복습 + 새 단어' },
  { key: 'words', name: '단어장', emoji: '📒', route: '/words', group: 'learn', desc: '내가 배운 단어 모음' },
  { key: 'quiz', name: '복습 퀴즈', emoji: '🧩', route: '/quiz?mode=solo', group: 'learn', desc: '혼자 풀기 · 퀴즈로 하기' },
  { key: 'sentences', name: '문장 읽기', emoji: '📖', route: '/sentences', group: 'learn', desc: '레벨별 예문 소리내어 읽기' },
  { key: 'chat', name: 'AI 회화', emoji: '💬', route: '/chat', group: 'learn', desc: '패미와 영어로 대화' },
  { key: 'math', name: '수학 연습', emoji: '📐', route: '/math', group: 'learn', desc: '학년별 객관식 + 풀이' },
  { key: 'contest', name: '수학 경시', emoji: '🏆', route: '/contest', group: 'learn', desc: '경시대회 대비 문제' },
  { key: 'toefl', name: 'TOEFL', emoji: '🎓', route: '/toefl', group: 'learn', desc: 'Speaking · Writing AI 채점' },
  { key: 'exam', name: '문제은행', emoji: '🗂️', route: '/exam', group: 'learn', desc: 'TOEFL · 검정고시 과목별' },
  { key: 'career', name: '대학 가이드', emoji: '🧭', route: '/career', group: 'learn', desc: '글로벌학부 · 학과 · 지원자격' },
  { key: 'webtoon', name: '웹툰 입시', emoji: '🎨', route: '/webtoon', group: 'learn', desc: '웹툰학과 · 실기 · 포트폴리오' },

  // ── 집안
  { key: 'chores', name: '집안일', emoji: '🧹', route: '/chores', group: 'home', desc: '이번 주 당번 · 완료 체크' },
  { key: 'meals', name: '식단표', emoji: '🍚', route: '/meals', group: 'home', desc: '오늘 · 이번 주 식단' },
  { key: 'cooking', name: '요리', emoji: '🍳', route: '/cooking', group: 'home', desc: '요즘 인기 레시피 따라하기' },
  { key: 'schedule', name: '계획표', emoji: '🗓️', route: '/schedule', group: 'home', desc: '주간 계획 · 오늘 할 일' },
  { key: 'shop', name: '보상 상점', emoji: '🛒', route: '/shop', group: 'home', desc: '포인트로 바꾸기' },

  // ── 마음
  { key: 'counsel', name: '마음 상담', emoji: '🧠', route: '/counsel', group: 'heart', desc: '심리검사 · 내 기록' },
  { key: 'talk', name: '가족 대화', emoji: '🗣️', route: '/talk', group: 'heart', desc: '대화 카드 · 감정 일기' },
  { key: 'family', name: '가족 현황', emoji: '👨‍👩‍👧‍👦', route: '/family', group: 'heart', desc: '주간 주제 · 가족 채팅' },
]

export const FEATURE_MAP = Object.fromEntries(FEATURES.map((f) => [f.key, f]))
export const ALL_FEATURE_KEYS = FEATURES.map((f) => f.key)

// 아이별 기본 노출 (enabled_features 가 null 일 때)
export const DEFAULT_FEATURES = {
  // 고3 — 웹툰으로 입시를 준비한다. 수학·경시·TOEFL·문제은행은 부담이라 꺼둔다.
  haeum: ['study', 'words', 'quiz', 'sentences', 'chat', 'webtoon', 'chores', 'meals', 'shop', 'counsel', 'talk', 'family'],
  // 고1 — 입시 트랙: TOEFL · 검정고시 문제은행 · 수학 경시 · 진학 가이드 추가
  haul: [
    'study', 'words', 'quiz', 'sentences', 'chat', 'math', 'contest', 'toefl', 'exam', 'career',
    'chores', 'meals', 'shop', 'counsel', 'talk', 'family',
  ],
  // 중1 — 요리 코너 + 마음 그룹(상담·가족 대화·가족 현황)까지 연다.
  haram: [
    'study', 'words', 'quiz', 'sentences', 'math',
    'chores', 'meals', 'cooking', 'shop', 'schedule',
    'counsel', 'talk', 'family',
  ],
}

// 앱을 열었을 때 먼저 보여줄 화면 (세션당 1회).
// 아이마다 지금 가장 중요한 것이 다르다 — 하울은 입시, 하음도 입시(웹툰), 하람은 요리.
// 그 기능이 꺼져 있으면 그냥 평소 홈이 뜬다.
export const LANDING = {
  haul: { feature: 'career', title: '대학 가이드', desc: '글로벌·국제학부 10곳 · 학과 46개 · 지원자격까지', emoji: '🧭', bg: 'bg-level-e' },
  haeum: { feature: 'webtoon', title: '웹툰 입시 가이드', desc: '웹툰학과 10곳 · 실기와 포트폴리오 · 데뷔 경로', emoji: '🎨', bg: 'bg-level-d' },
  haram: { feature: 'cooking', title: '오늘 뭐 만들까?', desc: '요즘 인기 레시피 16개 · 재료와 만드는 법까지', emoji: '🍳', bg: 'bg-level-f' },
}

// 이 구성원의 첫 화면 정보 (그 기능이 실제로 켜져 있을 때만)
export function landingOf(memberKey, featureKeys) {
  const l = LANDING[memberKey]
  if (!l) return null
  if (!featureKeys.includes(l.feature)) return null
  return { ...l, route: FEATURE_MAP[l.feature]?.route }
}

export const PARENT_KEYS = ['mom', 'dad']
export const isParentKey = (key) => PARENT_KEYS.includes(key)

// 이 구성원이 볼 기능 키 목록.
// 부모는 항상 전체, 아이는 저장값 → 없으면 기본값 → 그것도 없으면 전체.
export function resolveFeatures(memberKey, enabledFeatures) {
  if (!memberKey) return ALL_FEATURE_KEYS
  if (isParentKey(memberKey)) return ALL_FEATURE_KEYS
  const saved = Array.isArray(enabledFeatures) ? enabledFeatures : null
  const list = saved || DEFAULT_FEATURES[memberKey] || ALL_FEATURE_KEYS
  // 저장값에 이제 없는 기능 키가 남아 있을 수 있으니 걸러낸다
  return list.filter((k) => FEATURE_MAP[k])
}

// 켜진 기능이 하나라도 있는 그룹만 남긴다 (빈 그룹은 탭에서 사라진다)
export function resolveGroups(featureKeys) {
  const set = new Set(featureKeys)
  return GROUPS.filter((g) => FEATURES.some((f) => f.group === g.key && set.has(f.key)))
}

export function featuresOfGroup(groupKey, featureKeys) {
  const set = new Set(featureKeys)
  return FEATURES.filter((f) => f.group === groupKey && set.has(f.key))
}

// 라우트 → 기능 키 (꺼진 기능에 직접 주소로 들어오는 걸 막을 때 쓴다)
export function featureKeyOfPath(pathname) {
  const hit = FEATURES.find((f) => {
    const base = f.route.split('?')[0]
    return pathname === base || pathname.startsWith(base + '/')
  })
  return hit?.key || null
}
