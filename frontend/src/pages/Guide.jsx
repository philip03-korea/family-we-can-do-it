import { useState } from 'react'
import { Link } from 'react-router-dom'

// ============================================================
// FamTalk 사용설명서 (공개 페이지 — 로그인 없이 열람 가능)
// 카톡방에 링크 공유용. 탭 선택 → 방법 버튼 탭하면 단계 설명이 펼쳐짐.
// ============================================================

const APP_URL = 'https://family-we-can-do-it.vercel.app'

const TABS = [
  {
    id: 'start',
    icon: '🚀',
    title: '시작하기',
    items: [
      {
        q: '앱 열고 홈 화면에 추가하기',
        steps: [
          `휴대폰 브라우저에서 ${APP_URL} 접속`,
          '아이폰(Safari): 아래 공유 버튼 → "홈 화면에 추가"',
          '안드로이드(Chrome): 오른쪽 위 ⋮ → "앱 설치" 또는 "홈 화면에 추가"',
          '홈 화면 아이콘으로 들어오면 앱처럼 전체화면으로 켜져요.',
        ],
        note: '설치하면 매번 주소 칠 필요 없이 바로 들어올 수 있어요.',
      },
      {
        q: '회원가입 / 로그인',
        steps: [
          '첫 화면에서 "처음이신가요? 가입하기" 누르기',
          '이메일과 비밀번호(6자 이상) 입력 → 가입하기',
          '바로 로그인 → 다음에는 같은 이메일/비밀번호로 로그인',
        ],
        note: '가족 각자 자기 이메일로 가입하세요. 가족끼리 학습 현황과 채팅이 연결돼요.',
      },
      {
        q: '내가 누구인지 선택하기',
        steps: [
          '로그인 후 "누구신가요?" 화면에서 본인 선택',
          '엄마·아빠 / 하음 / 하울 / 하람 중 본인 카드 탭',
          '선택하면 추천 레벨(A~F)로 자동 시작돼요.',
        ],
        note: '하울은 TOEFL 트랙이 함께 켜집니다.',
      },
    ],
  },
  {
    id: 'study',
    icon: '📚',
    title: '단어 학습',
    items: [
      {
        q: '오늘의 단어 학습하기',
        steps: [
          '대시보드에서 "학습 시작 →" 버튼 누르기',
          '단어가 나오면 🔊 "듣기"로 발음 듣기',
          '"뜻 보기"를 눌러 뜻·예문 확인',
          '🎤 "따라 말하기"로 발음 점수 받기 (선택)',
          '얼마나 쉬웠는지 다시/어려움/보통/쉬움 중 선택 → 다음 단어',
        ],
        note: '"쉬움"일수록 다음 복습이 길어지고, "다시"는 곧 또 나와요. (망각곡선 복습)',
      },
      {
        q: '학습한 단어 복습하기',
        steps: [
          '대시보드 "📚 학습한 단어 복습하기" 버튼',
          '이미 외운 단어를 기한과 상관없이 다시 볼 수 있어요.',
        ],
      },
      {
        q: '내 관심사로 영어 배우기',
        steps: [
          '대시보드 "🎯 내 관심사 영어"에서 주제 선택',
          '하음: 웹툰·배우 / 하울: 축구·랩 / 하람: 게임·팝송',
          '좋아하는 주제 단어라 더 재미있게 외워져요.',
        ],
      },
      {
        q: '단어장에서 찾아보기',
        steps: [
          '대시보드 "📒 단어장" 열기',
          '위쪽 A~F 레벨 탭으로 이동, 검색창에 단어/뜻 입력',
          '각 단어 🔊로 발음 듣기, 학습 상태(새 단어/복습/학습됨) 확인',
        ],
      },
    ],
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'AI 회화',
    items: [
      {
        q: '영어로 대화하기',
        steps: [
          '대시보드 "💬 AI 회화" 열기',
          '추천 주제를 누르거나, 아래에 영어로 입력 → 전송',
          'AI가 내 레벨에 맞춰 영어로 답하고, 🔊로 읽어줘요.',
          '내 문장에 틀린 부분이 있으면 ✏️ 교정을 보여줘요.',
        ],
      },
      {
        q: '한국어로 말해도 OK (번역·도움)',
        steps: [
          '영어가 어려우면 한국어로 입력해도 돼요.',
          'AI가 영어로 바꿔주거나 질문에 답해줘요.',
          '🎤 버튼으로 말하면 음성이 글자로 바뀌어 입력돼요.',
        ],
        note: '안드로이드는 음성입력 OK, 아이폰은 타이핑으로 사용하세요.',
      },
    ],
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    title: '가족',
    items: [
      {
        q: '이번 주 공통 주제로 이야기하기',
        steps: [
          '대시보드 "👨‍👩‍👧‍👦 가족" 열기',
          '맨 위 "이번 주 토론 주제" 카드 확인 (🔊로 듣기)',
          '주제에 대해 각자 영어로 한 마디씩 채팅에 남겨요.',
        ],
        note: '매주 주제가 바뀌어요. 같은 주제로 온 가족이 함께 연습해요.',
      },
      {
        q: '가족 채팅 (글·음성)',
        steps: [
          '아래 입력창에 메시지 입력 → 전송 (영어 연습 추천)',
          '🎤로 말해서 입력하거나, 음성 메시지로 내 목소리를 보낼 수 있어요.',
          '영어 메시지를 탭하면 한국어 번역이 나타나요.',
        ],
      },
      {
        q: '패미(AI 가족)와 대화하기',
        steps: [
          '채팅이 조용하면 🤖 패미가 먼저 말을 걸어요.',
          '패미를 직접 부르면 주제에 맞는 질문을 던져줘요.',
          '패미 질문에 영어로 답하며 자연스럽게 대화를 이어가요.',
        ],
      },
      {
        q: '가족 현황 보기',
        steps: [
          '가족 화면의 "가족 현황"에서 각자 레벨·연속 학습일·오늘 학습량 확인',
          '서로 응원하며 매일 학습 습관을 만들어요. 🔥',
        ],
      },
    ],
  },
  {
    id: 'toefl',
    icon: '🎓',
    title: 'TOEFL (하울)',
    items: [
      {
        q: 'Speaking 연습 (말하기 채점)',
        steps: [
          '대시보드 "🎓 TOEFL 트랙" → Speaking 탭',
          '문제를 읽고 🎤로 답하거나(안드로이드), 직접 타이핑(아이폰)',
          '"🤖 AI 채점 받기" → 0~30점 + 잘한 점/개선점 피드백',
        ],
      },
      {
        q: 'Writing 연습 (에세이 채점)',
        steps: [
          'Writing 탭에서 문제 선택 → 에세이 작성',
          '"🤖 AI 채점 받기"로 점수와 개선 예시 확인',
        ],
      },
      {
        q: 'Reading 연습 (지문·문제)',
        steps: [
          'Reading 탭에서 지문 읽기 (🔊 듣기 가능)',
          '객관식 문제 풀고 "채점하기" → 정답 수와 환산 점수 확인',
        ],
        note: 'Reading은 AI 없이 즉시 채점돼요.',
      },
    ],
  },
  {
    id: 'help',
    icon: '🔧',
    title: '음성·문제해결',
    items: [
      {
        q: '소리가 안 나와요 (듣기)',
        steps: [
          '휴대폰 무음/볼륨 확인',
          '🔊 버튼을 한 번 직접 눌러보기 (자동재생이 막힐 수 있어요)',
          '아이폰은 측면 무음 스위치도 확인하세요.',
        ],
      },
      {
        q: '따라 말하기가 안 돼요 (음성인식)',
        steps: [
          '안드로이드 Chrome: 정상 지원돼요.',
          '아이폰(Safari/Chrome): 음성인식은 미지원 → 타이핑으로 사용',
          '마이크 권한 요청이 뜨면 "허용"을 눌러주세요.',
        ],
        note: '발음 음성인식은 안드로이드에서 가장 잘 돼요.',
      },
      {
        q: '화면이 비어 있어요 (단어가 없음)',
        steps: [
          '잠시 후 새로고침 해보세요.',
          '계속 비어 있으면 관리자(아빠)에게 알려주세요. (데이터 설정 필요)',
        ],
      },
      {
        q: '로그인이 안 돼요',
        steps: [
          '이메일·비밀번호 다시 확인',
          '가입을 안 했다면 먼저 "가입하기"',
          '비밀번호를 잊었으면 새 이메일로 다시 가입해도 돼요.',
        ],
      },
    ],
  },
]

