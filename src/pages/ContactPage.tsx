import { type FormEvent } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { InnerPageSectionHead } from '../components/layout/InnerPageSectionHead'

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
    <PageLayout pageClass="page-editorial" navOverDark>
      <header className="ed-hero ed-hero--light" id="contact">
        <div className="ed-rise ed-rise--bleed" aria-hidden="true">
          <img src="/assets/pages/contact-hero.jpg" alt="Meolaa team at work in the Bengaluru office" />
        </div>
        <div className="ed-veil ed-veil--hero" aria-hidden="true" />
        <div className="ed-hero__content">
          <div className="section-head section-head--start">
            <p className="section-head__eyebrow">Contact</p>
            <h1 className="section-head__title pg-display">Get in touch.</h1>
            <p className="section-head__sub pg-body--light">
              Whether you&apos;re exploring a partnership, covering our story or
              looking to join the team — we&apos;d like to hear from you.
            </p>
          </div>
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
        <InnerPageSectionHead
          eyebrow="Write to us"
          title="Send a message"
          sub="Fill out the form and we'll route your note to the right team."
        />
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
          <button type="submit" className="btn btn--solid-dark pt-form__submit">
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
        <InnerPageSectionHead
          eyebrow="Direct lines"
          title="Or email us directly"
        />
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
