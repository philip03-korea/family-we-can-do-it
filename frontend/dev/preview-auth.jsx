import { createContext, useContext, useState } from 'react'
import { FAMILY } from '../src/data/family'
import { resolveFeatures, resolveGroups } from '../src/data/features'
const Context = createContext(null)
export const useAuth = () => useContext(Context)
export function PreviewProvider({ children }) {
  const [member, setMember] = useState('haeum')
  const [viewKey, setViewAs] = useState(null)
  const allProfiles = FAMILY.map(f => ({ id: `preview-${f.key}`, member_key:f.key,display_name:f.name,level:f.level,enabled_features:null }))
  const ownProfile=allProfiles.find(p=>p.member_key===member)
  const isParent=['dad','mom'].includes(member)
  const profile=(isParent&&allProfiles.find(p=>p.member_key===viewKey))||ownProfile
  const visibleFeatures=resolveFeatures(profile.member_key,null)
  return <Context.Provider value={{profile,ownProfile,allProfiles,isParent,isViewing:profile!==ownProfile,viewKey,setViewAs,visibleFeatures,visibleGroups:resolveGroups(visibleFeatures),canSee:k=>visibleFeatures.includes(k)}}><div className="preview-toolbar"><strong>실제 화면 미리보기</strong><span>예시 프로필 · 서버 저장/AI 호출 없음</span><label>가족 <select value={member} onChange={e=>{setMember(e.target.value);setViewAs(null)}}>{allProfiles.map(p=><option value={p.member_key} key={p.id}>{p.display_name}</option>)}</select></label><a href="/dev/studio-preview.html">홈으로</a></div>{children}</Context.Provider>
}
