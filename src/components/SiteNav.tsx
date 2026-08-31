import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MEOLAA_MARK_VIEWBOX_TIGHT,
  MeolaaLogoMark,
} from './brand/MeolaaLogoMark'

/* Single row now — logo sits left, every link plus the CTA sits right. */
const ALL_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/story', label: 'Story' },
  { to: '/lab', label: 'Lab' },
  { to: '/press', label: 'Press' },
  { to: '/partners', label: 'Partners' },
  { to: '/careers', label: 'Careers' },
] as const

type SiteNavProps = {
  variant?: 'home' | 'inner'
  /** Light nav type over a dark hero until scroll */
  navOverDark?: boolean
}

export function SiteNav({ variant = 'home', navOverDark = false }: SiteNavProps) {
  const { pathname } = useLocation()
  const isInner = variant === 'inner'
  const [menuOpen, setMenuOpen] = useState(false)
  const panelId = useId()

  const navClass = [
    'site-nav',
    'site-nav--glass',
    isInner ? 'site-nav--inner' : 'site-nav--home',
    navOverDark ? 'site-nav--over-dark' : '',
    menuOpen ? 'is-menu-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const linkClass = (to: string) =>
    pathname === to ? 'is-active' : undefined

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.classList.add('is-nav-menu-open')

    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('is-nav-menu-open')
    }
  }, [menuOpen])

  return (
    <header className={navClass}>
      <Link className="site-nav__logo" to="/" aria-label="Meolaa" data-nav-logo>
        <MeolaaLogoMark
          className="site-nav__logo-img"
          viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
          data-nav-logo-mark
        />
      </Link>

      <nav
        className="site-nav__links site-nav__links--right"
        aria-label="Main"
      >
        {ALL_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={linkClass(l.to)}>
            {l.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="site-nav__toggle"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls={panelId}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="site-nav__toggle-bar" aria-hidden="true" />
        <span className="site-nav__toggle-bar" aria-hidden="true" />
        <span className="site-nav__toggle-bar" aria-hidden="true" />
      </button>

      <div
        id={panelId}
        className={`site-nav__drawer${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <nav className="site-nav__drawer-nav" aria-label="Mobile">
          {ALL_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={linkClass(l.to)}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="site-nav__backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
    </header>
  )
}
