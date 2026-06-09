# AI 회화 설정 가이드 (무료 Gemini Flash)

> STEP 4의 AI 회화는 **Google Gemini Flash 무료 티어**를 사용합니다.
> 무료 한도: 분당 15회 / **하루 1,500회** (5인 가족엔 차고 넘침). 사실상 ₩0.
> API 키는 **Supabase Edge Function 서버에만** 저장돼 노출/도용 위험이 없습니다.

## 왜 이 구조인가 (비용·보안)
- 키를 브라우저에 넣으면 누구나 추출해 도용 → 과금/한도 소진 위험. 그래서 **서버(Edge Function)에 숨김**.
- **응답 캐싱**(`ai_cache`): 같은 질문은 다시 호출 안 함 → 0원.
- **일일 쿼터**(`ai_usage` + `AI_DAILY_LIMIT`): 1인당 하루 호출 상한으로 폭주 차단.

---

## 1) 무료 Gemini API 키 발급 (1분)
1. https://aistudio.google.com/app/apikey 접속 (구글 로그인)
2. **Create API key** 클릭 → 키 복사 (`AIza...`)
   - 무료 요금제로 충분합니다. 결제 등록 불필요.

## 2) DB 준비
Supabase SQL Editor 에서 `database/step4.sql` 실행 (ai_cache, ai_usage, RPC 생성).

## 3) Supabase CLI 설치 & 로그인
```bash
npm install -g supabase
supabase login                       # 브라우저 인증
cd C:\dev\family-we-can-do-it
supabase link --project-ref <프로젝트-ref>   # 대시보드 URL의 그 ref
```
> `<프로젝트-ref>` = Supabase 프로젝트 URL `https://xxxx.supabase.co` 의 `xxxx`

## 4) 키를 서버 시크릿으로 등록 (브라우저엔 절대 안 들어감)
```bash
supabase secrets set GEMINI_API_KEY=AIza...여기에붙여넣기
# (선택) 모델/한도 조정
supabase secrets set GEMINI_MODEL=gemini-2.0-flash
supabase secrets set AI_DAILY_LIMIT=100
```

## 5) Edge Function 배포
```bash
supabase functions deploy chat
```
배포되면 `https://<ref>.supabase.co/functions/v1/chat` 가 생깁니다.
앱(`lib/ai.js`)이 자동으로 이 함수를 호출합니다.

## 6) 확인
- 앱 → 대시보드 → **💬 AI 회화** → 영어로 입력하거나 🎤로 말하기
- AI가 레벨에 맞춰 답하고, 내 문장에 ✏️ 교정을 달아줍니다.
- 우측 상단 `사용량/한도` 표시로 비용을 눈으로 관리.

---

## 비용 요약
| 항목 | 비용 |
|------|------|
| Gemini Flash (무료 티어, 하루 1,500회) | ₩0 |
| Supabase Edge Function (무료 티어) | ₩0 |
| 캐시 적중분 | ₩0 |
| **합계 (가족 5인 일상 사용)** | **사실상 ₩0** |

> 무료 한도를 초과할 정도로 많이 쓰게 되면, 같은 Gemini 키에 결제를 붙여
> 종량제(Flash는 100만 토큰당 수십 원 수준)로 전환만 하면 됩니다. 코드 변경 불필요.
