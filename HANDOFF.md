# HANDOFF — 작업 인수인계

여러 대의 컴퓨터에서 번갈아 작업하기 때문에 생기는 혼선을 막기 위한 파일이다.
**push 할 때마다 이 파일의 「작업 로그」 맨 위에 한 항목을 추가한다.**

---

## 0. 새 컴퓨터에서 작업 시작할 때 (매번)

```bash
cd <repo>
git pull                      # ← 항상 먼저. 다른 PC 작업분이 있다
cat HANDOFF.md                # ← 이 파일부터 읽기 (특히 「대기 중」 항목)
cd frontend && npm install    # package.json이 바뀌었을 수 있음
```

`git status`가 지저분하면 **다른 PC에서 커밋을 안 하고 두고 간 것**이다. 덮어쓰기 전에 내용부터 확인할 것.

---

## 1. 지금 상태 (2026-07-28 기준)

- 브랜치: `main` 하나만 사용 (원격 `fix/counsel-blank-screen`은 PR #11 머지 후 잔재, 지워도 됨)
- 프론트: `frontend/` — React + Vite + Tailwind + PWA
- DB/백엔드: Supabase 프로젝트 `ghmroezwdwkvruygrqzv`
- 마이그레이션: `database/stepNN_*.sql` — **자동 적용 안 됨.** Supabase 대시보드 → SQL Editor에 수동 실행
- Edge Functions: `supabase/functions/` (`notify-crisis`, `church` 등)

### ⚠️ 대기 중 (다음 사람이 해야 할 일)

- 없음

---

## 2. 작업 로그 (최신이 위)

### 2026-08-02 — 강점 찾기: 편지처럼 주고받은 두 사람에게만 공개

- **증상**: 가족 대화 → 강점 찾기 하단 "가족이 서로에게 찾아준 강점"이 **모든 구성원의 강점 편지를 전부** 표시. 아빠→하음에게 준 강점을 하울도 봄.
- **원인**: `Talk.jsx` `Strengths` 컴포넌트가 `listStrengths()`가 돌려준 전체 노트(`notes`)를 필터 없이 하단에 렌더.
- **조치**: 편지 개념으로 변경. 나와 관련된 것만 보이게 필터.
  - 상단 "🎁 가족이 본 나의 강점" = 내가 **받은** 것 (`to_member === myKey`) — 기존 유지
  - 하단을 "✉️ 내가 전한 강점" 으로 교체 = 내가 **보낸** 것 (`from_member === myKey`)만 표시 (`fromMe`)
  - 안내문 "강점 편지는 주고받은 두 사람에게만 보여요." 추가
  - 앱이 단일 Supabase 계정 + `member_key` 프로필 구분 구조라 DB RLS로는 구성원 프라이버시 분리 불가 → 클라이언트에서 `member_key` 기준 필터가 올바른 방식. `strength_notes` 스키마/마이그레이션 변경 없음.
- **파일**: `frontend/src/pages/Talk.jsx`
- **남은 것**: 없음. (원한다면 후속으로 `listStrengths`를 서버측에서 `from_member`/`to_member` 조건으로 좁히는 것도 가능하나 공유 계정 구조상 실익 없음.)

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
