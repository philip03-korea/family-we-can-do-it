import React, {useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import {PreviewProvider,useAuth} from './preview-auth'
import StudioHome from '../src/components/StudioHome'
import Career from '../src/pages/Career'
import Webtoon from '../src/pages/Webtoon'
import Cooking from '../src/pages/Cooking'
import GroupHub from '../src/pages/GroupHub'
import BottomNav from '../src/components/BottomNav'
import {featureKeyOfPath} from '../src/data/features'
import {useLocation} from 'react-router-dom'
import '../src/index.css'
import '../src/studio.css'
function Preview(){
 const {profile,canSee}=useAuth();const {pathname}=useLocation();const key=featureKeyOfPath(pathname)
 useEffect(()=>{window.scrollTo(0,0)},[pathname,profile.member_key])
 return <div className={`studio-app member-${profile.member_key}`}><Routes><Route path="/" element={<StudioHome/>}/><Route path="/dev/studio-preview.html" element={<StudioHome/>}/><Route path="/career" element={canSee('career')?<Career/>:<Navigate to="/" replace/>}/><Route path="/webtoon" element={canSee('webtoon')?<Webtoon/>:<Navigate to="/" replace/>}/><Route path="/cooking" element={canSee('cooking')?<Cooking/>:<Navigate to="/" replace/>}/><Route path="/g/:groupKey" element={<GroupHub/>}/><Route path="*" element={key&&!canSee(key)?<Navigate to="/" replace/>:<div className="min-h-screen p-5"><h1>기존 기능 연결</h1><p>이 기능은 실제 앱에서 로그인 후 이용할 수 있습니다.</p><a href="/">스튜디오로 돌아가기</a><BottomNav/></div>}/></Routes></div>
}
createRoot(document.getElementById('root')).render(<BrowserRouter><PreviewProvider><Preview/></PreviewProvider></BrowserRouter>)
