import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { SOURCES, VERIFIED_AT, HAUL_PROFILE, VERIFIED_SCHOOLS, HAUL_STEPS, HAEUM_STEPS, HAUL_CHECKS, HAEUM_CHECKS } from '../data/admissions2027'

export function SourceLink({ id }) {
  const source = SOURCES[id]
  return source ? <a className="source-link" href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a> : null
}
export function SchoolEvidence({ schoolKey }) {
  const s = VERIFIED_SCHOOLS[schoolKey]
  if (!s) return <aside className="admission-card"><span className="admission-status">지원 연도 요강 대조 필요</span><p>학과 탐색용 정보입니다. 이 대학의 최신 전형별 지원자격·점수·일정은 아직 검증하지 않았습니다.</p></aside>
  return <article className="admission-card"><span className="admission-status">{SOURCES[s.source].status} · {VERIFIED_AT}</span><h3>{s.name}</h3><p><strong>{s.title}</strong></p><ul>{s.facts.map(f => <li key={f}>{f}</li>)}</ul><p style={{ marginTop: 12 }}><strong>다음 행동</strong> · {s.next}</p><SourceLink id={s.source}/>{schoolKey === 'ck' && <><br/><SourceLink id="ckqa"/></>}</article>
}
function Checklist({ kind }) {
  const { profile } = useAuth()
  const storageKey = `famtalk:admissions:${kind}:${profile?.member_key || 'me'}:2027`
  const read = () => { try { const v = JSON.parse(localStorage.getItem(storageKey)); return Array.isArray(v) ? v : [] } catch { return [] } }
  const [checked, setChecked] = useState(read)
  const [error, setError] = useState(false)
  useEffect(() => { setChecked(read()); setError(false) }, [storageKey])
  const items = kind === 'haul' ? HAUL_CHECKS : HAEUM_CHECKS
  const toggle = item => {
    const next = checked.includes(item) ? checked.filter(x => x !== item) : [...checked, item]
    setChecked(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setError(false) } catch { setError(true) }
  }
  return <section className="admission-card"><h3>나의 준비 체크</h3><small>이 브라우저에 저장돼요. 다른 기기와 동기화되지 않아요.</small>{items.map(item => <label className="admission-check" key={item}><input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)}/><span>{item}</span></label>)}{error && <p role="status">브라우저 저장이 차단되어 새로고침하면 체크가 사라져요.</p>}</section>
}
export default function AdmissionGuide({ kind }) {
  const haul = kind === 'haul'
  const steps = haul ? HAUL_STEPS : HAEUM_STEPS
  return <section className="admission-guide">
    {haul && <p className="studio-pill">미국 Grade {HAUL_PROFILE.usGrade} · 보호자 확인</p>}
    <div className="admission-intro"><span className="admission-status">2027 모집요강 참고 · {VERIFIED_AT} 확인</span><h2>{haul ? '내가 갈 수 있는 길부터,\n정확하게.' : '나의 이야기가\n대학으로 이어지도록.'}</h2><p>{haul ? '미국 졸업장 → 지원자격 확인 → 전형 선택 → 필요한 시험과 활동. 순서가 중요해요.' : '학교 이름보다 먼저 볼 것: 실기 종목, 작품 규격, 제출 마감. 확인한 요강을 바탕으로 준비해요.'}</p><small>목표 입학연도·졸업 시기는 확인 중입니다. 아래 날짜를 개인 일정으로 자동 확정하지 않습니다.</small></div>
    {haul && <article className="admission-card"><h3>등대글로벌에서 먼저 받아올 서류</h3><p>졸업장 발급 기관, 학교 주소와 실제 재학 국가, 이수 학년·학점, 최신 인증서와 유효기간, 국내 학력 인정 근거를 확인해요. 미국의 학교 인증과 국내 대학의 해외고 자격은 별개의 판단입니다.</p><p>MSA의 2022 봄 결정문에는 한국 Lighthouse International School이 5년 인증 항목에 나옵니다. 과거 기록만으로 현재 인증·미국 주정부 라이선스·하울이의 졸업장 효력을 확정하지 않습니다.</p><SourceLink id="msa"/><br/><SourceLink id="lis"/></article>}
    <div className="admission-card"><h3>{haul ? '하울의 준비 로드맵' : '하음의 웹툰 입시 로드맵'}</h3><div className="admission-steps">{steps.map(([title, text]) => <div key={title}><section><h3>{title}</h3><p>{text}</p></section></div>)}</div></div>
    <h2 className="font-bold mt-6">{haul ? '전형별로 확인한 조건' : '웹툰 중심으로 확인한 학교'}</h2>
    {(haul ? ['yonsei', 'korea'] : ['kongju', 'dongseo', 'ck']).map(k => <SchoolEvidence key={k} schoolKey={k}/>)}
    {haul ? <article className="admission-card"><h3>SAT, 꼭 봐야 할까?</h3><p>말씀하신 ‘sit’은 SAT로 가정해 안내합니다. SAT는 Reading and Writing 64분 + Math 70분으로 구성됩니다. 국내 글로벌학부 공통 필수 조건은 아닙니다.</p><ul><li>필수: 선택한 전형의 요강에서 필수라고 명시한 경우에 준비</li><li>선택: 제출을 허용한다면 시간·비용 대비 활용도 판단</li><li>미반영/제출 불가: 점수를 만들어도 그 전형의 강점으로 제출할 수 없음</li><li>확인 전: 학원·응시 일정부터 확정하지 않고 입학처에 질문</li></ul><p>영어 수업 경험은 지문 이해·토론·면접 연습에 활용할 수 있어요. SAT, 대회 수상, 봉사 시간을 일괄 가산점으로 표시하지 않아요.</p><SourceLink id="sat"/></article> : <article className="admission-card"><h3>지원 횟수와 실기 중복을 함께 확인</h3><p>일반대학 수시는 전형 기준 6회 제한이 적용됩니다. 산업대학·전문대학 지원은 횟수에서 제외됩니다. 청강 같은 전문대까지 포함해 무조건 ‘6개 학교’로 줄이지 마세요. 대학 자체 복수지원 규칙과 수시 합격 후 정시 지원 제한도 확인해야 합니다.</p><SourceLink id="kongju"/></article>}
    <Checklist kind={kind}/>
  </section>
}
