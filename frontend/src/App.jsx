import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
