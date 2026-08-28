import { type FormEvent } from 'react'
import { PageLayout } from '../components/layout/PageLayout'

const CHANNELS = [
  {
    title: 'General inquiries',
    email: 'hello@meolaa.com',
    desc: 'Company, product and partnership questions.',
  },
  {
    title: 'Press & media',
    email: 'press@meolaa.com',
    desc: 'Interviews, assets and newsroom requests.',
  },
  {
    title: 'Careers',
    email: 'careers@meolaa.com',
    desc: 'Open roles and speculative applications.',
  },
  {
    title: 'Investors & partners',
    email: 'partners@meolaa.com',
    desc: 'Funding, strategic and brand partnerships.',
  },
] as const

function onContactSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault()
}

export function ContactPage() {
  return (
    <PageLayout pageClass="page-editorial">
      <header className="ed-hero ed-hero--light" id="contact">
        <div className="ed-rise ed-rise--bleed" aria-hidden="true">
          <img src="/assets/imgImage234.png" alt="" />
        </div>
        <div className="ed-veil ed-veil--hero" aria-hidden="true" />
        <div className="ed-hero__content">
          <p className="pg-eyebrow pg-eyebrow--light">Contact</p>
          <h1 className="pg-display">Get in touch.</h1>
          <p className="pg-body pg-body--light">
            Whether you&apos;re exploring a partnership, covering our story or
            looking to join the team — we&apos;d like to hear from you.
          </p>
          <nav className="ed-hero__anchors" aria-label="Contact channels">
            {CHANNELS.map((ch) => (
              <a key={ch.email} href={`mailto:${ch.email}`}>
                {ch.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="pt-form-sec">
        <p className="pg-eyebrow pg-eyebrow--dark">Write to us</p>
        <h2 className="ct-section-title">Send a message</h2>
        <p className="ct-section-lede">
          Fill out the form and we&apos;ll route your note to the right team.
        </p>
        <form className="pt-form" onSubmit={onContactSubmit} noValidate>
          <div className="pt-field">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" name="name" type="text" autoComplete="name" required />
          </div>
          <div className="pt-field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="pt-field">
            <label htmlFor="contact-topic">Topic</label>
            <select id="contact-topic" name="topic" defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              <option value="general">General inquiry</option>
              <option value="press">Press &amp; media</option>
              <option value="careers">Careers</option>
              <option value="partners">Investors &amp; partners</option>
            </select>
          </div>
          <div className="pt-field">
            <label htmlFor="contact-company">Company</label>
            <input id="contact-company" name="company" type="text" autoComplete="organization" />
          </div>
          <div className="pt-field pt-field--full">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" rows={5} required />
          </div>
          <button type="submit" className="ct-btn ct-btn--dark pt-form__submit">
            Send message
          </button>
          <p className="pt-form__note">
            We aim to respond within two business days.
          </p>
        </form>
      </section>

      <section
        className="press-contact"
        style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
      >
        <p className="pg-eyebrow pg-eyebrow--dark">Direct lines</p>
        <h2 className="pg-h2" style={{ marginTop: 16 }}>
          Or email us directly
        </h2>
        <div
          className="press-contact__grid"
          style={{ gridTemplateColumns: '1fr', gap: 32 }}
        >
          {CHANNELS.map((ch) => (
            <div key={ch.email} style={{ paddingBlock: 8 }}>
              <h3
                className="press-contact__name"
                style={{ fontSize: 20, margin: 0 }}
              >
                {ch.title}
              </h3>
              <p className="press-contact__role">{ch.desc}</p>
              <a className="press-contact__email" href={`mailto:${ch.email}`}>
                {ch.email}
              </a>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  )
}
