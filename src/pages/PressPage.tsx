import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { WhereNextSection } from '../components/layout/WhereNextSection'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

const RELEASES = [
  {
    cat: 'Funding',
    date: 'Jan 12, 2026',
    title: 'Meolaa raises $6M to build an AI-native house of brands',
    excerpt:
      'Seed round to scale the platform that reads demand, builds brands and runs them as a portfolio.',
  },
  {
    cat: 'Company',
    date: 'Nov 3, 2025',
    title: 'Platform v2 unifies intelligence and brand operations',
    excerpt:
      'A single data layer now connects demand models, formulation briefs and go-to-market loops.',
  },
  {
    cat: 'Brand',
    date: 'Sep 18, 2025',
    title: 'HIRA: from signal to shelf in under four months',
    excerpt:
      "How Meolaa's first live brand moved from consumer insight to retail presence on the system.",
  },
  {
    cat: 'Partnerships',
    date: 'Jun 20, 2025',
    title: 'Distribution agreement signed across quick-commerce platforms',
    excerpt:
      'Portfolio brands gain shared retail access without per-brand onboarding cycles.',
  },
  {
    cat: 'Product & Launches',
    date: 'Apr 14, 2025',
    title: 'Two new brands enter formulation — fragrance and kitchen',
    excerpt:
      'Pipeline brands progress through the same four-stage OS that launched HIRA.',
  },
  {
    cat: 'Funding',
    date: 'Feb 8, 2025',
    title: 'Pre-seed extension led by Ranjan Pai family office',
    excerpt:
      'Additional capital to deepen the intelligence layer and expand manufacturing partnerships.',
  },
  {
    cat: 'Company',
    date: 'Nov 22, 2024',
    title: 'Meolaa positions as an AI-native consumer company',
    excerpt:
      'Not a holding company — a technology company that builds consumer brands on one operating system.',
  },
  {
    cat: 'Brand',
    date: 'Aug 5, 2024',
    title: 'First brand thesis locked: personal care for modern India',
    excerpt:
      'Demand signals define the category brief before a name, pack or campaign exists.',
  },
  {
    cat: 'Partnerships',
    date: 'May 16, 2024',
    title: 'Manufacturing network opens for multi-category capacity',
    excerpt:
      'Supply partners connect once and serve every brand Meolaa launches.',
  },
  {
    cat: 'Product & Launches',
    date: 'Feb 28, 2024',
    title: 'Lab capability stack: four stages from signal to scale',
    excerpt:
      'Intelligence, brand build, launch and growth — documented as the Meolaa operating system.',
  },
  {
    cat: 'Company',
    date: 'Oct 10, 2023',
    title: 'Bengaluru HQ and founding team in place',
    excerpt:
      'A compact team across intelligence, brand build and growth & ops, sharing one data layer.',
  },
  {
    cat: 'Funding',
    date: 'Jun 1, 2023',
    title: 'Founding capital closes; platform build begins',
    excerpt:
      'Initial backing to prove that consumer brands can be built as a system, not a sequence of one-offs.',
  },
] as const

const KIT_ITEMS = [
  {
    name: 'Logo pack',
    desc: 'Primary wordmark, monochrome and reverse variants.',
    meta: 'ZIP · 4.2 MB',
  },
  {
    name: 'Brand guidelines',
    desc: 'Typography, colour, spacing and usage rules.',
    meta: 'PDF · 8.1 MB',
  },
  {
    name: 'Founder photography',
    desc: 'Approved portraits for print and digital.',
    meta: 'ZIP · 18 MB',
  },
  {
    name: 'Product imagery',
    desc: 'HIRA and portfolio product stills.',
    meta: 'ZIP · 42 MB',
  },
  {
    name: 'Company boilerplate',
    desc: 'Short and long company descriptions.',
    meta: 'DOCX · 48 KB',
  },
] as const

const WHERE_NEXT = [
  { num: '04', to: '/lab', title: 'Meolaa Lab', desc: 'The operating system behind every launch. →' },
  { num: '06', to: '/partners', title: 'Partners', desc: 'Investors and partnership routes. →' },
  { num: '07', to: '/careers', title: 'Careers', desc: 'The team behind the portfolio. →' },
] as const

