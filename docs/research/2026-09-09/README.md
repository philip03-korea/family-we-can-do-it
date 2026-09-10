# 스튜디오 구현 · 입시 자료 확인 기록

확인일: 2026-09-09. 자료 연도는 2027학년도다. 하울은 보호자 확인으로 미국 Grade 10이다(2026-09-09). 하음·하울의 목표 입학연도와 LIS 졸업 예정일은 미확정이다. ‘sit’은 SAT로 가정했으며 학교 자체 졸업요건에 SAT 응시 의무가 있는지는 별도 확인 대상이다.

| 대상 | 확인 범위 | 원문 |
|---|---|---|
| 연세대 | 2027 국제형 해외고/검정고시 자격, 단계별 평가, 수능 최저, 활동 기재 제한, 글로벌인재학부 별도 자격 | [최종 수시요강 27~30쪽](https://admission.yonsei.ac.kr/seoul/upload/guide/20260529204109T8NZNJ.PDF) |
| 고려대 | 2026.09.08 수정본 다운로드 후 PDF 3·15·29·39~40쪽 확인. 계열적합 자격, 평가, 면접, 활동증빙 제한 | [수정 공지](https://oku.korea.ac.kr/oku/cms/FR_BBS_CON/BoardView.do?BBS_SEQ=1793&BOARD_SEQ=5&CONTENTS_NO=3&MENU_ID=750&SITE_NO=2) · [PDF 다운로드](https://oku.korea.ac.kr/ajaxfile/FR_SVC/FileDown.do?GBN=X01&BOARD_SEQ=5&SITE_NO=2&BBS_SEQ=1793&FILE_SEQ=5) |
| 국립공주대 | 2027 수시 6월 변경본. 만화애니메이션 실기 종목/규격/시간/날짜, 전문대 수시 횟수 예외 | [요강 59·77쪽](https://ipsi.kongju.ac.kr/download/viewer/1781659024430/index.html) |
| 동서대 | 2027 스텔라예술대학 계열3 통합, 실기 평가/종목, 작품 업로드와 고사일 | [2027 수시요강](https://ipsi.dongseo.ac.kr/_Data/PDFData/3d4a3df6c4cada2ad3cd978d94f48e15.pdf) |
| 청강대 | 공식 2027 Q&A 검색에 수작업 포트폴리오 원본 지참 안내가 나옴. 사이트 원문 요청은 실패하여 전체 요강의 배점/용량/마감은 미검증 | [요강](https://ipsi.ck.ac.kr/bbs/board.php?bo_table=info_2025&wr_id=1) · [공식 답변](https://ipsi.ck.ac.kr/bbs/board.php?bo_table=qna&wr_id=49726) |
| SAT | 시험 구성과 영역별 시간 | [College Board](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure) |
| LIS / MSA | MSA 2022 봄 결정문 PDF 3쪽의 5년 인증 목록에 Lighthouse International School, Korea 확인. 현재 상태와 학교의 정확한 법적 동일성/주소/졸업장 발급 기관은 별도 대조 필요 | [MSA 결정문](https://www.msa-cess.org/wp-content/uploads/2022/04/Spring-2022-Accreditation-Actions.pdf) · [학교](http://liskorea.org/) |

기존 안내에서 수정한 내용:

- 글로벌학부 전체를 어학성적/에세이 중심 전형으로 일반화하지 않는다.
- 근거 없이 제시된 국내대 TOEFL 목표점수와 미국대 SAT/GPA 수치 대신 ‘전형별 확인’을 표시한다.
- 미국 인증, 미국 졸업장, 국내 고졸 학력 인정, 해외 소재 고교 출신 자격을 구분한다.
- 전문대를 포함해 무조건 ‘수시 6개 학교’로 줄이지 않는다. 동일 대학의 전형도 횟수로 계산된다.
- 포트폴리오 컷 수와 공모전 실적을 모든 대학의 필수·가산점처럼 표시하지 않는다.
- 공주대 칸만화와 동서대 실기가 2026.10.24로 겹치는 점을 안내한다. 개인 지원 일정은 미확정이다.
- 대학/학과 탐색 목록과 기존 실기·창작·학습 기능은 보존한다. 확인하지 않은 학교는 검증 배지를 붙이지 않는다.

원문 PDF는 공개 배포물에 복제하지 않고 공식 링크를 제공한다. 실행 데이터의 정본은 `frontend/src/data/admissions2027.js`다. 미래 연도에 사용하기 전 최신 모집요강으로 다시 확인해야 한다.

검증: `node --test tests/studio.test.mjs` 3개 통과. React 실컴포넌트 미리보기에서 가족별 노출, 모바일 가로 넘침, 레시피 저장/단계 체크, 입시 체크, 대학 상세 링크 확인. 운영 로그인·DB 저장·유료 AI 응답은 이 미리보기에서 호출하지 않았다.
