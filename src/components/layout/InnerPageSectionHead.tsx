import type { ReactNode } from 'react'

type InnerPageSectionHeadProps = {
  eyebrow: string
  title: ReactNode
  sub?: ReactNode
  /** on-light = cream/white ground; on-dark = planet blue / photo */
  tone?: 'on-light' | 'on-dark'
  align?: 'center' | 'start'
  className?: string
  children?: ReactNode
}

export function InnerPageSectionHead({
  eyebrow,
  title,
  sub,
  tone = 'on-light',
  align = 'start',
  className = '',
  children,
}: InnerPageSectionHeadProps) {
  const toneClass = tone === 'on-light' ? 'section-head--on-light' : ''
  const alignClass = align === 'start' ? 'section-head--start' : ''

  return (
    <header className={`section-head ${toneClass} ${alignClass} ${className}`.trim()}>
      <p className="section-head__eyebrow">{eyebrow}</p>
      <h2 className="section-head__title">{title}</h2>
      {sub ? <p className="section-head__sub">{sub}</p> : null}
      {children}
    </header>
  )
}
