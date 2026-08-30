import { brandPaths } from '../lib/brand'

const LINKS = [
  { href: '#about', label: 'About Us' },
  { href: '#story', label: 'Our Story' },
  { href: '#lab', label: 'Brand Lab' },
  { href: '#press', label: 'Press' },
  { href: '#partners', label: 'Partners' },
  { href: '#careers', label: 'Careers' },
] as const

export function SiteNav() {
  return (
    <header className="site-nav">
      <a className="site-nav__logo" href="/" aria-label="Meolaa">
        <img
          className="site-nav__logo-img"
          src={brandPaths.logoWhite}
          alt="Meolaa"
        />
      </a>
      <nav className="site-nav__links" aria-label="Main">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
