import { useRef, type FormEvent } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { WhereNextSection } from '../components/layout/WhereNextSection'
import { InnerSectionHero } from '../components/layout/InnerSectionHero'
import { InnerPageSectionHead } from '../components/layout/InnerPageSectionHead'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

const ROLES = [
  {
    title: 'Senior Data Scientist, Consumer Intelligence',
    fn: 'Intelligence',
    loc: 'Bengaluru',
    type: 'Full-time',
  },
  {
    title: 'ML Engineer, Demand Models',
    fn: 'Intelligence',
    loc: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Brand Manager, New Launches',
    fn: 'Brand build',
    loc: 'Mumbai',
    type: 'Full-time',
  },
  {
    title: 'Product Development Lead, Personal Care',
    fn: 'Brand build',
    loc: 'Bengaluru',
    type: 'Full-time',
  },
  {
    title: 'Performance Marketing Lead',
    fn: 'Growth & ops',
    loc: 'Bengaluru',
    type: 'Full-time',
  },
  {
    title: 'Supply Chain Associate',
    fn: 'Growth & ops',
    loc: 'Remote',
    type: 'Full-time',
  },
] as const

const FUNCTIONS = [
  {
    num: '01',
    title: 'Intelligence',
    desc: 'Data science, consumer research and the models that decide what gets built next.',
  },
  {
    num: '02',
    title: 'Brand build',
    desc: 'Product development, design, formulation and the launch assets that ship with it.',
  },
  {
    num: '03',
    title: 'Growth & ops',
    desc: 'Performance, marketplaces, supply and the loops that keep a live brand compounding.',
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

const BENEFITS = [
  {
    num: '01',
    title: 'Ownership from day one',
    desc: "A named surface you're accountable for, not a queue of tickets.",
  },
  {
    num: '02',
    title: 'Equity in the portfolio',
    desc: "You hold a stake in the system, not a single brand's outcome.",
  },
  {
    num: '03',
    title: 'Health cover for family',
    desc: 'Comprehensive insurance extending to partners and dependants.',
  },
  {
    num: '04',
    title: 'Learning budget',
    desc: 'An annual allowance for courses, conferences and tooling.',
  },
  {
    num: '05',
    title: 'Flexible location',
    desc: 'Hubs in Bengaluru and Mumbai, remote where the role allows.',
  },
  {
    num: '06',
    title: 'Every brand, on us',
    desc: 'Full access to everything the portfolio ships, before it ships.',
  },
] as const

const LIFE_IMAGES = [
  {
    src: '/assets/culture/culture-01.jpg',
    alt: 'Meolaa team member editing brand content',
    tall: true,
  },
  {
    src: '/assets/culture/culture-02.jpg',
    alt: 'Team collaborating at shared desks in the Meolaa office',
    tall: false,
  },
  {
    src: '/assets/culture/culture-03.jpg',
    alt: 'Team members in conversation at the office café',
    tall: false,
  },
  {
    src: '/assets/culture/culture-04.jpg',
    alt: 'Behind-the-scenes brand photoshoot in the studio',
    tall: true,
  },
  {
    src: '/assets/culture/culture-05.jpg',
    alt: 'Creative team directing a product shoot',
    tall: false,
  },
  {
    src: '/assets/culture/culture-06.jpg',
    alt: 'Meolaa team at work in the Bengaluru office',
    tall: true,
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

const TEAM_LEADS = [
  { name: 'Data Science Lead', role: 'Demand models', img: '/assets/team/team-01.jpg' },
  { name: 'Research Lead', role: 'Consumer insight', img: '/assets/team/team-02.jpg' },
  { name: 'Analytics Lead', role: 'Signal scoring', img: '/assets/team/team-03.jpg' },
  { name: 'Platform Lead', role: 'Data layer', img: '/assets/team/team-04.jpg' },
  { name: 'Design Lead', role: 'Identity & packaging', img: '/assets/team/team-05.jpg' },
  { name: 'Product Lead', role: 'Formulation', img: '/assets/team/team-06.jpg' },
  { name: 'Content Lead', role: 'Launch assets', img: '/assets/team/team-07.jpg' },
  { name: 'Performance Lead', role: 'Paid & marketplaces', img: '/assets/team/team-08.jpg' },
  { name: 'Supply Lead', role: 'Manufacturing', img: '/assets/team/team-05.jpg' },
  { name: 'Ops Lead', role: 'Fulfilment', img: '/assets/team/team-06.jpg' },
] as const

const WHERE_NEXT = [
  { num: '02', to: '/about', title: 'About Us', desc: 'The thesis behind the company. →' },
  { num: '04', to: '/lab', title: 'Meolaa Lab', desc: "The system you'd be building on. →" },
  { num: '06', to: '/partners', title: 'Partners', desc: 'Who backs us and who we build with. →' },
] as const

function onSpecSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault()
}

export function CareersPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useRevealOnScroll(rootRef, '.how-work__fn')

  return (
    <PageLayout pageClass="page-editorial" navOverDark>
      <div ref={rootRef}>
        <InnerSectionHero
          eyebrow="Careers"
          title="Small team. Whole brands."
          body="Meolaa is built so one person can own something end to end — read the signal, build the brand, run the launch. If that's the job you've been waiting for, it exists here."
          imageSrc="/assets/pages/careers-hero.jpg"
          ctas={[
            { label: 'View open roles', href: '#roles', variant: 'solid' },
            { label: 'Meet the team', href: '#team' },
          ]}
        />

        <section className="how-work">
          <div className="how-work__layout">
            <InnerPageSectionHead
              eyebrow="How We Work"
              title="Three functions, one data layer."
              sub="Everyone joins one of three groups. All three read from the same system, which is why a team this size can run a portfolio."
              className="how-work__intro"
            />
            <div className="how-work__rail">
              {FUNCTIONS.map((fn) => (
                <article key={fn.num} className="how-work__fn is-in">
                  <span className="how-work__num">{fn.num}</span>
                  <div className="how-work__copy">
                    <h3 className="how-work__fn-title">{fn.title}</h3>
                    <p className="how-work__fn-desc">{fn.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ct-roles" id="roles">
          <InnerPageSectionHead
            eyebrow="Open Roles"
            title="Six roles open right now."
            sub="Every role reports into a founder and owns a measurable surface from week one."
          />
          <div className="ct-filters" role="group" aria-label="Filter roles">
            <div className="ct-filter-group">
              <span className="ct-filter-group__label">Function</span>
              <button type="button" className="ct-chip is-active">
                All
              </button>
              <button type="button" className="ct-chip">
                Intelligence
              </button>
              <button type="button" className="ct-chip">
                Brand build
              </button>
              <button type="button" className="ct-chip">
                Growth &amp; ops
              </button>
            </div>
          </div>
          <div className="ct-role-list">
            {ROLES.map((role) => (
              <a key={role.title} className="ct-role" href="mailto:careers@meolaa.com">
                <span className="ct-role__title">{role.title}</span>
                <span className="ct-role__fn">{role.fn}</span>
                <span className="ct-role__loc">{role.loc}</span>
                <span className="ct-role__type">{role.type}</span>
                <span className="ct-role__cta">Apply →</span>
              </a>
            ))}
          </div>
          <form className="ct-spec" onSubmit={onSpecSubmit} noValidate>
            <p className="pg-body" style={{ margin: 0 }}>
              No roles match that combination — try a different filter, or apply
              speculatively below.
            </p>
            <a className="ct-btn ct-btn--dark" href="mailto:careers@meolaa.com">
              Email careers@meolaa.com
            </a>
          </form>
        </section>

        <section className="val-rows">
          <p className="pg-eyebrow pg-eyebrow--dark">WHAT WE VALUE</p>
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

        <section className="ct-benefits">
          <p className="pg-eyebrow pg-eyebrow--light">BENEFITS</p>
          <h2 className="ct-section-title ct-section-title--light">
            What comes with the job.
          </h2>
          <div className="ct-benefits__grid">
            {BENEFITS.map((b) => (
              <article key={b.num} className="ct-benefit">
                <span className="ct-benefit__num">{b.num}</span>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ct-life" data-life-flow aria-labelledby="ct-life-title">
          <div className="ct-life__pin-height" data-life-pin-height>
            <div className="ct-life__container" data-life-container>
              <div className="ct-life__head">
                <p className="pg-eyebrow pg-eyebrow--light">LIFE AT MEOLAA</p>
                <h2 id="ct-life-title" className="pg-display ct-section-title ct-section-title--light">
                  Inside the studio.
                </h2>
              </div>
              {LIFE_IMAGES.map((img) => (
                <img
                  key={img.src}
                  className={`ct-life__media${img.tall ? ' ct-life__media--tall' : ' ct-life__media--wide'}`}
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="lead-grid">
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

        <section className="ct-team" id="team">
          <p className="pg-eyebrow pg-eyebrow--dark">THE TEAM</p>
          <h2 className="ct-section-title">Leads, by function.</h2>
          <div className="cr-team-scroll" role="list">
            {TEAM_LEADS.map((person) => (
              <article key={person.name} className="cr-team-scroll__card" role="listitem">
                <div className="cr-team-scroll__img">
                  <img src={person.img} alt="" loading="lazy" />
                </div>
                <div className="cr-team-scroll__foot">
                  <div>
                    <p className="cr-team-scroll__name">{person.name}</p>
                    <p className="cr-team-scroll__role">{person.role}</p>
                  </div>
                  <a className="cr-team-scroll__linkedin" href="#" aria-label="LinkedIn">
                    in
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <WhereNextSection links={WHERE_NEXT} />
      </div>
    </PageLayout>
  )
}
