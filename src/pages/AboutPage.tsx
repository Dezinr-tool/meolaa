import { Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { WhereNextSection } from '../components/layout/WhereNextSection'

const ROADMAP_STEPS = [
  {
    capsule: '2022 · Founded',
    bullets: [
      'Meolaa incorporated',
      'Pre-seed from Ranjan Pai',
      'House of brands thesis begins',
    ],
  },
  {
    capsule: '2022 · Seed',
    bullets: [
      '$6M seed raised',
      'Colossa Ventures, General Catalyst, Turbostart',
      'Capital to scale the model',
    ],
  },
  {
    capsule: '2024 · HIRA',
    bullets: [
      'HIRA launches',
      'First brand built end-to-end on the platform',
      'Proof from insight to shelf',
    ],
  },
  {
    capsule: '2026 · Platform',
    bullets: [
      'Platform v2 ships',
      'CMI and Brand Co-pilot unified',
      'One operating system for the house',
    ],
  },
] as const

const PILLARS = [
  {
    label: 'Signal',
    title: 'We read the market before it moves.',
    desc: 'Consumer behaviour, demand and whitespace, sorted into a single opportunity score.',
  },
  {
    label: 'Build',
    title: 'AI does the heavy lifting.',
    desc: 'Product, brand and go-to-market assembled by a small team, not a large one.',
  },
  {
    label: 'Run',
    title: 'The system keeps it running.',
    desc: 'Distribution, content and operations kept alive by the same engine that built it.',
  },
] as const

const VALUES = [
  {
    num: '01',
    title: 'Signal over opinion',
    desc: 'Data leads, taste refines.',
    ticker: 'Signal over opinion · Signal over opinion ·',
  },
  {
    num: '02',
    title: 'Small teams, real ownership',
    desc: 'One person can own a whole brand.',
    ticker: 'Small teams, real ownership · Small teams, real ownership ·',
  },
  {
    num: '03',
    title: 'Ship, then learn',
    desc: 'Speed beats certainty.',
    ticker: 'Ship, then learn · Ship, then learn ·',
  },
  {
    num: '04',
    title: 'System first',
    desc: 'Build the machine, not just the output.',
    ticker: 'System first · System first ·',
  },
  {
    num: '05',
    title: 'Protect the thesis',
    desc: 'Say no to what doesn\'t compound.',
    ticker: 'Protect the thesis · Protect the thesis ·',
  },
] as const

const LEADERS = [
  { name: 'Ishita Sawant', role: 'Founder & CEO', img: '/assets/team/team-01.jpg' },
  { name: 'Head of Intelligence', role: 'Intelligence', img: '/assets/team/team-02.jpg' },
  { name: 'Head of Brand', role: 'Brand build', img: '/assets/team/team-03.jpg' },
  { name: 'Head of Growth', role: 'Growth & ops', img: '/assets/team/team-04.jpg' },
] as const

const WHERE_NEXT = [
  { num: '03', to: '/story', title: 'Our Story', desc: 'How Meolaa actually got built. →' },
  { num: '04', to: '/lab', title: 'Meolaa Lab', desc: 'Inside the system that runs it all. →' },
  { num: '07', to: '/careers', title: 'Careers', desc: 'Build with a small team, real ownership. →' },
] as const

export function AboutPage() {
  return (
    <PageLayout pageClass="page-editorial">
      <section className="au-fold1" aria-label="About Us">
        <div className="au-fold1__pin">
          <header className="au-fold1__head">
            <p className="pg-eyebrow pg-eyebrow--dark">ABOUT US</p>
            <h1 className="pg-display au-fold1__title">
              A technology company{' '}
              <span className="au-fold1__accent">building consumer brands</span>.
            </h1>
            <div className="au-fold1__ctas">
              <a className="ct-btn ct-btn--dark" href="#mission">
                Our thesis ↓
              </a>
              <a className="ct-btn ct-btn--dark" href="#leadership">
                Meet the team ↓
              </a>
            </div>
          </header>
          <div className="au-fold1__video-box">
            <video
              className="au-fold1__video"
              autoPlay
              muted
              loop
              playsInline
              poster="/assets/pages/about-hero.jpg"
            >
              <source
                src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      </section>

      <section className="au2-mv is-static" id="mission" aria-label="Mission and Vision">
        <div className="au2-mv__pin">
          <div className="au2-mv__thesis" aria-label="The Model">
            <div className="au-fold2__inner">
              <p className="pg-eyebrow pg-eyebrow--dark">THE MODEL</p>
              <p className="au-fold2__lede">
                <span>AI-native, digitally-native,</span>{' '}
                <span>and built to move at the speed of demand.</span>
              </p>
              <p className="pg-body au-fold2__body">
                Every function — insight, product, brand, distribution — is
                designed around the same data layer, so a small team can do what
                used to take a large one.
              </p>
            </div>
          </div>
          <div className="au2-mv__strip">
            <article className="au2-mv__panel is-in" data-mv-panel="mission">
              <div className="au2-mv__panel-media" aria-hidden="true">
                <img src="/assets/pages/about-mission.jpg" alt="" />
              </div>
              <div className="au2-mv__panel-text">
                <p className="pg-eyebrow pg-eyebrow--dark">Mission</p>
                <h2 className="pg-display">Our Mission</h2>
                <p className="pg-body">Compress the distance from insight to shelf.</p>
                <p className="pg-body au2-mv__support">
                  Meolaa is an AI-native house of consumer brands, built to read
                  demand and launch faster than any traditional FMCG company can
                  move.
                </p>
                <Link className="au2-mv__link" to="/story">
                  Our story →
                </Link>
              </div>
            </article>
            <article className="au2-mv__panel is-in" data-mv-panel="vision">
              <div className="au2-mv__panel-media" aria-hidden="true">
                <img src="/assets/pages/about-hero.jpg" alt="" />
              </div>
              <div className="au2-mv__panel-text">
                <p className="pg-eyebrow pg-eyebrow--dark">Vision</p>
                <h2 className="pg-display">Our Vision</h2>
                <p className="pg-body">A category for every validated signal.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        className="au-roadmap is-static"
        id="about-story"
        aria-label="Our Story"
      >
        <div className="au-roadmap__pin">
          <div className="au-roadmap__card">
            <header className="au-roadmap__header">
              <div className="au-roadmap__intro">
                <p className="au-roadmap__caption">Milestones</p>
                <h2 className="au-roadmap__title">Our Story</h2>
                <p className="au-roadmap__subtitle">
                  From incorporation to one operating system.
                </p>
              </div>
              <p className="au-roadmap__desc">
                Meolaa is an AI-native house of consumer brands — built to read
                demand and launch faster than any traditional FMCG company can
                move. These are the moments that shaped the model.
              </p>
            </header>
            <div className="au-roadmap__stage">
              <div className="au-roadmap__line" aria-hidden="true" />
              <div className="au-roadmap__track" role="list">
                {ROADMAP_STEPS.map((step, i) => (
                  <article
                    key={step.capsule}
                    className={`au-roadmap__step${i === 0 ? ' is-active' : ''}`}
                    role="listitem"
                    aria-current={i === 0 ? 'step' : undefined}
                  >
                    <span className="au-roadmap__capsule">{step.capsule}</span>
                    <span className="au-roadmap__marker" aria-hidden="true">
                      <span className="au-roadmap__ring" />
                      <span className="au-roadmap__diamond" />
                    </span>
                    <ul className="au-roadmap__bullets">
                      {step.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fold pillars" aria-label="How we build brands">
        <h2 className="pillars__title">HOW WE BUILD BRANDS</h2>
        <div className="pillars__track">
          {PILLARS.map((pillar) => (
            <article key={pillar.label} className="pillar-card">
              <img src="/assets/imgRectangle34624962.png" alt="" />
              <p className="label">{pillar.label}</p>
              <h3>{pillar.title}</h3>
              <p>{pillar.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lead-grid" id="leadership">
        <div className="lead-grid__cell lead-grid__cell--intro">
          <p className="lead-grid__eyebrow">
            <span aria-hidden="true" /> OUR LEADERSHIP TEAM
          </p>
          <h2 className="lead-grid__title">
            Meet our
            <br />
            visionaries.
          </h2>
        </div>
        {LEADERS.map((person) => (
          <article key={person.name} className="lead-grid__cell lead-grid__cell--person">
            <div className="lead-grid__img">
              <img src={person.img} alt={person.name} loading="lazy" />
            </div>
            <div className="lead-grid__foot">
              <div>
                <p className="lead-grid__name">{person.name}</p>
                <p className="lead-grid__role">{person.role}</p>
              </div>
              <a className="lead-grid__linkedin" href="#" aria-label="LinkedIn">
                in
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="val-rows">
        <p className="pg-eyebrow pg-eyebrow--dark">CULTURE VALUES</p>
        <div className="val-rows__list">
          {VALUES.map((v) => (
            <div key={v.num} className="val-row">
              <div className="val-row__ticker" aria-hidden="true">
                <span className="val-row__ticker-track">{v.ticker}</span>
                <span className="val-row__ticker-track">{v.ticker}</span>
              </div>
              <span className="val-row__num">{v.num}</span>
              <strong className="val-row__title">{v.title}</strong>
              <span className="val-row__desc">{v.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <WhereNextSection links={WHERE_NEXT} />
    </PageLayout>
  )
}
