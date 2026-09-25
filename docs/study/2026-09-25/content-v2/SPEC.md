# 하울이 세계사 노트 — 페이지 콘텐츠 작업 규격

고1 학생(하울)이 볼 학습 노트에 들어갈 데이터를 만든다.
화면에서는 **영어 원문만 보이고**, 문장을 누르면 한국어 해석이 나온다.
단어를 더블클릭하면 그 단어 설명이 뜬다. 그래서 원문·해석·단어가 정확해야 한다.

## 읽을 파일

페이지는 이미 이미지로 만들어 두었다. **PDF를 열지 말고 이 이미지를 Read 로 본다.**

```
C:\Users\User\AppData\Local\Temp\claude\D--dev-family-we-can-do-it\a3ed036f-639f-49ab-9541-11c48042d3a1\scratchpad\pages\
  tb01.webp ~ tb24.webp   교과서 Chapter 17 (24쪽)
  sl01.webp ~ sl33.webp   수업 슬라이드 (33장)
```

## 만들 파일

JSON 하나. 경로는 각자 지시에 적혀 있다. **JSON 외에 다른 것을 쓰지 않는다.**
UTF-8. 최상위는 배열이며, 배열의 원소 하나가 페이지 하나다.

## 스키마 (교과서)

```json
[{
  "id": "tb05",
  "book": "385",
  "title": "금·영광·신 + 항해 기술",
  "summary": "탐험의 세 가지 동기와, 먼 바다를 가능하게 한 새 기술을 설명한다.",
  "keypoints": ["Gold·Glory·God", "카라벨과 삼각돛", "아스트롤라베·나침반", "무역풍과 편서풍"],
  "blocks": [
    { "kind": "heading", "en": "A Race for Riches", "ko": "부를 향한 경쟁" },
    { "kind": "guide", "en": "How were Spain and Portugal able to take the lead in discovering new lands?",
      "ko": "스페인과 포르투갈은 어떻게 새로운 땅을 먼저 발견할 수 있었을까?" },
    { "kind": "p", "sentences": [
      { "en": "It has been said that \"Gold, glory, and God\" were the key motives for European expansion.",
        "ko": "유럽 팽창의 핵심 동기는 \"금, 영광, 신\"이었다고 이야기한다.",
        "important": true,
        "note": "이 단원 전체를 꿰는 한 줄이야. 시험에서 '탐험의 동기'를 물으면 이 셋으로 답하면 돼. 금=경제, 영광=명예, 신=기독교 전파.",
        "words": [
          { "w": "motive", "ko": "동기", "x": "무언가를 하게 만든 이유. motivation 과 같은 뿌리야." },
          { "w": "expansion", "ko": "팽창, 확장", "x": "영토나 영향력을 넓히는 것. expand(넓히다)의 명사형." }
        ] },
      { "en": "This statement suggests another reason for the overseas voyages: religious zeal.",
        "ko": "이 말은 해외 항해의 또 다른 이유, 곧 종교적 열정을 가리킨다.",
        "words": [ { "w": "zeal", "ko": "열정, 열의", "x": "religious zeal = 종교적 열정. 아주 강한 의욕을 뜻해." } ] }
    ] },
    { "kind": "gloss", "en": "caravel", "ko": "카라벨선",
      "def_en": "a small, fast, maneuverable ship that had a large cargo hold and usually three masts with lateen sails",
      "def_ko": "작고 빠르며 방향을 잘 바꾸는 배. 짐칸이 크고 보통 삼각돛을 단 돛대 세 개가 있다.",
      "note": "교과서가 굵게 표시한 핵심 용어야. 이 배 덕분에 먼 바다로 나갈 수 있었어." },
    { "kind": "figure", "en": "A Portuguese caravel", "ko": "포르투갈의 카라벨선",
      "where": "오른쪽 아래 큰 판화",
      "note": "돛이 삼각형인 걸 확인해 봐. 저 삼각돛(lateen)이 아랍에서 온 기술이고, 바람을 거슬러 갈 수 있게 해 줬어." },
    { "kind": "check", "en": "Explaining  What does the phrase \"Gold, glory, and God\" mean?",
      "ko": "설명하기  \"금, 영광, 신\"이라는 말은 무슨 뜻일까?",
      "note": "교과서가 직접 묻는 질문이라 시험에 나올 확률이 높아. 세 단어를 각각 한 줄로 답할 수 있어야 해." }
  ]
}]
```

