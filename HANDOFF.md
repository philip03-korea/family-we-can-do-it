# HANDOFF — 작업 인수인계

여러 대의 컴퓨터에서 번갈아 작업하기 때문에 생기는 혼선을 막기 위한 파일이다.
**push 할 때마다 이 파일의 「작업 로그」 맨 위에 한 항목을 추가한다.**

---

## 0. 새 컴퓨터에서 작업 시작할 때 (매번)

```bash
git clone https://github.com/philip03-korea/family-we-can-do-it.git   # 처음이면
cd family-we-can-do-it
git pull                      # ← 항상 먼저. 다른 PC 작업분이 있다
cat HANDOFF.md                # ← 이 파일부터 읽기 (특히 「대기 중」 항목)
cd frontend && npm install    # package.json이 바뀌었을 수 있음
npm run dev                   # http://localhost:5173
```

### 처음 쓰는 PC라면 `frontend/.env` 를 직접 만들어야 한다

`.env` 는 **커밋되지 않는다**(gitignore). 없으면 앱이 셋업 안내 화면만 뜨고 아무것도 안 된다.
`frontend/.env.example` 을 복사한 뒤 값을 채운다. 값은 Supabase 대시보드
→ 프로젝트 `ghmroezwdwkvruygrqzv` → Settings → API 에서 가져온다.

```bash
cp frontend/.env.example frontend/.env
```

```
VITE_SUPABASE_URL=https://ghmroezwdwkvruygrqzv.supabase.co
VITE_SUPABASE_ANON_KEY=<Settings → API → anon public 키>
```

> anon 키는 브라우저에 노출되는 공개 키라 그 자체로는 위험하지 않지만, 그래도 `.env` 는 커밋하지 않는다.
> **서비스 롤 키는 절대 `frontend/` 에 넣지 않는다** — 서버(Edge Function) 시크릿 전용이다.

`git status`가 지저분하면 **다른 PC에서 커밋을 안 하고 두고 간 것**이다. 덮어쓰기 전에 내용부터 확인할 것.

---

## 1. 지금 상태 (2026-09-03 기준)

