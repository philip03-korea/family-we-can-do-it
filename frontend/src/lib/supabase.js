import { createClient } from '@supabase/supabase-js'

// 2026-09-20 새 Supabase 프로젝트로 이전(옛 프로젝트 무료 용량 제한 락).
// anon 키는 공개 키(브라우저에 노출되는 키)라 커밋해도 안전.
// 옛 Vercel 환경변수가 아직 옛 프로젝트를 가리켜서, 여기서 새 프로젝트로 직접 고정한다.
// (나중에 Vercel 환경변수를 새 값으로 바꾸면 그걸 우선 쓰도록 되돌릴 수 있음)
const NEW_URL = 'https://pxwbmandoyuwiivuxoow.supabase.co'
const NEW_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4d2JtYW5kb3l1d2lpdnV4b293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NzI1MjYsImV4cCI6MjEwNTQ0ODUyNn0.VUM5aHo7U9sz3iPaHFct2aLfD3g2zhtKAnSp1u5tVzU'
const envUrl = import.meta.env.VITE_SUPABASE_URL
const useEnv = Boolean(envUrl && envUrl.includes('pxwbmandoyuwiivuxoow'))
const url = useEnv ? envUrl : NEW_URL
const anonKey = useEnv ? import.meta.env.VITE_SUPABASE_ANON_KEY : NEW_ANON

// 환경변수가 비어 있으면 안내 (셋업 전 단계)
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT'))

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
