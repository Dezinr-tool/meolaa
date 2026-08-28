import { Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { WhereNextSection } from '../components/layout/WhereNextSection'

const RAIL = [
  { id: 'chapter-insight', year: 'Mar 2022', name: 'Insight' },
  { id: 'chapter-build', year: 'Nov 2022', name: 'Build' },
  { id: 'chapter-brand', year: 'Jun 2024', name: 'First Brand' },
] as const

const CHAPTERS = [
  {
    id: 'chapter-insight',
    milestone: 'Mar 2022',
    eyebrow: 'CHAPTER 01 · THE INSIGHT THESIS',
    title: 'Demand leaves a signal before it peaks.',
    narrative:
      "Ishita's conviction: consumer behaviour leaves signals long before a category peaks — search, social, pricing gaps. Most companies find out after the opportunity has already been priced in. We believed demand could be read before it became obvious.",
    image: '/assets/pages/story-chapter-insight.jpg',
    stats: [
      { num: '120+', label: 'Categories mapped for whitespace and demand patterns' },
      { num: '3', label: 'Markets where consumer signals are read before they peak' },
      { num: '2022', label: 'Year the insight thesis became the company' },
    ],
  },
  {
    id: 'chapter-build',
    milestone: 'Nov 2022',
    eyebrow: 'CHAPTER 02 · THE BUILD SYSTEM',
    title: 'The system came first, on purpose.',
    narrative:
      'Before HIRA existed, the platform did — CMI to find the gap, Brand Co-pilot to run what got built. The system came first, on purpose, so every brand after it would launch faster than the one before.',
    image: '/assets/pages/story-chapter-build.jpg',
    stats: [
      { num: '$6M', label: 'Raised across seed rounds to build the operating system' },
      { num: '2', label: 'Core systems first — CMI to find the gap, Brand Co-pilot to run it' },
      { num: '1', label: 'Operating layer that finds, builds and runs every brand' },
    ],
  },
  {
    id: 'chapter-brand',
    milestone: 'Jun 2024',
    eyebrow: 'CHAPTER 03 · THE FIRST BRAND',
    title: 'Proof that the system works end to end.',
    lede:
      'HIRA ran through the full system — signal, build, launch — and it worked. That proof is what the rest of the portfolio is built on. Brand 02 is already in build from a validated opportunity.',
    image: '/assets/pages/story-chapter-brand.jpg',
    brands: true,
  },
] as const

const BRAND_CARDS = [
  {
    meta: 'Beauty & Personal Care · Live',
    name: 'HIRA',
    desc: "Meolaa's first brand — built end-to-end on the platform, live and shipping.",
    image: '/assets/portfolio-beauty-01.jpg',
    status: 'live' as const,
  },
  {
    meta: 'Fragrance · In build',
    name: 'Brand 02',
    desc: 'Validated opportunity, already in build from the same system.',
    image: '/assets/portfolio-fragrance-01.jpg',
    status: 'soon' as const,
  },
  {
    meta: 'Kitchen Essentials · Pipeline',
    name: 'Brand 03',
    desc: 'Next signal in the pipeline — structure ready as more brands launch.',
    image: '/assets/portfolio-kitchen-01.jpg',
    status: 'soon' as const,
  },
] as const

const WHERE_NEXT = [
  { num: '02', to: '/about', title: 'About Us', desc: 'The thesis, the model, the team. →' },
  { num: '04', to: '/lab', title: 'Meolaa Lab', desc: 'The system this story is about. →' },
  { num: '07', to: '/careers', title: 'Careers', desc: 'Help write the next chapter. →' },
] as const

export function StoryPage() {
  return (
    <PageLayout pageClass="page-editorial">
      <header className="story-hero">
        <div className="story-hero__inner">
          <div className="story-hero__copy">
            <div className="story-hero__meta">
              <p className="section-head__eyebrow">Meolaa · Founded 2022</p>
              <p className="section-head__eyebrow">Our Story</p>
            </div>
            <h1 className="story-hero__headline pg-display">
              It started with a question no one else was asking.
            </h1>
            <p className="story-hero__lede">
              In 2022, Ishita Sawant set out to prove that emerging consumer
              demand could be identified and served faster than any traditional
              FMCG company could move — Meolaa is the system built to do exactly
              that.
            </p>
          </div>
          <figure className="story-hero__panel" aria-hidden="true">
            <img
              src="/assets/pages/story-hero-portrait.jpg"
              alt=""
              loading="eager"
            />
          </figure>
        </div>
      </header>

      <div className="story-body is-story-rail-static">
        <aside className="story-rail is-visible" aria-label="Story timeline">
          <div className="story-rail__inner">
            <div className="story-rail__line">
              <div className="story-rail__progress" />
            </div>
            <ol className="story-rail__list">
              {RAIL.map((item, i) => (
                <li key={item.id}>
                  <a
                    className={`story-rail__item${i === 0 ? ' is-active is-past' : ''}`}
                    href={`#${item.id}`}
                  >
                    <span className="story-rail__node" aria-hidden="true" />
                    <span className="story-rail__meta">
                      <span className="story-rail__year">{item.year}</span>
                      <span className="story-rail__name">{item.name}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="story-body__main">
          {CHAPTERS.map((ch, i) => (
            <section
              key={ch.id}
              id={ch.id}
              className={`story-chapter${ch.id === 'chapter-brand' ? ' story-chapter--brands' : ''}${i === 0 ? ' is-story-active' : ''}`}
              data-story-chapter
            >
              <div className="story-chapter__inner">
                <header className="story-chapter__head">
                  <p className="story-chapter__milestone">{ch.milestone}</p>
                  <p className="section-head__eyebrow">{ch.eyebrow}</p>
                  <h2 className="pg-display">{ch.title}</h2>
                  {'lede' in ch && ch.lede ? (
                    <p className="pg-body story-chapter__lede">{ch.lede}</p>
                  ) : null}
                </header>
                <figure
                  className={`story-chapter__media${ch.id === 'chapter-brand' ? ' story-chapter__media--compact' : ''}`}
                >
                  <img src={ch.image} alt="" loading="lazy" />
                </figure>
                {'narrative' in ch && ch.narrative ? (
                  <p className="pg-body story-chapter__narrative">{ch.narrative}</p>
                ) : null}
                {'stats' in ch && ch.stats ? (
                  <div className="story-chapter__stats" role="list">
                    {ch.stats.map((s) => (
                      <div key={s.label} className="story-stat" role="listitem">
                        <strong className="story-stat__num">{s.num}</strong>
                        <span className="story-stat__label">{s.label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {'brands' in ch && ch.brands ? (
                  <div className="story-brand-grid">
                    {BRAND_CARDS.map((brand) => (
                      <article
                        key={brand.name}
                        className={`story-brand-card${brand.status === 'soon' ? ' story-brand-card--soon' : ''}`}
                      >
                        <div className="story-brand-card__media">
                          <img src={brand.image} alt="" loading="lazy" />
                        </div>
                        <div className="story-brand-card__body">
                          <p className="story-brand-card__meta">{brand.meta}</p>
                          <h3 className="story-brand-card__name">{brand.name}</h3>
                          {brand.status === 'soon' ? (
                            <p className="story-brand-card__soon">Coming Soon</p>
                          ) : null}
                          <p className="story-brand-card__desc">{brand.desc}</p>
                          {brand.status === 'live' ? (
                            <a className="story-brand-card__cta" href="#">
                              View brand ↗
                            </a>
                          ) : (
                            <span
                              className="story-brand-card__cta story-brand-card__cta--disabled"
                              aria-disabled="true"
                            >
                              Coming soon
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="story-system-hero">
        <div className="story-system-hero__media">
          <img
            className="story-system-hero__img"
            src="/assets/pages/story-system-hero.jpg"
            alt=""
          />
          <div className="story-system-hero__scrim" />
        </div>
        <blockquote className="story-system-hero__quote">
          <p className="story-system-hero__text">
            We&apos;re not building one brand well. We&apos;re building the
            system that builds every brand well.
          </p>
          <footer className="story-system-hero__attr">
            <div className="story-system-hero__portrait">
              <img src="/assets/founder-meolaa.png" alt="Ishita Sawant" />
            </div>
            <div>
              <p className="story-system-hero__name">Ishita Sawant</p>
              <p className="story-system-hero__role">Founder & CEO</p>
            </div>
          </footer>
        </blockquote>
      </section>

      <section className="story-cta-band">
        <div className="story-cta-band__inner">
          <div className="story-cta-band__card">
            <p className="section-head__eyebrow">The System Behind the Story</p>
            <h2 className="pg-h2">See how the platform actually works.</h2>
            <p className="story-cta-band__lede">
              Insight, product, brand and distribution — one integrated operating
              system, not three departments handing off.
            </p>
            <Link className="story-cta-band__link" to="/lab">
              Explore Meolaa Lab →
            </Link>
          </div>
        </div>
      </section>

      <WhereNextSection links={WHERE_NEXT} />
    </PageLayout>
  )
}
