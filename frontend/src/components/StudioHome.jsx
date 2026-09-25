import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FAMILY } from '../data/family'
import { FEATURES } from '../data/features'
import FoodArt from './FoodArt'
import BottomNav from './BottomNav'

const THEMES = {
  haeum: { eyebrow: 'CREATIVE STUDIO', title: '상상한 이야기를,\n나의 다음 장면으로.', text: '하음이의 웹툰과 대학 준비. 오늘은 한 장면부터 시작해 봐.', art: 'YOUR\nSTORY.', feature: 'webtoon', cta: '웹툰 입시 스튜디오', note: '잘 그리는 것만큼, 끝까지 이야기해 보는 것도 중요해.', actions: ['webtoon', 'study', 'talk'] },
  haul: { eyebrow: 'NEXT CHAPTER', title: '나의 가능성을,\n더 넓은 세상으로.', text: '하울이의 대학 로드맵. 지원 조건을 확인하고 한 단계씩 준비하자.', art: 'YOUR\nNEXT.', feature: 'career', cta: '글로벌 대학 로드맵', note: '남의 속도보다, 내가 가려는 방향을 알아가는 시간.', actions: ['career', 'exam', 'toefl'] },
  haram: { eyebrow: 'KITCHEN STUDIO', title: '오늘의 호기심이,\n맛있는 한 접시로.', text: '하람이의 작은 주방. 만들고 싶은 요리를 골라 내 손으로 완성해 봐.', art: 'MADE\nBY ME.', feature: 'cooking', cta: '오늘 만들 요리 고르기', note: '조금 달라도 괜찮아. 직접 만든 첫 접시는 특별하니까.', actions: ['cooking', 'meals', 'schedule'] },
  parent: { eyebrow: 'FAMILY STUDIO', title: '각자의 꿈이 자라는,\n우리 가족의 공간.', text: '하음의 웹툰, 하울의 진학, 하람의 요리. 필요한 순간에 함께해 주세요.', art: 'GROW\nTOGETHER.', feature: 'family', cta: '가족 현황 살펴보기', note: '결과를 묻기 전에, 오늘 재미있었던 일을 물어봐 주세요.', actions: ['webtoon', 'career', 'cooking'] },
}

// 히어로에서 옆으로 밀면 나오는 추가 카드.
// 첫 장은 위 THEMES 의 「지금 나에게 중요한 것」이고, 그다음부터 여기 카드가 이어진다.
// 꺼져 있는 기능(feature)은 자동으로 빠진다.
const EXTRA_SLIDES = {
  haul: [
    {
      feature: 'notes',
      route: '/notes?note=haul-worldhistory-ch17',
      pill: '이번 주 공부',
      title: '대항해시대를,\n한 장에 정리했어.',
      text: '교과서 24쪽과 수업 슬라이드를 페이지별로 묶었어. 영어 단어와 시험 질문, 그림까지 한 번에.',
      cta: '세계사 노트 열기',
      art: 'CH.17\nNOTE.',
      sticker: '그림 8장과 함께',
    },
  ],
  parent: [
    {
      feature: 'notes',
      route: '/notes?note=haul-worldhistory-ch17',
      pill: '아이가 배우는 것',
      title: '하울이의 세계사,\n같이 들여다볼까요.',
      text: '지금 배우는 대항해시대를 페이지별로 정리한 노트예요. 무엇을 배우는지 한눈에 보입니다.',
      cta: '하울이 세계사 노트',
      art: 'CH.17\nNOTE.',
      sticker: '함께 보는 공부',
    },
  ],
}