export function PressPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useRevealOnScroll(rootRef)

  return (
    <PageLayout pageClass="page-editorial" navOverDark>
      <div ref={rootRef}>
        <section className="press-hero ct-hero" aria-label="Press and Media">
          <img
            className="ct-hero__bg"
            src="/assets/pages/story-system-hero.jpg"
            alt=""
            aria-hidden="true"
          />
          <div className="ct-hero__shade" aria-hidden="true" />
          <div className="ct-hero__inner press-hero__inner">
            <nav className="press-hero__crumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Press &amp; Media</span>
            </nav>
            <p className="pg-eyebrow pg-eyebrow--light">LATEST RELEASE · JAN 12, 2026</p>
            <p className="press-hero__label">PRESS &amp; MEDIA</p>
            <h1 className="pg-display ct-hero__title">
              News, coverage
              <br />
              and brand assets.
            </h1>
            <p className="pg-body ct-hero__body">
              A single hub for journalists and stakeholders — funding announcements,
              brand coverage and downloadable media resources, ordered for fast
              scanning.
            </p>
            <div className="ct-hero__ctas">
              <a className="ct-btn ct-btn--solid" href="#releases">
                Browse releases
              </a>
              <a className="ct-btn" href="#media-kit">
                Download media kit
              </a>
            </div>
          </div>
          <p className="ct-hero__cue">SCROLL</p>
        </section>

        <section className="press-featured press-reveal" aria-labelledby="press-featured-title">
          <div className="press-featured__flag">
            <span className="press-featured__flag-dot" aria-hidden="true" />
            Latest Release
          </div>
          <div className="press-featured__layout">
            <div>
              <div className="press-featured__meta">
                <span className="press-cat">Funding</span>
                <time className="press-featured__date" dateTime="2026-01-12">
                  Jan 12, 2026
                </time>
              </div>
              <h2 id="press-featured-title" className="press-featured__title">
                Meolaa raises $6M to build an AI-native house of brands
              </h2>
              <p className="press-featured__excerpt pg-body">
                Seed funding from Colossa Ventures, General Catalyst and Turbostart
                to scale the operating system behind consumer brand launches — with
                HIRA live and two more brands in the pipeline.
              </p>
              <a className="press-featured__cta" href="#">
                Read announcement →
              </a>
            </div>
            <figure className="press-featured__media">
              <img src="/assets/founder-meolaa.png" alt="Meolaa founder" loading="lazy" />
            </figure>
          </div>
        </section>

        <section className="press-releases" id="releases">
          <p className="pg-eyebrow pg-eyebrow--dark">ALL RELEASES</p>
          <h2 className="pg-h2" style={{ marginTop: 16 }}>
            Every announcement, chronologically.
          </h2>
          <p className="pg-body" style={{ marginTop: 12, maxWidth: '42em' }}>
            Filter by category. Newest first. Filter state stays in the URL so you
            can share a view.
          </p>
          <div className="press-filters" role="group" aria-label="Filter releases">
            <span className="press-filters__label">Filter</span>
            <button type="button" className="press-chip is-active">
              All
            </button>
            <button type="button" className="press-chip">
              Funding
            </button>
            <button type="button" className="press-chip">
              Company
            </button>
            <button type="button" className="press-chip">
              Brand
            </button>
          </div>
          <div className="press-list">
            {RELEASES.map((row) => (
              <article key={row.title} className="press-row press-reveal">
                <span className="press-row__cat press-cat">{row.cat}</span>
                <time className="press-row__date">{row.date}</time>
                <h3 className="press-row__title">{row.title}</h3>
                <p className="press-row__excerpt">{row.excerpt}</p>
                <a className="press-row__cta" href="#">
                  Read →
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="press-kit" id="media-kit">
          <p className="pg-eyebrow pg-eyebrow--light">MEDIA KIT</p>
          <h2 className="pg-h2 ct-section-title--light" style={{ marginTop: 16 }}>
            Brand assets, ready to download.
          </h2>
          <p className="press-kit__lede">
            Logo packs, guidelines, photography and boilerplate for accurate
            coverage. Each file lists format and size.
          </p>
          <div className="press-kit__grid">
            {KIT_ITEMS.map((item) => (
              <a key={item.name} className="press-kit__item press-reveal" href="#">
                <span className="press-kit__icon" aria-hidden="true">
                  ↓
                </span>
                <div>
                  <p className="press-kit__name">{item.name}</p>
                  <p className="press-kit__desc">{item.desc}</p>
                </div>
                <span className="press-kit__meta">{item.meta}</span>
              </a>
            ))}
          </div>
          <a className="ct-btn press-kit__all" href="#">
            Download full kit
          </a>
        </section>

        <section className="press-contact">
          <p className="pg-eyebrow pg-eyebrow--dark">MEDIA CONTACT</p>
          <h2 className="pg-h2" style={{ marginTop: 16 }}>
            Talk to communications.
          </h2>
          <p className="pg-body" style={{ marginTop: 12, maxWidth: '36em' }}>
            For interviews, fact checks, embargoed briefings and asset requests —
            one named contact, clear response window.
          </p>
          <div className="press-contact__grid">
            <div className="press-contact__card">
              <div className="press-contact__portrait">
                <img src="/assets/founder-meolaa.png" alt="" />
              </div>
              <div>
                <p className="press-contact__name">Communications team</p>
                <p className="press-contact__role">Media &amp; communications</p>
                <a className="press-contact__email" href="mailto:press@meolaa.com">
                  press@meolaa.com
                </a>
                <p className="press-contact__sla">
                  We respond to media requests within one business day.
                </p>
              </div>
            </div>
          </div>
        </section>

        <WhereNextSection links={WHERE_NEXT} />
      </div>
    </PageLayout>
  )
}
