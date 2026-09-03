import { Link } from 'react-router-dom'
import { AboutRoadmapSection } from '../components/about/AboutRoadmapSection'
import '../components/about/AboutMissionReveal.css'
import { AboutWhyExistSection } from '../components/about/AboutWhyExistSection'
import { InnerPageSectionHead } from '../components/layout/InnerPageSectionHead'
import { PageLayout } from '../components/layout/PageLayout'

const PILLARS = [
  {
    label: 'Signal',
    title: 'We read the market before it moves.',
    desc: 'Consumer behaviour, demand and whitespace, sorted into a single opportunity score.',
    img: '/assets/pages/about-pillar-signal.jpg',
  },
  {
    label: 'Build',
    title: 'AI does the heavy lifting.',
    desc: 'Product, brand and go-to-market assembled by a small team, not a large one.',
    img: '/assets/pages/about-pillar-build.jpg',
  },
  {
    label: 'Run',
    title: 'The system keeps it running.',
    desc: 'Distribution, content and operations kept alive by the same engine that built it.',
    img: '/assets/pages/about-pillar-run.jpg',
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
  {
    name: 'Ishita Sawant',
    role: 'Founder & CEO',
    img: '/assets/pages/story-hero-portrait.jpg',
  },
  { name: 'Head of Intelligence', role: 'Intelligence', img: '/assets/team/team-02.jpg' },
  { name: 'Head of Brand', role: 'Brand build', img: '/assets/team/team-03.jpg' },
  { name: 'Head of Growth', role: 'Growth & ops', img: '/assets/team/team-04.jpg' },
] as const

export function AboutPage() {
  return (
    <PageLayout pageClass="page-editorial" footerSimple={false}>
      <section className="au-fold1" aria-label="About Us">
        <div className="au-fold1__pin">
          <header className="au-fold1__head">
            <div className="section-head section-head--on-light">
              <p className="section-head__eyebrow">About Us</p>
              <h1 className="section-head__title au-fold1__title">
                A technology company{' '}
                <span className="au-fold1__accent">building consumer brands</span>.
              </h1>
            </div>
            <div className="au-fold1__ctas">
              <a className="btn btn--solid-dark" href="#mission">
                Our thesis ↓
              </a>
              <a className="btn btn--ghost-dark" href="#leadership">
                Meet the team ↓
              </a>
            </div>
          </header>
          <figure className="au-fold1__video-box">
            <img
              className="au-fold1__video"
              src="/assets/pages/about-hero.jpg"
              alt="Meolaa team at work"
              loading="eager"
            />
          </figure>
        </div>
      </section>

      <section className="au-reveal" id="mission" aria-label="The Model">
        <div className="au-reveal__intro">
          <InnerPageSectionHead
            eyebrow="The Model"
            title={
              <>
                AI-native, digitally{'\u2011'}native,{' '}
                <span>and built to move at the speed of demand.</span>
              </>
            }
            sub="Every function — insight, product, brand, distribution — is designed around the same data layer, so a small team can do what used to take a large one."
            tone="on-light"
            align="center"
          />
        </div>

        <div className="au-reveal__pin" data-reveal-pin>
          <div className="au-reveal__stage">
            <div className="au-reveal__clip" data-reveal-clip>
              <img
                className="au-reveal__img"
                src="/assets/pages/about-mission.jpg"
                alt="Meolaa team collaborating in the office"
              />
            </div>
            <div className="au-reveal__copy-stack">
              <div
                className="au-reveal__copy au-reveal__copy--mission section-head section-head--on-light section-head--start"
                data-reveal-copy="mission"
              >
                <p className="section-head__eyebrow">Mission</p>
                <h2 className="section-head__title">Our Mission</h2>
                <p className="section-head__sub">
                  Compress the distance from insight to shelf.
                </p>
                <p className="pg-body au-reveal__support">
                  Meolaa is an AI-native house of consumer brands, built to read
                  demand and launch faster than any traditional FMCG company can
                  move.
                </p>
                <Link className="au-reveal__link" to="/story">
                  Our story →
                </Link>
              </div>
              <div
                className="au-reveal__copy au-reveal__copy--vision section-head section-head--on-light section-head--start"
                data-reveal-copy="vision"
              >
                <p className="section-head__eyebrow">Vision</p>
                <h2 className="section-head__title">Our Vision</h2>
                <p className="section-head__sub">
                  A category for every validated signal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AboutRoadmapSection />

      <AboutWhyExistSection />

      <section className="fold pillars" data-section="pillars" aria-label="How we build brands">
        <InnerPageSectionHead
          className="pillars__head"
          eyebrow="How we work"
          title="How we build brands"
          tone="on-dark"
          align="center"
        />
        <div className="pillars__track">
          {PILLARS.map((pillar) => (
            <article key={pillar.label} className="pillar-card">
              <img
                src={pillar.img}
                alt={`${pillar.label} — how Meolaa builds brands`}
                loading="lazy"
              />
              <p className="label">{pillar.label}</p>
              <h3>{pillar.title}</h3>
              <p>{pillar.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lead-grid" id="leadership" data-au-leadership>
        <div className="lead-grid__cell lead-grid__cell--intro">
          <InnerPageSectionHead
            eyebrow="Our leadership team"
            title={
              <>
                Meet our
                <br />
                visionaries.
              </>
            }
            tone="on-light"
            align="start"
          />
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
        <p className="section-head__eyebrow">Culture values</p>
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

    </PageLayout>
  )
}