### block 종류

| kind | 무엇 |
|---|---|
| `heading` | 페이지에 인쇄된 소제목 (빨강·파랑 제목) |
| `guide` | GUIDING QUESTION / Essential Question |
| `p` | 본문 문단. `sentences` 배열을 갖는다 |
| `gloss` | 여백의 용어 풀이 (교과서가 노란색으로 표시한 단어) |
| `figure` | 사진·그림·지도·도표. 본문이 아니라 그림 설명 |
| `check` | READING PROGRESS CHECK, 연습문제, 단원 질문 |
| `quote` | 인용 사료(1차 사료). `sentences` 를 갖는다 |

## 규칙

1. **영어는 인쇄된 그대로 옮긴다.** 철자·대소문자·따옴표를 바꾸지 않는다. 스캔이라 흐린 글자는
   문맥으로 복원하되, 끝내 안 보이면 그 문장을 통째로 뺀다. 지어내지 않는다.
2. **문장 단위로 쪼갠다.** 마침표 기준. 너무 긴 문장은 그대로 둔다(자르지 않는다).
3. **한국어 해석은 자연스럽게.** 직역투("~되어진다")를 피하고, 고1이 소리 내어 읽었을 때
   바로 이해되는 문장으로. 존댓말 말고 **반말**로 쓴다(친구가 설명해 주는 톤).
4. `important` 는 **정말 중요한 문장에만** true. 한 페이지에 2~4개면 충분하다.
   시험에 나올 정의·연도·인과관계·비교 포인트가 기준이다.
5. `note` 는 `important` 문장과 `figure`·`check` 에만. 2~4문장. **왜 중요한지, 무엇과 연결되는지**를
   쓴다. 해석을 다시 쓰는 게 아니다. 앞뒤 단원(르네상스, 산업혁명, 라틴아메리카 독립)과 연결되면 좋다.
6. `words` 는 그 문장에서 **모르면 막히는 단어만** 1~3개. 쉬운 단어는 넣지 않는다.
   `x` 는 한 줄 설명(한국어). 같은 단어가 여러 번 나오면 **처음 한 번만** 넣는다.
7. 페이지 번호, 사진 저작권 표기(©...), "There's More Online!", 출판사 주소 같은 건 옮기지 않는다.
   단 인쇄된 쪽 번호는 `book` 에 숫자만 넣는다(예: "385"). 쪽 번호가 안 보이면 빈 문자열.
8. `title` 과 `summary` 는 한국어. `title` 은 12자 내외, `summary` 는 한 문장.
9. 지도·연표·사진이 페이지의 절반 이상을 차지하면 `figure` 블록으로 충실히 설명한다.
   지도는 **무엇을 비교해 보라는 지도인지**를 쓴다.
10. 블록 순서는 **사람이 읽는 순서**를 따른다(왼쪽 위 → 오른쪽 아래).

## 슬라이드용 추가 규칙

슬라이드는 글자가 적고 그림이 크다. 같은 스키마를 쓰되:

- `id` 는 `"sl09"` 형식, `book` 은 빈 문자열.
- 글머리표(•, –)는 `p` 블록의 문장 하나로 본다. 마침표가 없어도 한 항목 = 한 문장.
- 글자가 없고 그림만 있는 장은 `figure` 블록 하나로 만들고, **무슨 그림인지 보고 설명**한다.
  (지도인지, 사진인지, 인물인지, 도표인지. 그림만 있는 장도 건너뛰지 말 것)
- 교과서에 없고 슬라이드에만 있는 내용(튤립 버블, 명칭 논쟁, 콜럼버스의 날, 결론의 환경 문제)은
  `note` 에 **"교과서에 없는 수업 추가 내용"** 이라고 적어 둔다. 시험에 나올 수 있다.

## 마지막 점검

- JSON 이 문법적으로 올바른가 (마지막 쉼표, 따옴표 이스케이프)
- 모든 페이지가 들어갔는가 (담당 범위 전부, 빈 페이지도 포함)
- 영어 원문에 오타를 새로 만들지 않았는가
