# 실제 컴포넌트 로컬 미리보기

`frontend`에서 `npx vite --config dev/vite.config.mjs` 실행 후
[미리보기](http://127.0.0.1:5174/dev/studio-preview.html)를 연다.

실제 StudioHome, Career, Webtoon, Cooking, GroupHub 컴포넌트를 사용한다. 이 설정에서만 AuthContext와 tutor 호출을 대체한다. 예시 프로필이며 서버 저장이나 유료 AI 호출을 하지 않는다. 나머지 기존 기능은 실제 앱 로그인 후 이용한다.

운영 앱: `npm run dev` / 빌드: `npm run build`. 운영 빌드 진입점은 index.html 하나이며 dev 프로필은 포함되지 않는다. 이 미리보기 서버를 외부에 배포하지 않는다.

체크리스트와 레시피 저장함은 미리보기 origin의 localStorage에 남는다. 운영 데이터와 분리된다.
