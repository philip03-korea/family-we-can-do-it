# docs/design/screens — 새 화면 디자인 캔버스

2026-09-07 에 추가한 화면들의 디자인 원본이다.
아이별 노출 설정과 하울(입시)·하람(요리) 신규 코너를 다룬다.

기존 `docs/design/` 은 **2026-09-03 의 재구성 기획안**이라 그대로 둔다.
이 폴더는 그 기획을 실제로 구현한 뒤의 화면이다.

## 보기

클릭되는 캔버스: https://claude.ai/code/artifact/6285b461-1c51-4752-9b45-10abe15e04ff

- **화면 설정** 아트보드는 눌러볼 수 있다 — 아이를 바꾸고 스위치를 켜고 끄면
  아래 하단 탭 미리보기가 실시간으로 따라 바뀐다.
- 나머지는 정적 목업이다.

## 파일

| 파일 | 내용 |
|---|---|
| `Nav.dc.html` | 아이별 하단 탭 비교 (5인) |
| `Main.dc.html` | 홈 — 그룹 카드 3개 + 오늘의 학습 (하울 화면) |
| `Manage.dc.html` | 부모용 화면 설정 (인터랙티브) |
| `Career.dc.html` | 대학 가이드 — 대학 목록 (하울의 첫 화면) |
| `Univ.dc.html` | 대학 상세 → 그 대학에서 갈 수 있는 학과 |
| `Webtoon.dc.html` | 웹툰 입시 — 학교 목록 (하음의 첫 화면) |
| `Exam.dc.html` | 문제은행 — 검정고시 6과목 + TOEFL 4영역 |
| `Contest.dc.html` | 수학 경시 — 분야별 문제 풀이 |
| `Cooking.dc.html` | 요리 목록 |
| `Recipe.dc.html` | 레시피 상세 |
| `canvas.json` | 캔버스 배치 · 메모 |

`famtalk-new-screens.html` 은 위 파일들을 합쳐 만든 **생성물**이라 커밋하지 않는다
(2.5MB, `.gitignore` 처리).

## 색·치수는 앱에서 그대로 가져왔다

목업이 실제 앱과 어긋나지 않도록 `frontend/src/index.css` · `tailwind.config.js` 의
값을 그대로 썼다. 특히 `index.css` 가 slate 계열을 한 단계씩 밝게 덮어쓰고 있어
(`text-slate-400` → `#cbd5e1`), 목업에도 **덮어쓴 뒤의 값**을 적었다.
글자 크기도 마찬가지다 (`text-xs` → 12.5px).

레벨 그라데이션은 `tailwind.config.js` 의 `bg-level-*` 정의와 같다.

## 다시 만들기 / 수정하기

`.dc.html` 을 고친 뒤 Claude Code 에서 `/design` 을 부르면 재생성·재발행까지 처리한다.
수동으로 할 경우:

```bash
# <SKILL>은 design 스킬이 풀린 경로
node "<SKILL>/seed-canvas.mjs" \
  --template "<SKILL>/payload.template.html" \
  --out famtalk-new-screens.html \
  --title "FamTalk 새 화면" \
  --artboard Nav.dc.html --artboard Main.dc.html --artboard Manage.dc.html \
  --artboard Career.dc.html --artboard Univ.dc.html --artboard Webtoon.dc.html \
  --artboard Exam.dc.html --artboard Contest.dc.html --artboard Cooking.dc.html \
  --artboard Recipe.dc.html \
  --canvas canvas.json
```