export default function Guide() {
  const [tab, setTab] = useState('start')
  const [open, setOpen] = useState(null)
  const current = TABS.find((t) => t.id === tab)

  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-24">
      {/* 헤더 */}
      <div className="text-center mb-5">
        <div className="text-4xl mb-1">🏠🔥</div>
        <h1 className="text-2xl font-black">FamTalk 사용설명서</h1>
        <p className="text-slate-400 text-sm mt-1">우리 가족 영어 사다리 A→F</p>
        <a
          href={APP_URL}
          className="inline-block mt-3 bg-level-c px-5 py-2.5 rounded-full font-bold"
        >
          앱 열기 →
        </a>
        <p className="text-slate-500 text-xs mt-2 break-all">{APP_URL}</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5 overflow-x-auto mb-4 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setOpen(null)
            }}
            className={`shrink-0 px-3 py-2 rounded-xl text-sm font-bold ${
              tab === t.id ? 'bg-level-c text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {t.icon} {t.title}
          </button>
        ))}
      </div>

      {/* 방법 버튼(아코디언) */}
      <div className="space-y-2">
        {current.items.map((it, i) => {
          const key = `${tab}-${i}`
          const isOpen = open === key
          return (
            <div key={key} className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : key)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="font-bold">{it.q}</span>
                <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <ol className="space-y-2">
                    {it.steps.map((s, si) => (
                      <li key={si} className="flex gap-2.5 text-sm text-slate-200">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-level-c text-white text-xs flex items-center justify-center font-bold">
                          {si + 1}
                        </span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ol>
                  {it.note && (
                    <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 rounded-lg px-3 py-2">
                      💡 {it.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 푸터 */}
      <div className="mt-8 text-center">
        <p className="text-slate-400 text-sm mb-3">준비됐나요? 가족과 함께 시작해요! 💪</p>
        <Link to="/" className="inline-block bg-slate-800 border border-slate-700 px-6 py-3 rounded-xl font-bold">
          FamTalk 시작하기
        </Link>
        <p className="text-slate-600 text-xs mt-6">(family) WE CAN DO IT!! 🔥</p>
      </div>
    </div>
  )
}
