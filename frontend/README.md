# FamTalk Frontend (React + PWA)

가성비 스택: **Supabase(무료) + 브라우저 무료 TTS/STT + Vite/React PWA**. 운영비 ₩0 목표.

## 빠른 시작

```bash
cd frontend
npm install

# 1) Supabase 무료 프로젝트 생성 → Settings → API 에서 URL/anon key 복사
cp .env.example .env
#    .env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 붙여넣기

# 2) Supabase SQL Editor 에서 database/schema.sql 실행 (테이블 + RLS)

# 3) 개발 서버
npm run dev          # http://localhost:5173
```

> 환경변수를 안 넣어도 앱은 켜지고 **셋업 안내 화면**이 나옵니다.

## 인증 메모
- 이메일/비밀번호 로그인. Supabase → Authentication → Providers 에서 이메일 확인을
  꺼두면 가입 즉시 로그인됩니다 (가족용이라 편의상 권장).

## 무료 음성 동작
- **듣기(TTS)**: 브라우저 내장 음성합성 — API 비용 0원
- **따라 말하기(STT)**: 브라우저 음성인식 — API 비용 0원 (Chrome 권장)
- 대시보드의 "무료 음성 데모"에서 바로 확인 가능

## 빌드 / 배포
```bash
npm run build        # dist/ 생성 (Cloudflare Pages / Vercel 무료 호스팅에 업로드)
```

## 구조
```
src/
  lib/supabase.js     Supabase 클라이언트
  lib/tts.js          무료 TTS (Web Speech)
  lib/stt.js          무료 STT + 발음 점수
  context/AuthContext 인증 상태
  data/family.js      가족·레벨(A~F) 데이터
  pages/              Login / Dashboard / SetupNotice
  components/VoiceDemo 무료 음성 데모
```