- 브랜치: `main` 하나만 사용 (원격 `fix/counsel-blank-screen`은 PR #11 머지 후 잔재, 지워도 됨)
- 프론트: `frontend/` — React + Vite + Tailwind + PWA
- DB/백엔드: Supabase 프로젝트 `ghmroezwdwkvruygrqzv`
- 마이그레이션: `database/stepNN_*.sql` — **자동 적용 안 됨.** Supabase 대시보드 → SQL Editor에 수동 실행
- Edge Functions: `supabase/functions/` (`notify-crisis`, `church` 등)

### ⚠️ 대기 중 (다음 사람이 해야 할 일)

- **`database/step15_visibility.sql` 을 Supabase SQL Editor에서 실행해야 한다** (2026-09-07).
  실행 전까지 부모용 「화면 설정」 저장이 실패한다(앱이 안내 메시지를 띄운다).
  나머지 화면은 앱 기본값으로 정상 동작하니 급히 막히는 건 없다.
  실행하면 이 항목을 지우고 아래 로그에 "실행 완료"라고 적을 것.

- **하울 진학 가이드의 「확인」 탭 7가지**를 등대글로벌스쿨(031-971-2731)에 물어봐야
  플랜을 확정할 수 있다. 특히 **하울이 미국 학제로 몇 학년인지**(Grade 10/11)에 따라
  남은 시간이 1년 차이 난다.

- **하울 진로 가이드플랜** — `docs/하울_진로_조사.md` 의 「5. 학교에 확인해야 할 것」 7가지를
  등대글로벌스쿨(031-971-2731)에 문의해 채워야 플랜 작성 착수 가능.
  특히 **하울이 미국 학제로 몇 학년인지**(Grade 10/11)에 따라 남은 시간이 1년 차이 난다.

### 🔜 앞으로 손볼 만한 지점

| 항목 | 어디 | 메모 |
|---|---|---|
| 홈 「오늘 할 일」 다이제스트 | `src/pages/Dashboard.jsx` | 지금은 단어 학습만 요약한다. 집안일·식단 미완료까지 한 줄씩 끌어오면 홈이 진짜 「오늘」이 된다 |
| 문제은행·경시 기록을 서버로 | `src/lib/localProgress.js` | 지금은 localStorage라 기기를 바꾸면 초기화된다. 가족이 서로 보게 하려면 테이블로 올릴 것 |
| 요리 사진 | `src/data/recipes.js` | 각 레시피에 `image: 'https://…'` 를 넣으면 그라데이션 카드 대신 그 사진이 뜬다 (Cooking.jsx 의 Hero 가 이미 처리) |
| 문항 늘리기 | `src/data/exambank.js`, `mathcontest.js` | 지금은 검정고시 48 · TOEFL 19 · 경시 24문항. 형식은 그대로 두고 배열에 추가만 하면 된다 |

---

## 2. 작업 로그 (최신이 위)

### 2026-09-07 — 아이별 화면 노출 + 하울 입시 3종 + 하람 요리 코너

- **증상**: 기능이 17개가 됐는데 아이 화면에도 남의 기능이 다 보였다. 하단 탭 5개는
  하드코딩이라 정작 「학습」이 없었고, 홈은 타일 12개 + 레벨사다리 + 음성데모 + 설정이
  전부 쌓인 런처였다. 하울은 입시 준비를 앱 밖에서 따로 하고 있었고, 하람은 열어볼 게 없었다.
- **원인**: 노출 제어 개념이 코드에 아예 없었다. 2026-09-03 기획안(`docs/design/`)이
  방향은 잡아 뒀지만 코드는 한 줄도 안 바뀐 상태였다.
- **조치**
  - **노출 설정** — `database/step15_visibility.sql`(신규, **아직 실행 안 함**),
    `src/data/features.js`(기능 18개 · 그룹 4개 · 아이별 기본값),
    `AuthContext`(visibleFeatures/visibleGroups/canSee), `BottomNav`(고정 5개 → 동적 생성),
    `GroupHub.jsx`·`Me.jsx`·`Manage.jsx`(신규), `App.jsx`(라우트 재편 + 꺼진 기능 직접 접근 차단),
    `Dashboard.jsx`(런처 타일 12개 → 그룹 카드 3개, 레벨사다리·음성데모·설정은 「나」 탭으로 이동)
  - **하울** — `Career.jsx` + `data/career.js`(진학 경로 3가지, 학과 6개, 미국대 10 · 국내대 8,
    타임라인, 학교 확인사항 7가지, 용어집), `Exams.jsx` + `data/exambank.js`(검정고시 6과목 48문항,
    TOEFL 4영역 19문항 — Listening은 TTS로 들려준다), `Contest.jsx` + `data/mathcontest.js`
    (대회 4개, 정수·대수·기하·조합 24문항 + 힌트·풀이)
  - **하람** — `Cooking.jsx` + `data/recipes.js`(레시피 16개, 재료·단계·팁·안전등급)
  - `src/lib/localProgress.js`(신규) — 풀이 기록·즐겨찾기를 localStorage에 저장
  - 디자인 캔버스 8장 — `docs/design/screens/`, 발행본
    https://claude.ai/code/artifact/6285b461-1c51-4752-9b45-10abe15e04ff
- **아이별 노출 (기본값, `data/features.js` DEFAULT_FEATURES)**
  - 엄마·아빠 → 전체 (설정과 무관, 항상)
  - 하음 → **기존 그대로** (수학·경시·TOEFL·문제은행·진학가이드 꺼둠)
  - 하울 → 기존 + 진학 가이드 · 문제은행 · 수학 경시
  - 하람 → 기존 + 요리 (마음 그룹은 꺼져 있어 탭이 4개)
- **지뢰 하나 피해 둠**: `enabled_features` 컬럼이 없는 상태에서 그 컬럼을 달라는 select 를
  던지면 쿼리가 통째로 실패해 **가족 목록이 비어 버린다**(부모 미리보기 줄이 사라짐).
  `AuthContext.loadAllProfiles()` 가 실패하면 컬럼 없이 한 번 더 부르도록 했다.
  step15 를 실행하기 전에도 앱이 정상 동작하는 건 이 때문이다.
- **검증**: `cd frontend && npm run build` 통과 (137 modules)
- **커밋**: 이 커밋
- **남은 것**: 위 「대기 중」 2가지 — step15 실행, 학교 확인 7가지.
  진학 가이드의 성적 숫자는 전부 **대략적 참고 범위**이고 화면 상단에 그 경고를 띄워 뒀다.


### 2026-09-03 — 화면 재구성 기획안 + 하울 진로 조사 (문서만, 코드 변경 없음)

- **증상**: 영어앱으로 시작해 필요한 걸 붙이다 보니 기능이 17개가 됐다. 홈 한 화면에 타일 12개 +
  레벨사다리 + XP + 음성데모 + 설정이 전부 쌓여 화면이 계속 길어지고, 하단 탭 5개는 고정인데
  정작 「학습」이 빠져 있다. 아이 화면에도 남의 기능이 다 보인다(예외는 아빠 전용 교회 탭 하나뿐).
- **원인**: 정보구조 없이 기능을 추가해 왔고, 노출 제어 개념 자체가 코드에 없다.
  `Dashboard.jsx` 가 런처를 겸하고 `BottomNav.jsx` 는 5개 하드코딩.
- **조치** — 전부 `docs/` 안, **frontend/ 와 database/ 는 손대지 않았다**
  - `docs/design/*.dc.html` + `canvas.json` — 클릭되는 기획안 6장
    (홈 구성원 전환 · 부모용 화면 설정 · 그룹 허브 · 탭 규칙 · IA Before/After · 구현 명세)
  - 캔버스: https://claude.ai/code/artifact/a3bb3659-48aa-491e-a60e-615cea4ba362
  - `docs/design/README.md` — 재생성 방법. 생성물 `famtalk-layout-plan.html`(2.5MB)은 `.gitignore` 처리
  - `docs/하울_진로_조사.md` — 등대글로벌스쿨(LIS) 학력인정·진학경로 조사
- **기획 요지**: 기능 17개를 **배움 / 집안 / 마음 / 나** 4그룹으로. 하단 탭 = 홈 + 켜진 그룹 + 나
  (그룹이 전부 꺼지면 탭도 사라짐). 부모는 설정과 무관하게 항상 전체.
  데이터는 `profiles.enabled_features text[]` 컬럼 하나, `null`이면 나이별 기본값.
- **지뢰 하나 미리 밟아둠**: 처음 쓴 RLS 정책이 `profiles` 정책 안에서 `profiles`를 직접 조회하는
  형태라 **무한재귀**가 날 코드였다. step13 의 `is_parent()` (security definer) 를 쓰도록 고쳤다.
  step15 를 실제로 쓸 때 이 점 주의.
- **커밋**: `docs: 화면 재구성 기획안 + 하울 진로 조사`
- **남은 것**: 위 「대기 중」 3가지. 결정되면 `Spec.dc.html` 의 적용 순서 1~5 대로 진행.


### 2026-07-28 — 구성원 중복 선택 방지 (엄마 프로필 2개 정리)

- **증상**: 대시보드 미리보기 줄에 엄마가 두 번 표시. 엄마 미리보기를 눌러도 빈 화면.
- **원인**: 엄마가 두 계정으로 가입(`hr2514@hanmail.net` 6/9 → 미사용, `hr25142514@gmail.com` 6/20 → 실사용).
  `profiles`에 `member_key='mom'` 행이 2개가 됐고, `AuthContext`가 viewKey를 member_key로 찾아 항상 빈 계정 쪽이 걸렸다.
- **조치**
  - `database/step14_unique_member.sql` — 빈 계정 삭제 + `profiles.member_key` 유니크 인덱스 → **Supabase에 실행 완료 (확인됨)**
  - `frontend/src/pages/Dashboard.jsx` PickMember — 이미 선택된 구성원 비활성화, 유니크 위반(23505) 안내 메시지
- **커밋**: `114a2d4`
- **남은 것**: 없음

### 2026-07-17 — 마음 상담 흰 화면 수정 (PR #11)

- 프로필형 검사(Big Five·SDQ)는 `levels`가 없고 `dimensions`만 있는데 `t?.levels.find(...)`로 접근 → TypeError → 화면 전체 언마운트.
- `t?.levels?.find(...)`로 수정. 커밋 `e1f15c2`.

### 2026-07-15 — 마음 상담(하23) · 교회 교육기획(하24) 신규

- 심리검사 11종 172문항(PHQ-9/GAD-7/K-10/CES-D/RSES/BRS/PSS-10/WHO-5/UCLA/Big Five/SDQ), 가족 대화 카드, 부모 위기 알림(A안: 사전 고지 후 임계치 초과 시 푸시).
- DB: `step12_counsel_church.sql`, `step13_parent_crisis_alert.sql` (적용 완료)
- Edge Function: `notify-crisis`, `church`
- 커밋 `fa4a8b1` → `d9edd37` → `182fc45` → `3d91356`

### 2026-07-09 — 집안일 한 달치 공평 자동배정

- 고정 규칙(📌), 월간 달력, 월별 시상, 분리수거 2인 세트(하울+하람) 고정. 커밋 `403aa4d`, `63187e6`

---

## 3. push 하기 전 체크리스트

1. `git pull` — 원격이 앞서 있으면 먼저 합친다
2. `cd frontend && npm run build` — 빌드 통과 확인 (배포는 빌드가 깨지면 그대로 죽는다)
3. `database/`에 SQL을 추가했으면 **Supabase에서 실행했는지** 확인. 실행 전이면 아래 「대기 중」에 적는다
4. **이 파일의 「작업 로그」에 항목 추가** — 증상 / 원인 / 조치 / 커밋 / 남은 것
5. `git push`

### 로그 항목 양식

```markdown
### YYYY-MM-DD — 한 줄 제목

- **증상**: (사용자 눈에 뭐가 보였나)
- **원인**: (진짜 이유. 추측이면 추측이라고 쓸 것)
- **조치**: 바꾼 파일 + 요약
- **커밋**: `해시`
- **남은 것**: 없음 / 또는 다음 사람이 할 일
```

---

## 4. 자주 밟는 지뢰

- **SQL은 자동 적용이 아니다.** `database/*.sql`을 커밋만 하고 Supabase에 실행 안 하면, 다른 PC에서 pull 받은 코드가 없는 테이블/컬럼을 찔러서 터진다. 실행 여부를 반드시 로그에 남길 것.
- **`profiles`는 한 구성원 = 한 계정.** 가족이 새 이메일로 다시 가입하면 데이터가 갈라진다. 계정을 바꿔야 하면 새로 가입하지 말고 기존 행의 `id`를 옮기거나 기존 계정 비밀번호를 재설정한다.
- **`.env`는 커밋되지 않는다.** 새 PC에서는 `frontend/.env`(Supabase URL·anon key)를 직접 만들어야 앱이 뜬다.
- 미리보기 모드(부모가 자녀 화면 보기)에서 저장 동작을 만들 때는 `viewUserId`가 아니라 **실제 로그인 계정 기준**으로 써야 한다 (`Counsel.jsx`, `Church.jsx` 참고).
- **`profiles` 의 RLS 정책 안에서 `profiles` 를 직접 조회하면 무한재귀가 난다.** 부모 여부를 확인할 땐
  step13 에서 만들어 둔 `is_parent()` (security definer) 를 쓴다. step15 를 쓸 때 그대로 적용될 함정이라
  기획안에도 반영해 뒀다.
- **새 컬럼을 쓰는 select 는 마이그레이션 실행 전까지 쿼리 전체를 실패시킨다.** 컬럼 하나를
  더 달라고 했을 뿐인데 그 select 가 통째로 죽어서 무관한 화면이 빈다.
  `AuthContext.loadAllProfiles()` 처럼 실패 시 컬럼 없이 재시도하는 길을 열어 둘 것.
- `database/` 의 마이그레이션 **번호가 겹쳐 있다** — `step11_fixed_chores` / `step11_schedule`,
  `step12_counsel_church` / `step12_schedule_progress`. 서로 다른 PC에서 같은 번호를 쓴 흔적이라
  파일명만으로는 실행 순서를 알 수 없다. 새로 만들 땐 `git pull` 후 가장 큰 번호 +1 을 쓸 것 (다음은 15).
