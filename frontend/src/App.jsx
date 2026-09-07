import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { featureKeyOfPath } from './data/features'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import Words from './pages/Words'
import Chat from './pages/Chat'
import Family from './pages/Family'
import Toefl from './pages/Toefl'
import Guide from './pages/Guide'
import Chores from './pages/Chores'
import Shop from './pages/Shop'
import MathPractice from './pages/Math'
import Quiz from './pages/Quiz'
import Meals from './pages/Meals'
import Sentences from './pages/Sentences'
import Schedule from './pages/Schedule'
import Counsel from './pages/Counsel'
import Talk from './pages/Talk'
import Church from './pages/Church'
import SetupNotice from './pages/SetupNotice'
import GroupHub from './pages/GroupHub'
import Me from './pages/Me'
import Manage from './pages/Manage'
import Career from './pages/Career'
import Exams from './pages/Exams'
import Contest from './pages/Contest'
import Cooking from './pages/Cooking'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreen>불러오는 중…</FullScreen>
  if (!user) return <Navigate to="/login" replace />
  return children
}

// 꺼진 기능에 주소로 직접 들어오면 홈으로 되돌린다.
// (탭에서 감추는 것만으로는 북마크·뒤로가기로 들어올 수 있다)
function Gated({ children }) {
  const { pathname } = useLocation()
  const { canSee } = useAuth()
  const key = featureKeyOfPath(pathname)
  if (key && !canSee(key)) return <Navigate to="/" replace />
  return children
}

function Guarded({ children }) {
  return (
    <Protected>
      <Gated>{children}</Gated>
    </Protected>
  )
}

function FullScreen({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">{children}</div>
  )
}

export default function App() {
  const { isConfigured, loading } = useAuth()

  // Supabase 환경변수가 아직 없으면 셋업 안내 화면
  if (!isConfigured) return <SetupNotice />
  if (loading) return <FullScreen>불러오는 중…</FullScreen>

  return (
    <Routes>
      {/* 공개 사용설명서 — 로그인 없이 열람 (카톡 공유용) */}
      <Route path="/guide" element={<Guide />} />
      <Route path="/login" element={<Login />} />

      {/* 홈 · 그룹 허브 · 나 — 노출 설정과 무관하게 항상 열려 있다 */}
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/g/:groupKey" element={<Protected><GroupHub /></Protected>} />
      <Route path="/me" element={<Protected><Me /></Protected>} />
      {/* 화면 설정 — 부모 전용(페이지 안에서 재검증) */}
      <Route path="/manage" element={<Protected><Manage /></Protected>} />

      {/* ── 배움 */}
      <Route path="/study" element={<Guarded><Study /></Guarded>} />
      <Route path="/words" element={<Guarded><Words /></Guarded>} />
      <Route path="/quiz" element={<Guarded><Quiz /></Guarded>} />
      <Route path="/sentences" element={<Guarded><Sentences /></Guarded>} />
      <Route path="/chat" element={<Guarded><Chat /></Guarded>} />
      <Route path="/math" element={<Guarded><MathPractice /></Guarded>} />
      <Route path="/contest" element={<Guarded><Contest /></Guarded>} />
      <Route path="/toefl" element={<Guarded><Toefl /></Guarded>} />
      <Route path="/exam" element={<Guarded><Exams /></Guarded>} />
      <Route path="/career" element={<Guarded><Career /></Guarded>} />

      {/* ── 집안 */}
      <Route path="/chores" element={<Guarded><Chores /></Guarded>} />
      <Route path="/meals" element={<Guarded><Meals /></Guarded>} />
      <Route path="/cooking" element={<Guarded><Cooking /></Guarded>} />
      <Route path="/schedule" element={<Guarded><Schedule /></Guarded>} />
      <Route path="/shop" element={<Guarded><Shop /></Guarded>} />

      {/* ── 마음 */}
      <Route path="/counsel" element={<Guarded><Counsel /></Guarded>} />
      <Route path="/talk" element={<Guarded><Talk /></Guarded>} />
      <Route path="/family" element={<Guarded><Family /></Guarded>} />

      {/* 교회 교육기획 — 아빠 전용(페이지·서버 양쪽에서 검증) */}
      <Route path="/church" element={<Protected><Church /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
