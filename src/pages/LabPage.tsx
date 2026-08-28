import { useState } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { WhereNextSection } from '../components/layout/WhereNextSection'
import { InnerPageSectionHead } from '../components/layout/InnerPageSectionHead'

const OS_STAGES = [
  {
    num: '01',
    tag: 'SIGNAL',
    name: 'CMI Platform',
    desc: 'Reads consumer behaviour, demand and whitespace across categories.',
    io: 'Market & consumer data',
  },
  {
    num: '02',
    tag: 'BUILD',
    name: 'Brand Co-pilot',
    desc: 'Turns validated signal into product, identity, content and launch assets.',
    io: 'Opportunity score + brand thesis',
  },
  {
    num: '03',
    tag: 'RUN',
    name: 'Brands',
    desc: 'Live output — distribution, ops and performance feeding signal back upstream.',
    io: 'Launched product & brand system',
  },
] as const

const CAP_MODULES = [
  {
    num: '01',
    label: 'Reading demand',
    eyebrow: 'Capability 01',
    title: 'Reading demand',
    body: 'Consumer signals, whitespace and demand patterns scored into a single opportunity read.',
    image: '/assets/lab-reading-demand.png',
  },
  {
    num: '02',
    label: 'Product & brand',
    eyebrow: 'Capability 02',
    title: 'Product & brand',
    body: 'Formulation, packaging, identity and launch assets assembled by the build system.',
    image: '/assets/lab-product-brand.png',
  },
  {
    num: '03',
    label: 'Go-to-market',
    eyebrow: 'Capability 03',
    title: 'Go-to-market',
    body: 'Content, channels and campaigns orchestrated from one operating layer.',
    image: '/assets/lab-go-to-market.png',
  },
  {
    num: '04',
    label: 'Distribution & ops',
    eyebrow: 'Capability 04',
    title: 'Distribution & ops',
    body: 'Inventory, fulfilment and performance loops kept running after launch.',
    image: '/assets/lab-distribution-ops.png',
  },
] as const

const TECH_CARDS = [
  {
    title: 'Signal & data infra',
    desc: 'Ingestion pipelines, demand scoring models and category-whitespace mapping that power the CMI Platform.',
  },
  {
    title: 'Generative & automation layer',
    desc: 'Product, content and creative generation tools that run Brand Co-pilot from thesis to launch assets.',
  },
  {
    title: 'Distribution & ops tooling',
    desc: 'Commerce, fulfilment and performance systems that keep brands running after the first shipment.',
  },
  {
    title: 'Integration layer',
    desc: 'Connects CMI, Co-pilot and Brands into one continuous feedback loop — no orphaned handoffs.',
  },
] as const

const CASE_STAGES = [
  {
    num: '01',
    name: 'Reading demand',
    input: 'Category whitespace signal in bodycare',
    output: 'Validated opportunity score',
  },
  {
    num: '02',
    name: 'Product & brand',
    input: 'Opportunity score + brand thesis',
    output: 'Formulation, packaging, identity',
  },
  {
    num: '03',
    name: 'Go-to-market',
    input: 'Launch-ready brand system',
    output: 'Content, channels, campaign stack',
  },
  {
    num: '04',
    name: 'Distribution & ops',
    input: 'Live product line',
    output: 'HIRA shipping — performance looping back to CMI',
  },
] as const

const WHERE_NEXT = [
  { num: '01', to: '/', title: 'Home', desc: 'The full pitch, start to finish. →' },
  { num: '02', to: '/about', title: 'About Us', desc: 'The thesis behind the system. →' },
  { num: '06', to: '/partners', title: 'Partners', desc: 'Build on this system with us. →' },
] as const

