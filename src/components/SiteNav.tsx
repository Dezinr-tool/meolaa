import {
  MEOLAA_MARK_VIEWBOX_TIGHT,
  MeolaaLogoMark,
} from './brand/MeolaaLogoMark'

/**
 * Split 3 + 3 so the logo can sit dead centre between two equal-width link
 * groups (see .site-nav__links flex:1 1 0 in homepage-overrides.css) — a
 * single 6-link row would have made a true centred logo impossible.
 */
const LEFT_LINKS = [
  { href: '#about', label: 'About Us' },
  { href: '#story', label: 'Our Story' },
  { href: '#lab', label: 'Brand Lab' },
] as const

const RIGHT_LINKS = [
  { href: '#press', label: 'Press' },
  { href: '#partners', label: 'Partners' },
  { href: '#careers', label: 'Careers' },
] as const

export function SiteNav() {
  return (
    <header className="site-nav">
      <nav className="site-nav__links site-nav__links--left" aria-label="Main">
        {LEFT_LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>

      {/* This *is* the hero's big centre wordmark. It starts scaled up and
          translated into the middle of the hero fold, then scroll-scrubs down
          into this nav slot (identity transform) — see the dock ScrollTrigger
          in HomeAnimations. Inline SVG rather than the PNG because it gets
          scaled ~7× at the hero end and a raster would go soft.
          The anchor keeps the docked footprint so the flanking link groups
          never shift; the mark itself is absolutely positioned inside it and
          laid out at full hero width, so scaling only ever goes DOWN (see the
          CSS — scaling a composited layer up pixelates it, vector or not). */}
      <a className="site-nav__logo" href="/" aria-label="Meolaa" data-nav-logo>
        <MeolaaLogoMark
          className="site-nav__logo-img"
          viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
          data-nav-logo-mark
        />
      </a>

      <nav
        className="site-nav__links site-nav__links--right"
        aria-label="Secondary"
      >
        {RIGHT_LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
