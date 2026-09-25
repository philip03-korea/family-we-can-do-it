import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

// 학습 노트 — 아이별 공부 노트를 앱 안에서 바로 본다.
//
// 노트 본문은 `frontend/public/notes/*.html` 정적 파일이고 여기서는 iframe 으로 띄운다.
// 노트마다 자체 글꼴·스타일·스크립트를 갖고 있어서, iframe 으로 감싸야 앱 스타일과 서로 안 깨진다.
// 새 노트를 추가할 때: public/notes/ 에 html 을 넣고 아래 NOTES 배열에 한 줄 추가하면 끝.
const NOTES = [
  {
    id: 'haul-worldhistory-ch17',
    owner: 'haul',
    who: '하울',
    emoji: '🌍',
    subject: '세계사',
    title: 'Ch.17 대항해시대',
    desc: '교과서 24쪽 + 수업 슬라이드 33장을 페이지별로 요약했어요.',
    tags: ['세계사 큰 틀 시대표', '영어 단어 70+', '시험 대비 Q&A 10', '그림 8장'],
    file: '/notes/haul-worldhistory-ch17.html',
    updated: '2026-09-25',
  },
  {
    id: 'haeum-interview',
    owner: 'haeum',
    who: '하음',
    emoji: '🎤',
    subject: '웹툰 입시',
    title: '면접 노트',
    desc: '청강대·백석예대·한국영상대 면접을 학교별로 정리했어요.',
    tags: ['예상질문 6유형', '모의면접 대본 2회차', '즉석 드로잉 채점표', '포폴 코멘트'],
    file: '/notes/haeum-interview-note.html',
    updated: '2026-09-25',
  },
]

export default function Notes() {
  const [params, setParams] = useSearchParams()
  const { profile } = useAuth()
  const me = profile?.member_key

  // 내 노트를 앞으로 — 부모는 원래 순서대로 전부 본다
  const list = useMemo(() => {
    if (!me) return NOTES
    return [...NOTES].sort((a, b) => (a.owner === me ? -1 : 0) - (b.owner === me ? -1 : 0))
  }, [me])

  const open = params.get('note')
  const note = open ? NOTES.find((n) => n.id === open) : null

  // ── 노트 보기
  if (note) {
    return (
      <div className="min-h-screen mx-auto max-w-4xl px-3 pt-4 pb-28">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setParams({})} className="text-slate-400 text-sm">← 노트 목록</button>
          <a
            href={note.file}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300"
          >
            새 탭에서 크게 보기 ↗
          </a>
        </div>

        <h1 className="text-xl font-black mb-1">
          {note.emoji} {note.who}의 {note.subject} · {note.title}
        </h1>
        <p className="text-xs text-slate-400 mb-3">{note.updated} 기준 · 인쇄하려면 새 탭에서 열고 Ctrl/⌘ + P</p>

        <iframe
          src={note.file}
          title={`${note.who} ${note.subject} ${note.title}`}
          loading="lazy"
          className="w-full rounded-2xl border border-slate-700 bg-white"
          style={{ height: 'calc(100vh - 210px)', minHeight: 420 }}
        />

        <BottomNav />
      </div>
    )
  }

  // ── 노트 목록
  return (
    <div className="min-h-screen max-w-md mx-auto p-5 pb-28">
      <h1 className="text-2xl font-black mb-1">📓 학습 노트</h1>
      <p className="text-sm text-slate-400 mb-5">수업 자료를 정리해 둔 노트예요. 눌러서 바로 읽고, 시험 전에 다시 보세요.</p>

      <div className="space-y-3">
        {list.map((n) => (
          <button
            key={n.id}
            onClick={() => setParams({ note: n.id })}
            className="w-full text-left rounded-2xl border border-slate-700 bg-slate-800/60 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{n.emoji}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">
                {n.who} · {n.subject}
              </span>
              <span className="ml-auto text-xs text-slate-500">{n.updated}</span>
            </div>
            <div className="font-bold">{n.title}</div>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{n.desc}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {n.tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-700 text-slate-400">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-6 leading-relaxed">
        새 단원 교과서를 올려주면 노트에 챕터를 이어서 붙여요.
      </p>

      <BottomNav />
    </div>
  )
}
