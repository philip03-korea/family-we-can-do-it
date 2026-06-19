import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
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
import SetupNotice from './pages/SetupNotice'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreen>불러오는 중…</FullScreen>
  if (!user) return <Navigate to="/login" replace />
  return children
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
      <Route
        path="/"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/study"
        element={
          <Protected>
            <Study />
          </Protected>
        }
      />
      <Route
        path="/words"
        element={
          <Protected>
            <Words />
          </Protected>
        }
      />
      <Route
        path="/chat"
        element={
          <Protected>
            <Chat />
          </Protected>
        }
      />
      <Route
        path="/family"
        element={
          <Protected>
            <Family />
          </Protected>
        }
      />
      <Route
        path="/toefl"
        element={
          <Protected>
            <Toefl />
          </Protected>
        }
      />
      <Route
        path="/chores"
        element={
          <Protected>
            <Chores />
          </Protected>
        }
      />
      <Route
        path="/shop"
        element={
          <Protected>
            <Shop />
          </Protected>
        }
      />
      <Route
        path="/math"
        element={
          <Protected>
            <MathPractice />
          </Protected>
        }
      />
      <Route
        path="/quiz"
        element={
          <Protected>
            <Quiz />
          </Protected>
        }
      />
      <Route
        path="/meals"
        element={
          <Protected>
            <Meals />
          </Protected>
        }
      />
      <Route
        path="/sentences"
        element={
          <Protected>
            <Sentences />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
