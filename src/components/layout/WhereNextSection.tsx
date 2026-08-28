import { Link } from 'react-router-dom'

export type WhereNextLink = {
  num: string
  to: string
  title: string
  desc: string
}

type WhereNextSectionProps = {
  links: readonly WhereNextLink[]
}

export function WhereNextSection({ links }: WhereNextSectionProps) {
  return (
    <section className="pg-where-next">
      <p className="section-head__eyebrow">Where to Next</p>
      <div className="pg-where-next__grid">
        {links.map((link) => (
          <Link key={link.to} className="pg-where-next__card" to={link.to}>
            <span className="num">{link.num}</span>
            <h3>{link.title}</h3>
            <p>{link.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
