import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { PARENT_KEYS, resolveFeatures, resolveGroups } from '../data/features'

const AuthContext = createContext(null)

const BASE_COLS = 'id, member_key, display_name, level, toefl_track'

// enabled_features 는 step15 마이그레이션으로 생긴다. Supabase에서 아직
// 실행하지 않았다면 이 컬럼을 달라는 select 가 통째로 실패해 가족 목록이
// 비어 버린다(부모 미리보기 줄이 사라진다). 실패하면 컬럼 없이 한 번 더 부른다.
async function loadAllProfiles() {
  const withCol = await supabase.from('profiles').select(`${BASE_COLS}, enabled_features`)
  if (!withCol.error) return withCol.data || []
  const fallback = await supabase.from('profiles').select(BASE_COLS)
  return fallback.data || []
}

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
    loadAllProfiles().then(setAllProfiles)
  }, [session])

  const isParent = PARENT_KEYS.includes(ownProfile?.member_key)
  // 부모가 미리보기 중이면 해당 구성원 프로필로, 아니면 내 프로필
  const viewed = isParent && viewKey ? allProfiles.find((p) => p.member_key === viewKey) : null
  const profile = viewed || ownProfile
  const viewUserId = profile?.id || session?.user?.id

  // 지금 보고 있는 사람 기준의 노출 설정.
  // 미리보기 중이면 allProfiles 쪽 행에 enabled_features 가 들어 있다.
  const viewedKey = profile?.member_key
  const viewedEnabled = viewed
    ? viewed.enabled_features
    : ownProfile?.enabled_features
  const visibleFeatures = useMemo(
    () => resolveFeatures(viewedKey, viewedEnabled),
    [viewedKey, viewedEnabled],
  )
  const visibleGroups = useMemo(() => resolveGroups(visibleFeatures), [visibleFeatures])
  const featureSet = useMemo(() => new Set(visibleFeatures), [visibleFeatures])

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
    visibleFeatures,
    visibleGroups,
    canSee: (key) => featureSet.has(key),
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
    // 부모가 「화면 설정」에서 자녀 노출을 저장한 뒤 미리보기에 바로 반영하려면 필요
    refreshAllProfiles: async () => {
      setAllProfiles(await loadAllProfiles())
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
