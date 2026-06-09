// Supabase 환경변수가 설정되지 않았을 때 보여주는 안내 화면
export default function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-slate-800/60 rounded-3xl p-8 border border-slate-700">
        <div className="text-4xl mb-3">🏠🔥</div>
        <h1 className="text-2xl font-bold mb-2">FamTalk 셋업이 거의 끝났어요</h1>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
          무료 Supabase 프로젝트를 연결하면 로그인·데이터·저장소가 모두 무료로 켜집니다.
        </p>
        <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
          <li>
            <a className="text-indigo-400 underline" href="https://supabase.com" target="_blank" rel="noreferrer">
              supabase.com
            </a>{' '}
            에서 무료 프로젝트 생성
          </li>
          <li>Project Settings → API 에서 <b>URL</b>과 <b>anon key</b> 복사</li>
          <li>
            <code className="bg-slate-900 px-1.5 py-0.5 rounded">frontend/.env</code> 파일에 붙여넣기
            (<code className="bg-slate-900 px-1.5 py-0.5 rounded">.env.example</code> 참고)
          </li>
          <li>
            <code className="bg-slate-900 px-1.5 py-0.5 rounded">database/schema.sql</code> 을 Supabase SQL
            Editor에 실행
          </li>
          <li>개발 서버 재시작 (<code className="bg-slate-900 px-1.5 py-0.5 rounded">npm run dev</code>)</li>
        </ol>
        <p className="mt-6 text-xs text-slate-500">
          💡 anon key는 공개돼도 안전합니다 — 데이터는 RLS(행 수준 보안)로 보호됩니다.
        </p>
      </div>
    </div>
  )
}
