import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import sharedCss from '../../design/mockup/css/site.css?raw'
import { useApp } from '../state/AppContext'

export function SiteLayout() {
  const { script, setScript, isLoggedIn, text } = useApp()
  const location = useLocation()
  const basicsActive = ['/courses', '/jyutping', '/words'].some((path) => location.pathname.startsWith(path))

  return <div className="k-layout">
    <style>{`${sharedCss}
      .k-layout .nav{height:auto;justify-content:flex-start}
      .k-layout .brand{min-width:0}
      .k-layout .nav-links{flex:initial;height:auto;justify-content:flex-start;align-items:center}
      .k-layout .nav-links a::after{display:none}
      .k-layout .nav-right{min-width:0}
      .k-layout .lang{height:auto;cursor:pointer}
      .k-layout .site-footer{display:block;background:transparent;color:var(--ink-faint)}
    `}</style>
    <nav className="nav">
      <Link className="brand" to="/"><span className="zh">{text('粤见', '粵見')}</span><span className="en">CantoScene</span></Link>
      <div className="nav-links">
        <NavLink to="/">{text('首页', '首頁')}</NavLink>
        <Link className={basicsActive ? 'active' : ''} to="/courses">{text('基础课程', '基礎課程')}</Link>
        <NavLink to="/videos">{text('影视学粤语', '影視學粵語')}</NavLink>
        <NavLink to="/favorites">{text('收藏', '收藏')}</NavLink>
        <NavLink to="/my">{text('我的学习', '我的學習')}</NavLink>
      </div>
      <div className="nav-right">
        <button className="lang" onClick={() => setScript(script === 'simplified' ? 'traditional' : 'simplified')}>{script === 'simplified' ? '简 / 繁' : '繁 / 简'}</button>
        <Link className="login-btn" to={isLoggedIn ? '/my' : '/login'}>{isLoggedIn ? '阿 May' : text('登录', '登入')}</Link>
      </div>
    </nav>
    <main><Outlet /></main>
    <footer className="site-footer">粤见 CantoScene · {text('走进真实粤语。', '走進真實粵語。')} · See it. Hear it. Get Cantonese.</footer>
  </div>
}

export function PageIntro({ eyebrow, title, traditionalTitle, description }: { eyebrow: string; title: string; traditionalTitle?: string; description: string }) {
  const { text } = useApp()
  return <div className="wrap"><div className="page-head"><span className="eyebrow">{text(eyebrow)}</span><h1>{text(title, traditionalTitle)}</h1><p>{text(description)}</p></div></div>
}
