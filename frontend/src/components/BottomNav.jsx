import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ME_TAB, FEATURE_MAP, featureKeyOfPath } from '../data/features'
export default function BottomNav() {
 const { pathname } = useLocation()
 const { visibleGroups, isParent, profile } = useAuth()
 const items = [{to:'/',icon:'⌂',label:'스튜디오'},...(visibleGroups||[]).map(g=>({to:`/g/${g.key}`,icon:g.emoji,label:g.label,group:g.key})),{to:ME_TAB.route,icon:'⚙',label:'나'}]
 const group=FEATURE_MAP[featureKeyOfPath(pathname)]?.group
 return <nav className="studio-nav" aria-label="주 메뉴"><Link className="nav-brand" to="/">fam<span>talk</span><small>OUR FAMILY STUDIO</small></Link><span className="nav-caption">MY SPACE</span><div className="nav-items">{items.map(it=><Link key={it.to} to={it.to} aria-current={pathname===it.to||(it.group&&group===it.group)?'page':undefined}><span className="nav-icon">{it.icon}</span><strong>{it.label}</strong><i>↗</i></Link>)}</div>{isParent&&<Link className="nav-manage" to="/manage">가족별 화면 설정 ↗</Link>}<div className="nav-bottom"><span>✳</span><p>각자의 속도로,<br/>함께 자라는 우리.</p><small>{profile?.display_name}의 공간</small></div></nav>
}
