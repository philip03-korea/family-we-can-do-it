# docs/design — 화면 재구성 기획안

FamTalk 레이아웃·디자인 리뉴얼 기획안의 원본 파일이다.
역할 기반 탭 노출(부모=전체, 아이=배정된 것만)을 다룬다.

## 보기

클릭되는 캔버스: https://claude.ai/code/artifact/a3bb3659-48aa-491e-a60e-615cea4ba362

- **홈** — 위쪽 다섯 얼굴을 누르면 화면과 하단 탭이 그 사람 기준으로 바뀐다
- **화면 설정** — 스위치를 켜고 끄면 하단 띠에 그 아이의 탭 구성이 실시간 반영
- **그룹 허브(배움) / 하단 탭 규칙 / 정보구조 Before·After / 구현 명세**

## 파일

| 파일 | 내용 |
|---|---|
| `Main.dc.html` | 홈 — 구성원별 화면 (인터랙티브) |
| `Manage.dc.html` | 부모용 화면 설정 (인터랙티브) |
| `Learn.dc.html` | 그룹 허브 예시 — 배움 탭 |
| `Nav.dc.html` | 하단 탭 생성 규칙 (5인 비교) |
| `IA.dc.html` | 정보구조 Before / After |
| `Spec.dc.html` | 데이터 모델 · 코드 변경 · 적용 순서 |
| `canvas.json` | 캔버스 배치 |

`famtalk-layout-plan.html`은 위 파일들을 합쳐 만든 **생성물**이라 커밋하지 않는다
(2.5MB, `.gitignore` 처리). 아래 명령으로 언제든 다시 만든다.

## 다시 만들기 / 수정하기

`.dc.html`을 고친 뒤 Claude Code에서 `/design`을 부르면 재생성·재발행까지 처리한다.
수동으로 할 경우:

```bash
# <SKILL>은 design 스킬이 풀린 경로
node "<SKILL>/seed-canvas.mjs" \
  --template "<SKILL>/payload.template.html" \
  --out famtalk-layout-plan.html \
  --title "FamTalk 화면 재구성" \
  --artboard Main.dc.html --artboard Manage.dc.html --artboard Learn.dc.html \
  --artboard Nav.dc.html --artboard IA.dc.html --artboard Spec.dc.html \
  --canvas canvas.json
```

## 아직 정해지지 않은 것

- 캔버스에 적힌 **아이별 노출 설정은 예시**다 (하음: 수학·TOEFL 꺼둠 / 하람: 마음 그룹 전체 꺼둠).
  실제로 누구에게 무엇을 열지는 가족이 정해야 한다.
- 홈에서 뺄지 확인 필요: **음성 데모(TTS/STT)**, **레벨 사다리 A~F 6줄**.
