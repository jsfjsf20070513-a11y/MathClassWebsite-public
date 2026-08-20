import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// 2026-08 减法:站的核心是「读(每日定理与哲思)+ 练(背词)」,导航只留这两件。
// 中文与法语的并置是本站身份,不做单语化;法语以斜体作衬,中文承担功能重量。
const navItems = [
  { to: '/', fr: 'Accueil', zh: '扉页' },
  { to: '/vocabulary', fr: 'Vocabulaire', zh: '背词' },
]

export default function Layout() {
  const location = useLocation()
  const { user, signOut, isAuthEnabled } = useAuth()
  const displayName = user?.user_metadata?.nickname || user?.user_metadata?.real_name || user?.email || ''

  // `/` 是杂志刊(100svh 自带角落导航与 folio),不渲染页眉页脚(宪法 §5.1)。
  if (location.pathname === '/') {
    return <Outlet />
  }

  const resolvePrimaryNav = (pathname) => {
    if (pathname.startsWith('/vocabulary') || pathname.startsWith('/assistant')) {
      return navItems[1]
    }

    return navItems[0]
  }

  const primaryNav = resolvePrimaryNav(location.pathname)

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-head-top">
            <Link to="/" className="site-wordmark">Carnet de classe</Link>
          </div>

          <nav className="site-nav" aria-label="全站导航 · Plan du site">
            {navItems.map((item) => {
              const active = item.to === primaryNav?.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active ? 'is-active' : ''}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="site-nav-fr" lang="fr">{item.fr}</span>
                  <span aria-hidden="true"> · </span>
                  {item.zh}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p className="site-footer-secondary">Pour la classe.</p>
        <p className="site-footer-link">
          <Link to="/resources"><span className="site-nav-fr" lang="fr">Bibliothèque</span> · 资源与书目</Link>
        </p>
        {/* 登录是页脚的功能小字,不参与页眉构图(背词页自身另有登录门)。 */}
        <p className="site-footer-auth">
          {user ? (
            <>
              <span className="site-auth-note">已登录 · {displayName}</span>
              <button type="button" className="site-auth-link" onClick={() => signOut()}>退出</button>
            </>
          ) : isAuthEnabled ? (
            <Link to="/login" className="site-auth-link"><span className="site-nav-fr" lang="fr">Connexion</span> · 登录</Link>
          ) : (
            <span className="site-auth-note">登录未启用</span>
          )}
        </p>
      </footer>
    </div>
  )
}
