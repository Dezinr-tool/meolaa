import { Link, useLocation } from 'react-router-dom'
import {
  MEOLAA_MARK_VIEWBOX_TIGHT,
  MeolaaLogoMark,
} from './brand/MeolaaLogoMark'

const LEFT_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/story', label: 'Our Story' },
  { to: '/lab', label: 'Brand Lab' },
] as const

const RIGHT_LINKS = [
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

  const navClass = [
    'site-nav',
    'site-nav--glass',
    isInner ? 'site-nav--inner' : 'site-nav--home',
    navOverDark ? 'site-nav--over-dark' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const linkClass = (to: string) =>
    pathname === to ? 'is-active' : undefined

  return (
    <header className={navClass}>
      <nav className="site-nav__links site-nav__links--left" aria-label="Main">
        {LEFT_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={linkClass(l.to)}>
            {l.label}
          </Link>
        ))}
      </nav>

      <Link className="site-nav__logo" to="/" aria-label="Meolaa" data-nav-logo>
        <MeolaaLogoMark
          className="site-nav__logo-img"
          viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
          data-nav-logo-mark
        />
      </Link>

      <nav
        className="site-nav__links site-nav__links--right"
        aria-label="Secondary"
      >
        {RIGHT_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={linkClass(l.to)}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