export function LabPage() {
  const [activeCap, setActiveCap] = useState(0)

  return (
    <PageLayout pageClass="page-lab" navOverDark>
      <header className="lab-hero">
        <div className="lab-hero__field" aria-hidden="true">
          <div className="lab-hero__plate">
            <img src="/assets/pages/lab-hero.jpg" alt="HIRA product packaging development" />
          </div>
          <div className="lab-hero__veil" />
          <div className="lab-hero__scan" />
        </div>
        <div className="lab-hero__frame">
          <p className="lab-hero__brand">
            <span className="lab-hero__brand-line">
              <span className="lab-hero__brand-inner">Meolaa</span>
            </span>
            <span className="lab-hero__brand-line lab-hero__brand-line--lab">
              <span className="lab-hero__brand-inner">Brand Lab</span>
            </span>
          </p>
          <div
            className="lab-hero__threshold"
            aria-hidden="true"
            style={{ transform: 'scaleX(1)' }}
          />
          <div className="lab-hero__copy">
            <p className="lab-hero__headline">
              The engine behind every brand we build.
            </p>
            <p className="lab-hero__lede">
              Insight, product, brand and distribution — one integrated operating
              system, not three departments handing off to each other.
            </p>
          </div>
        </div>
        <div className="lab-hero__cue" aria-hidden="true">
          <span className="lab-hero__cue-rail" />
          <span className="lab-hero__cue-label">SCROLL</span>
        </div>
      </header>

      <section className="lab-intro">
        <div className="lab-intro__inner">
          <InnerPageSectionHead
            eyebrow="The System"
            title={
              <>
                Most companies treat insight, product and distribution as three
                handoffs. We treat them as one system.
              </>
            }
            sub={
              <>
                Meolaa Lab is the AI and data-science engine that finds whitespace,
                builds brands and keeps them running — a single loop where every live
                signal feeds the next decision.
              </>
            }
          />
          <div className="lab-intro__stats">
            <div>
              <p className="lab-stat__num">120+</p>
              <p className="lab-stat__label">
                Categories mapped for whitespace and demand patterns before a
                brand is greenlit.
              </p>
            </div>
            <div>
              <p className="lab-stat__num">8M+</p>
              <p className="lab-stat__label">
                Consumer signals tracked across markets, scored into a single
                opportunity read.
              </p>
            </div>
            <div>
              <p className="lab-stat__num">1</p>
              <p className="lab-stat__label">
                Team size that can run a brand end-to-end on the operating system.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lab-os">
        <div className="lab-os__inner">
          <InnerPageSectionHead
            eyebrow="The Three-Stage OS"
            title="Signal. Build. Run."
            sub="Three connected stages — each feeds the next, and live brand performance loops back into the signal layer."
            tone="on-dark"
            align="center"
            className="lab-os__head"
          />
          <div className="lab-os__tri" aria-hidden="true">
            <svg className="lab-os__svg" viewBox="0 0 200 200">
              <polygon className="lab-os__track" points="100,20 180,160 20,160" />
              <polygon
                className="lab-os__progress"
                points="100,20 180,160 20,160"
                style={{ strokeDasharray: 480, strokeDashoffset: 0 }}
              />
              <circle className="lab-os__vertex is-active" cx="100" cy="20" r="4" />
              <circle className="lab-os__vertex is-active" cx="180" cy="160" r="4" />
              <circle className="lab-os__vertex is-active" cx="20" cy="160" r="4" />
            </svg>
          </div>
          <ol className="lab-os__stages">
            {OS_STAGES.map((stage, i) => (
              <li
                key={stage.num}
                className={`lab-os__stage${i === 0 ? ' is-active' : ''}`}
              >
                <span className="lab-os__stage-num">{stage.num}</span>
                <div>
                  <span className="lab-os__stage-tag">{stage.tag}</span>
                  <h3 className="lab-os__stage-name">{stage.name}</h3>
                  <p className="lab-os__stage-desc">{stage.desc}</p>
                  <p className="lab-os__stage-io">
                    <span>I/O</span>
                    {stage.io}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lab-caps">
        <div className="lab-caps__sticky">
          <div className="lab-caps__copy">
            <InnerPageSectionHead
              eyebrow="Capability Modules"
              title="Four capabilities. One continuous loop."
              sub="From reading demand to keeping brands running — each stage feeds the next and loops back through live performance data."
              tone="on-dark"
            />
            <div className="lab-caps__index">
              {CAP_MODULES.map((mod, i) => (
                <button
                  key={mod.num}
                  type="button"
                  className={`lab-caps__tab${i === activeCap ? ' is-active' : ''}`}
                  onClick={() => setActiveCap(i)}
                >
                  <span className="lab-caps__tab-num">{mod.num}</span>
                  <span className="lab-caps__tab-label">{mod.label}</span>
                </button>
              ))}
            </div>
            <div className="lab-caps__panels">
              {CAP_MODULES.map((mod, i) => (
                <article
                  key={mod.num}
                  className={`lab-caps__panel${i === activeCap ? ' is-active' : ''}`}
                  hidden={i !== activeCap}
                >
                  <p className="lab-caps__panel-eyebrow">{mod.eyebrow}</p>
                  <h3 className="lab-caps__panel-title">{mod.title}</h3>
                  <p className="lab-caps__panel-body">{mod.body}</p>
                  <p className="lab-caps__counter">
                    {String(i + 1).padStart(2, '0')} / 04
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="lab-caps__media">
            {CAP_MODULES.map((mod, i) => (
              <img
                key={mod.num}
                className={`lab-caps__img${i === activeCap ? ' is-active' : ''}`}
                src={mod.image}
                alt={`${mod.title} — Meolaa Lab capability`}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="lab-tech">
        <div className="lab-tech__inner">
          <InnerPageSectionHead
            eyebrow="Technology Index"
            title="What's actually running under the hood."
            sub="Four layers that turn consumer signal into shipping brands — and route performance back into the next read."
          />
          <div className="lab-tech__bento">
            {TECH_CARDS.map((card, i) => (
              <article
                key={card.title}
                className={`lab-tech__card${i === 0 ? ' lab-tech__card--signal' : ''}${i === 3 ? ' lab-tech__card--integ' : ''}`}
              >
                <h3 className="lab-tech__name">{card.title}</h3>
                <p className="lab-tech__desc">{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lab-case">
        <div className="lab-case__inner">
          <InnerPageSectionHead
            eyebrow="Case Example — HIRA"
            title="One brand, run through every stage."
            sub="HIRA is Meolaa's first brand — built end-to-end on the platform. Here's the input and output at each stage."
          />
          <div className="lab-case__layout">
            <figure className="lab-case__media">
              <img
                src="/assets/portfolio-hira.jpg"
                alt="HIRA brand"
                loading="lazy"
              />
            </figure>
            <ol className="lab-case__stages">
              {CASE_STAGES.map((stage, i) => (
                <li
                  key={stage.num}
                  className={`lab-case__stage${i === 0 ? ' is-active' : ''}`}
                >
                  <span className="lab-case__stage-num">{stage.num}</span>
                  <div>
                    <h3 className="lab-case__stage-name">{stage.name}</h3>
                    <p className="lab-case__stage-io">
                      <span>Input</span>
                      {stage.input}
                    </p>
                    <p className="lab-case__stage-io">
                      <span>Output</span>
                      {stage.output}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <WhereNextSection links={WHERE_NEXT} />
    </PageLayout>
  )
}
