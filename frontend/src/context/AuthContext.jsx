import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

const PARENT_KEYS = ['mom', 'dad']

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ownProfile, setOwnProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [viewKey, setViewKey] = useState(null) // 부모가 미리보기 중인 구성원 member_key
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // 로그인되면 내 프로필 + 가족 전체 프로필 로드
  useEffect(() => {
    if (!session?.user || !isSupabaseConfigured) {
      setOwnProfile(null)
      setAllProfiles([])
      setViewKey(null)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setOwnProfile(data))
    supabase
      .from('profiles')
      .select('id, member_key, display_name, level, toefl_track')
      .then(({ data }) => setAllProfiles(data || []))
  }, [session])

  const isParent = PARENT_KEYS.includes(ownProfile?.member_key)
  // 부모가 미리보기 중이면 해당 구성원 프로필로, 아니면 내 프로필
  const viewed = isParent && viewKey ? allProfiles.find((p) => p.member_key === viewKey) : null
  const profile = viewed || ownProfile
  const viewUserId = profile?.id || session?.user?.id

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    ownProfile,
    allProfiles,
    isParent,
    isViewing: !!viewed,
    viewKey,
    viewUserId,
    setViewAs: (key) => setViewKey(key),
    loading,
    isConfigured: isSupabaseConfigured,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
    refreshProfile: async () => {
      if (!session?.user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      setOwnProfile(data)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
