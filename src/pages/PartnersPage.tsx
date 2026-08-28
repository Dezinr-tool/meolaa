import { useRef, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { WhereNextSection } from '../components/layout/WhereNextSection'
import { InnerSectionHero } from '../components/layout/InnerSectionHero'
import { InnerPageSectionHead } from '../components/layout/InnerPageSectionHead'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'

const INVESTOR_LOGOS = [
  { src: '/assets/partners/colossa-ventures.svg', alt: 'Colossa Ventures' },
  { src: '/assets/partners/general-catalyst.svg', alt: 'General Catalyst' },
  { src: '/assets/partners/turbostart.svg', alt: 'Turbostart' },
  {
    src: '/assets/partners/ranjan-pai-family-office.svg',
    alt: 'Ranjan Pai Family Office',
  },
] as const

const PARTNER_TYPES = [
  {
    num: '01',
    title: 'Supply & manufacturing',
    desc: 'Formulation partners and contract manufacturers with capacity across personal care, fragrance and kitchen categories.',
    cta: 'Enquire →',
  },
  {
    num: '02',
    title: 'Distribution & retail',
    desc: 'Marketplaces, modern trade and quick-commerce platforms taking on new brands as they launch.',
    cta: 'Enquire →',
  },
  {
    num: '03',
    title: 'Brand collaboration',
    desc: 'Co-created lines, licensing and creator-led launches built on top of the same operating system.',
    cta: 'Enquire →',
  },
] as const

const STEPS = [
  {
    num: '01',
    title: 'Get in touch',
    desc: 'Send the enquiry form with your partnership type — it routes straight to the right team.',
  },
  {
    num: '02',
    title: 'Intro call',
    desc: 'A 30-minute session on fit, category and capacity within five working days.',
  },
  {
    num: '03',
    title: 'Pilot scope',
    desc: 'We define a single-brand pilot with a measurable outcome and a fixed window.',
  },
  {
    num: '04',
    title: 'Agreement',
    desc: "Terms signed, systems connected, and you're live across the portfolio.",
  },
] as const

const QUOTES = [
  {
    quote:
      "Most consumer companies pitch a brand. Meolaa pitched the machine that makes brands — that's a fundamentally different investment.",
    name: 'Partner',
    role: 'General Catalyst',
    img: '/assets/partners/general-catalyst.svg',
  },
  {
    quote:
      'We onboarded once and now supply three lines. The forecasting they send us is better than what we get from companies ten times their size.',
    name: 'Managing Director',
    role: 'Contract manufacturing partner',
    img: '/assets/partners/colossa-ventures.svg',
  },
] as const

const UPDATES = [
  {
    date: 'Jan 12, 2026',
    cat: 'Funding',
    title: 'Meolaa raises $6M to build an AI-native house of brands',
  },
  {
    date: 'Nov 3, 2025',
    cat: 'Company',
    title: 'Platform v2 unifies intelligence and brand operations',
  },
  {
    date: 'Jun 20, 2025',
    cat: 'Partnerships',
    title: 'Distribution agreement signed across quick-commerce platforms',
  },
  {
    date: 'Feb 8, 2025',
    cat: 'Funding',
    title: 'Pre-seed extension led by Ranjan Pai family office',
  },
] as const

const WHERE_NEXT = [
  { num: '04', to: '/lab', title: 'Meolaa Lab', desc: 'The system partners plug into. →' },
  { num: '05', to: '/press', title: 'Press & Media', desc: 'Every announcement, in one place. →' },
  { num: '07', to: '/careers', title: 'Careers', desc: 'The team behind the portfolio. →' },
] as const

function onPartnerSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault()
}

