# CLAUDE.md — FamTalk 프로젝트 컨텍스트

## 프로젝트 개요
FamTalk은 5인 가족(40대 부모 + 고3 하음 + 고1 하울 + 중1 하람)이 함께 영어를 배우는 자체 개발 앱이다.

## 핵심 설계 원칙
1. **레벨 사다리 A→F**: 하나의 커리큘럼, 각자 시작점 선택 (A=Pre-A1 ~ F=C1)
2. **단어·말하기 중심**: 쓰기는 최소화, 듣기는 입력 보강
3. **발음·억양 체크**: STT + 피치/프로소디 분석으로 발음 점수·억양 시각화
4. **주간 공통 토론**: 매주 1 주제를 가족 전원이 공유, 레벨별 준비 → 모여서 영어 대화
5. **하울 전용 TOEFL 트랙**: 사다리와 별개로 TOEFL iBT 준비·모의고사 체험

## 가족 배치 (추천)
- 하람(중1) → B | 엄마·아빠(40대) → C | 하음(고3) → D | 하울(고1) → E + TOEFL

## 기술 스택
- Frontend: React + PWA + Tailwind
- Backend: Node.js (Express 또는 Nest) 또는 Python (FastAPI)
- DB: PostgreSQL
- AI: LLM API (회화/교정/콘텐츠), TTS (듣기), STT/발음평가 (Whisper + 발음 API)
- Infra: Docker, VPS

## 개발 순서
STEP 1 → 프로젝트 셋업 + 인증
STEP 2 → DB 스키마 + 레벨 시스템 + 단어 SRS(FSRS)
STEP 3 → 개인 학습 UI (단어→말하기→발음·억양)
STEP 4 → AI 연동 (LLM 회화, 프롬프트, 비용관리)
STEP 5 → 가족 소통 (WebSocket 채팅, 주간 주제, 대시보드)
STEP 6 → 하울 TOEFL 모듈 (영역별 훈련, 모의고사 체험, AI 채점)
STEP 7 → 게임화, 배포, 운영

## UI 디자인 시스템
- 레벨별 고유 그라데이션 (시간대 팔레트 레퍼런스):
  - A: 틸→골드 | B: 블루→청록 | C: 인디고→핑크
  - D: 마젠타→오렌지 | E: 네이비→퍼플 | F: 딥틸→틸
- 글자체: Pretendard (볼드 산세리프 통일)
- 모바일 우선, 라디얼 리플 + VOICE 버튼 UI 패턴

## 기획서 위치
docs/기획서_v4.html — 브라우저에서 열면 전체 플랜 확인 가능

## 인수인계 (여러 PC에서 작업)
- 작업 시작 전: `git pull` → `HANDOFF.md` 읽기 (특히 「대기 중」 항목)
- **push 할 때마다 `HANDOFF.md`의 「작업 로그」 맨 위에 항목 추가** (증상/원인/조치/커밋/남은 것)
- `database/*.sql`은 자동 적용이 아니다 — Supabase SQL Editor에서 수동 실행하고, 실행 여부를 로그에 남긴다

## 코딩 컨벤션
- 한국어 주석 OK
- 컴포넌트/파일명은 영어 PascalCase
- API 엔드포인트는 REST, kebab-case
- 환경변수는 .env (gitignore 처리)
