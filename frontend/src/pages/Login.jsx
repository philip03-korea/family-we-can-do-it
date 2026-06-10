import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/', { replace: true })
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMsg('가입 완료! 이메일 확인 후 로그인하세요. (Supabase 설정에서 이메일 확인을 꺼두면 바로 로그인 가능)')
        setMode('signin')
      }
    } catch (err) {
      setMsg('⚠️ ' + (err.message || '오류가 발생했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🏠🔥</div>
          <h1 className="text-3xl font-bold">FamTalk</h1>
          <p className="text-slate-400 text-sm mt-1">우리 가족 영어 사다리 A→F</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-800/60 p-6 rounded-3xl border border-slate-700">
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl font-bold bg-level-c disabled:opacity-50 transition"
          >
            {busy ? '처리 중…' : mode === 'signin' ? '로그인' : '가입하기'}
          </button>

          {msg && <p className="text-xs text-amber-300 leading-relaxed">{msg}</p>}

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setMsg('')
            }}
            className="w-full text-sm text-slate-400 hover:text-slate-200"
          >
            {mode === 'signin' ? '처음이신가요? 가입하기' : '이미 계정이 있어요 → 로그인'}
          </button>
        </form>

        <a
          href="/guide"
          className="block text-center mt-4 text-sm text-slate-400 hover:text-slate-200 underline"
        >
          📖 사용설명서 (처음이라면 여기부터)
        </a>
      </div>
    </div>
  )
}