export function PartnersPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  useRevealOnScroll(rootRef)

  return (
    <PageLayout pageClass="page-editorial" navOverDark>
      <div ref={rootRef}>
        <InnerSectionHero
          eyebrow="Founded 2022 · Partners"
          title={
            <>
              Backing a system,
              <br />
              not a single bet.
            </>
          }
          body="Meolaa is capitalised to build a portfolio, and structured so every partner — investor, manufacturer, retailer — plugs into the same operating layer that runs it."
          imageSrc="/assets/pages/partners-hero.jpg"
          ctas={[
            { label: 'Meet the investors', href: '#investors', variant: 'solid' },
            { label: 'Investor updates', href: '#updates' },
          ]}
        >
          <div className="pt-stats">
            <div className="pt-stat">
              <p className="pt-stat__fig">$6M</p>
              <p className="pt-stat__label">RAISED TO DATE</p>
            </div>
            <div className="pt-stat">
              <p className="pt-stat__fig">4</p>
              <p className="pt-stat__label">INSTITUTIONAL BACKERS</p>
            </div>
            <div className="pt-stat">
              <p className="pt-stat__fig">3</p>
              <p className="pt-stat__label">PARTNERSHIP ROUTES</p>
            </div>
          </div>
        </InnerSectionHero>

        <section className="pt-investors" id="investors">
          <InnerPageSectionHead
            eyebrow="Investors"
            title="Capital that understands the model."
            sub="Institutional funds and operators who have built consumer companies before, and who back the system rather than any one launch."
          />
          <div className="pt-logo-grid">
            {INVESTOR_LOGOS.map((logo) => (
              <div key={logo.alt} className="pt-logo">
                <img className="pt-logo__img" src={logo.src} alt={logo.alt} />
              </div>
            ))}
          </div>
          <p className="pt-subhead">INDIVIDUAL &amp; STRATEGIC INVESTORS</p>
        </section>

        <section className="pt-types">
          <p className="pg-eyebrow pg-eyebrow--light">WHY PARTNER WITH MEOLAA</p>
          <h2 className="ct-section-title ct-section-title--light">
            One integration, every brand we launch.
          </h2>
          <p className="ct-section-lede">
            Partners connect once to the platform and serve the whole portfolio
            — so each new brand adds volume without adding onboarding.
          </p>
          <div className="pt-types__list">
            {PARTNER_TYPES.map((type) => (
              <article key={type.num} className="pt-type press-reveal">
                <span className="pt-type__num">{type.num}</span>
                <h3 className="pt-type__title">{type.title}</h3>
                <p className="pt-type__desc">{type.desc}</p>
                <a className="pt-type__cta" href="#contact">
                  {type.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-engage">
          <p className="pg-eyebrow pg-eyebrow--dark">HOW TO ENGAGE</p>
          <h2 className="ct-section-title">From first note to signed agreement.</h2>
          <div className="pt-steps">
            {STEPS.map((step) => (
              <article key={step.num} className="pt-step">
                <span className="pt-step__num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-quotes">
          <p className="pg-eyebrow pg-eyebrow--dark">IN THEIR WORDS</p>
          <div className="pt-quotes__grid">
            {QUOTES.map((q) => (
              <figure key={q.name} className="pt-quote press-reveal">
                <blockquote>{q.quote}</blockquote>
                <figcaption className="pt-quote__by">
                  <img src={q.img} alt="" />
                  <div>
                    <p className="pt-quote__name">{q.name}</p>
                    <p className="pt-quote__role">{q.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="pt-form-sec" id="contact">
          <p className="pg-eyebrow pg-eyebrow--dark">ENQUIRIES</p>
          <h2 className="ct-section-title">Tell us where you fit.</h2>
          <p className="ct-section-lede">
            Enquiries route by partnership type. We reply within five working days.
          </p>
          <form className="pt-form" onSubmit={onPartnerSubmit} noValidate>
            <div className="pt-field">
              <label htmlFor="partner-name">Name</label>
              <input id="partner-name" name="name" type="text" autoComplete="name" />
            </div>
            <div className="pt-field">
              <label htmlFor="partner-email">Email</label>
              <input
                id="partner-email"
                name="email"
                type="email"
                autoComplete="email"
              />
            </div>
            <div className="pt-field">
              <label htmlFor="partner-type">Partnership type</label>
              <select id="partner-type" name="type" defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                <option value="supply">Supply &amp; manufacturing</option>
                <option value="distribution">Distribution &amp; retail</option>
                <option value="brand">Brand collaboration</option>
                <option value="investor">Investor</option>
              </select>
            </div>
            <div className="pt-field">
              <label htmlFor="partner-org">Organisation</label>
              <input id="partner-org" name="organisation" type="text" />
            </div>
            <div className="pt-field pt-field--full">
              <label htmlFor="partner-message">Message</label>
              <textarea id="partner-message" name="message" rows={4} />
            </div>
            <button type="submit" className="ct-btn ct-btn--dark pt-form__submit">
              Send enquiry
            </button>
          </form>
        </section>

        <section className="pt-updates" id="updates">
          <p className="pg-eyebrow pg-eyebrow--light">INVESTOR UPDATES</p>
          <h2 className="pg-display ct-section-title ct-section-title--light">
            Funding and investor news.
          </h2>
          <div className="pt-updates__list">
            {UPDATES.map((update) => (
              <Link key={update.title} className="pt-update" to="/press">
                <span className="pt-update__date">{update.date}</span>
                <span className="pt-update__cat">{update.cat}</span>
                <span className="pt-update__title">{update.title}</span>
                <span className="pt-update__cta">Read →</span>
              </Link>
            ))}
          </div>
          <Link className="ct-btn pt-updates__all" to="/press">
            View all releases
          </Link>
        </section>

        <WhereNextSection links={WHERE_NEXT} />
      </div>
    </PageLayout>
  )
}
