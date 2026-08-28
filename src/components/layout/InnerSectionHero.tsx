import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type HeroCta = {
  label: string
  href: string
  variant?: 'solid' | 'ghost'
}

type InnerSectionHeroProps = {
  eyebrow: string
  title: ReactNode
  body?: ReactNode
  imageSrc: string
  imageAlt?: string
  /** Breadcrumb trail before eyebrow */
  breadcrumb?: { label: string; to?: string }[]
  ctas?: HeroCta[]
  /** Extra content below body (stats row, etc.) */
  children?: ReactNode
  className?: string
}

export function InnerSectionHero({
  eyebrow,
  title,
  body,
  imageSrc,
  imageAlt = '',
  breadcrumb,
  ctas,
  children,
  className = '',
}: InnerSectionHeroProps) {
  return (
    <header className={`inner-hero ct-hero ${className}`.trim()} aria-label={eyebrow}>
      <img
        className="ct-hero__bg inner-hero__bg"
        src={imageSrc}
        alt={imageAlt}
        aria-hidden={imageAlt === '' ? true : undefined}
      />
      <div className="ct-hero__shade inner-hero__shade" aria-hidden="true" />
      <div className="ct-hero__inner inner-hero__inner">
        {breadcrumb?.length ? (
          <nav className="inner-hero__crumb" aria-label="Breadcrumb">
            {breadcrumb.map((item, i) => (
              <span key={`${item.label}-${i}`}>
                {i > 0 ? <span aria-hidden="true"> / </span> : null}
                {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
              </span>
            ))}
          </nav>
        ) : null}
        <div className="section-head section-head--start inner-hero__head">
          <p className="section-head__eyebrow">{eyebrow}</p>
          <h1 className="section-head__title inner-hero__title">{title}</h1>
          {body ? <p className="section-head__sub inner-hero__body">{body}</p> : null}
        </div>
        {children}
        {ctas?.length ? (
          <div className="ct-hero__ctas inner-hero__ctas">
            {ctas.map((cta) => (
              <a
                key={cta.href}
                className={`btn ${cta.variant === 'solid' ? 'btn--solid' : 'btn--ghost'}`}
                href={cta.href}
              >
                {cta.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      <p className="ct-hero__cue inner-hero__cue">SCROLL</p>
    </header>
  )
}