export default function StudioHome({ stats, streak, points, interests = [] }) {
  const { profile, ownProfile, allProfiles, isParent, isViewing, setViewAs, visibleFeatures } = useAuth()
  const navigate = useNavigate()
  const key = profile.member_key
  const theme = THEMES[key] || THEMES.parent
  const allowed = FEATURES.filter(f => visibleFeatures.includes(f.key))
  const primary = allowed.find(f => f.key === theme.feature)
  const actions = theme.actions.map(k => allowed.find(f => f.key === k)).filter(Boolean)

  // 히어로 카드들 — 첫 장(기본) + 켜져 있는 추가 카드
  const slides = [
    { key: 'primary', pill: '지금 나에게 중요한 것', title: theme.title, text: theme.text, cta: theme.cta, route: primary?.route, art: theme.art, kitchen: key === 'haram', sticker: key === 'haeum' ? '한 컷씩, 나의 이야기' : key === 'haul' ? 'MAKE IT YOURS' : '우리답게, 함께' },
    // 부모가 자녀 화면을 미리 볼 때는 그 아이의 카드를 그대로 보여준다
    ...(EXTRA_SLIDES[key] || (key === 'mom' || key === 'dad' ? EXTRA_SLIDES.parent : []))
      .filter(s => visibleFeatures.includes(s.feature))
      .map(s => ({ ...s, key: s.feature })),
  ]

  const deckRef = useRef(null)
  const [active, setActive] = useState(0)

  // 어느 카드가 가운데 있는지 — 점 표시를 맞춰 준다
  const onScroll = useCallback(() => {
    const deck = deckRef.current
    if (!deck) return
    const mid = deck.scrollLeft + deck.clientWidth / 2
    let best = 0
    for (let i = 0; i < deck.children.length; i++) {
      const c = deck.children[i]
      if (c.offsetLeft - deck.offsetLeft <= mid) best = i
    }
    setActive(best)
  }, [])

  function goTo(i) {
    const deck = deckRef.current
    const c = deck?.children[i]
    if (!deck || !c) return
    deck.scrollTo({ left: c.offsetLeft - deck.offsetLeft, behavior: 'smooth' })
  }

  return <div className="studio-home">
    <header className="studio-topline"><a href="/" className="studio-wordmark">fam<span>talk</span><i> / 나만의 스튜디오</i></a><button className="studio-avatar" onClick={() => navigate('/me')} aria-label="내 정보">{profile.display_name?.slice(0, 1)}<span>{profile.display_name}</span></button></header>
    {isParent && <div className="studio-family-switch" aria-label="가족 화면 미리보기">
      <span>함께 보기</span>{allProfiles.map(p => <button key={p.id} aria-pressed={profile.member_key === p.member_key} onClick={() => setViewAs(p.member_key === ownProfile.member_key ? null : p.member_key)}>{p.display_name}</button>)}
      <button onClick={() => navigate('/manage')} className="studio-settings">노출 설정 ↗</button>
      {isViewing && <small>자녀 화면 미리보기</small>}
    </div>}
    <div className="studio-greeting"><p className="studio-kicker">{theme.eyebrow}</p><h1>{profile.display_name}의 스튜디오<span className="sparkle" aria-hidden="true">✳</span></h1><p>오늘도, 나답게 한 걸음.</p></div>

    <div className="studio-hero-deck" ref={deckRef} onScroll={onScroll} aria-label="오늘의 카드 — 옆으로 밀어 넘기기">
      {slides.map((s) => (
        <section className="studio-hero" key={s.key}>
          <div className="studio-hero-copy">
            <span className="studio-pill">{s.pill}</span>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            {s.route
              ? <button className="studio-primary" onClick={() => navigate(s.route)}>{s.cta}<span>↗</span></button>
              : <p className="studio-muted">켜진 활동을 아래에서 골라 보세요.</p>}
          </div>
          <div className={`studio-hero-art ${s.kitchen ? 'kitchen' : ''}`} aria-hidden="true">
            {s.kitchen
              ? <><FoodArt id="r5" name="크로플" /><span className="art-sticker">MY LITTLE KITCHEN</span></>
              : <><span className="art-orbit" /><span className="art-paper back" /><span className="art-paper front">{s.art}<i>✦</i></span><span className="art-sticker">{s.sticker}</span></>}
          </div>
        </section>
      ))}
    </div>
    {slides.length > 1 && <div className="studio-deck-nav">
      <span className="studio-deck-hint">옆으로 밀어 보세요</span>
      <div className="studio-deck-dots">
        {slides.map((s, i) => (
          <button key={s.key} className={i === active ? 'on' : ''} aria-label={`${i + 1}번째 카드 보기`} aria-current={i === active ? 'true' : undefined} onClick={() => goTo(i)} />
        ))}
      </div>
    </div>}

    <section className="studio-section"><div className="studio-section-head"><h2>{key === 'haram' ? '주방에 들어가기 전' : '오늘 이어갈 활동'}</h2><span>작은 시작이면 충분해요</span></div><div className="studio-actions">{actions.map((f, i) => <button key={f.key} className="studio-action" onClick={() => navigate(f.route)}><span className="action-number">0{i + 1}</span><span className="action-icon">{f.emoji}</span><strong>{f.name}</strong><p>{f.desc}</p><span className="action-arrow">↗</span></button>)}</div></section>
    {key === 'haram' && primary && <section className="studio-section"><div className="studio-section-head"><h2>어떤 맛을 만들어 볼까?</h2><button onClick={() => navigate('/cooking')}>레시피 전체 ↗</button></div><div className="studio-recipe-row">{[['r3', '요거트 아이스크림', '불 없이 차갑게'], ['r8', '에그 샌드위치', '달걀 조리는 어른과'], ['r16', '치즈 콘', '뜨거운 그릇 조심']].map(([id, name, desc]) => <button key={id} onClick={() => navigate(`/cooking?recipe=${id}`)}><FoodArt id={id} name={name}/><strong>{name}</strong><span>{desc}</span></button>)}</div></section>}
    <aside className="studio-note"><span aria-hidden="true">✳</span><p>{theme.note}</p><small>A LITTLE NOTE FOR YOU</small></aside>
    <section className="studio-section"><div className="studio-section-head"><h2>{isParent && !isViewing ? '우리 가족의 모든 활동' : '나의 활동 서랍'}</h2><span>{allowed.length}개의 활동</span></div><div className="studio-drawer">{allowed.map(f => <button key={f.key} onClick={() => navigate(f.route)}><span>{f.emoji}</span><strong>{f.name}</strong><i>↗</i></button>)}</div></section>
    {visibleFeatures.includes('study') && <section className="studio-learning"><div><span className="studio-kicker">MY ENGLISH</span><h2>영어도, 조금씩 꾸준히.</h2><p>레벨 {profile.level} · {streak == null ? '학습 기록을 확인하고 있어요' : `${streak.streak}일 연속 학습`}{points != null ? ` · ${points} 포인트` : ''}</p></div><button className="studio-primary" onClick={() => navigate('/study')}>학습 이어가기 ↗</button>{stats && <p className="studio-interest">학습한 단어 {stats.learned}/{stats.total} · 복습 대기 {stats.dueCount} · 새 단어 {stats.freshCount}</p>}{interests.length > 0 && <div className="studio-interest">{interests.map(i => <button key={i.cat} onClick={() => navigate(`/study?cat=${i.cat}`)}>{i.label}</button>)}</div>}</section>}
    <footer className="studio-footer">OUR FAMILY, OUR OWN PACE. <span>FamTalk</span></footer><BottomNav/>
  </div>
}
