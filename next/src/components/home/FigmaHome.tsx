"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const imgImage1 = "/figma/imgImage1.png";
const imgImage3 = "/figma/imgImage3.png";
const imgImage4 = "/figma/imgImage4.png";
const imgImage234 = "/figma/imgImage234.png";
const imgRectangle34624962 = "/figma/imgRectangle34624962.png";
const imgImage22525 = "/figma/imgImage22525.png";
const imgImage22526 = "/figma/imgImage22526.png";
const imgImage22524 = "/figma/imgImage22524.png";
const imgImage22523 = "/figma/imgImage22523.png";
const imgImage22527 = "/figma/imgImage22527.png";
const imgImage = "/figma/imgImage.png";
const imgImage2 = "/figma/imgImage2.png";
const imgImage5 = "/figma/imgImage5.png";
const imgImage6 = "/figma/imgImage6.png";
const logoWhite = "/figma/logo-white.png";

export function FigmaHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const visionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLElement>(null);
  const pillarsTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) return;

      // Arrow moves through every fold
      if (arrowRef.current) {
        gsap.fromTo(
          arrowRef.current,
          { top: "14vh", left: "78vw", rotate: 0, opacity: 0.95 },
          {
            top: "82vh",
            left: "12vw",
            rotate: 420,
            opacity: 0.5,
            ease: "none",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.1,
            },
          },
        );
      }

      // Hero parallax
      gsap.to("[data-hero='bg']", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-section='hero']",
          scrub: true,
          start: "top top",
          end: "bottom top",
        },
      });
      gsap.to("[data-hero='logo']", {
        yPercent: -8,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-section='hero']",
          scrub: true,
          start: "top top",
          end: "bottom top",
        },
      });

      // Fold 2: copy highlight → video from below → full page
      const lines = gsap.utils.toArray<HTMLElement>("[data-vision-line]");
      const vision = visionRef.current;
      const video = videoRef.current;
      if (vision && video && lines.length) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: vision,
            start: "top top",
            end: "+=320%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        lines.forEach((line, i) => {
          tl.to(
            line,
            {
              opacity: 1,
              filter: "blur(0px)",
              color: "#000",
              duration: 0.4,
            },
            i * 0.4,
          );
        });

        tl.fromTo(
          video,
          {
            y: "55vh",
            width: 505,
            height: 311,
            borderRadius: 2,
          },
          {
            y: 0,
            width: () => window.innerWidth,
            height: () => window.innerHeight,
            borderRadius: 0,
            duration: 1.35,
            ease: "power2.inOut",
          },
          "+=0.2",
        );
      }

      // How we build brands — horizontal card scroll
      const track = pillarsTrackRef.current;
      const pillars = pillarsRef.current;
      if (track && pillars) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth + 64),
          ease: "none",
          scrollTrigger: {
            trigger: pillars,
            start: "top top",
            end: () => `+=${track.scrollWidth}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });
      }

      // Brand stack
      gsap.utils.toArray<HTMLElement>("[data-brand-row]").forEach((row, i) => {
        gsap.fromTo(
          row,
          { y: 100 + i * 30, opacity: 0.3 },
          {
            y: 0,
            opacity: 1,
            scrollTrigger: {
              trigger: row,
              start: "top 90%",
              end: "top 50%",
              scrub: true,
            },
          },
        );
      });

      // Stair metrics
      gsap.utils.toArray<HTMLElement>("[data-metric]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            scrollTrigger: {
              trigger: "[data-section='metrics']",
              start: `top+=${i * 45} 85%`,
              end: `top+=${i * 45 + 80} 60%`,
              scrub: true,
            },
          },
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative w-full overflow-x-hidden bg-white">
      {/* Arrow motif — every fold */}
      <div
        ref={arrowRef}
        className="pointer-events-none fixed z-[70] h-12 w-12 sm:h-16 sm:w-16"
        aria-hidden
      >
        <img src={logoWhite} alt="" className="h-full w-full object-contain drop-shadow-lg" />
      </div>

      {/* ===== HERO — full blade ===== */}
      <section data-section="hero" className="relative h-screen min-h-[640px] w-full overflow-hidden bg-black">
        <header className="absolute inset-x-0 top-0 z-40 flex h-[92px] items-center justify-between px-6 md:px-16">
          <img src={logoWhite} alt="Meolaa" className="h-[25px] w-[125px] object-contain object-left" />
          <nav className="hidden items-center gap-4 text-[14.5px] font-medium text-white lg:flex">
            <span>Platform</span>
            <span>Brands</span>
            <span>Careers</span>
            <span>Who We Are</span>
            <span>Investors</span>
          </nav>
        </header>

        <div data-hero="bg" className="absolute inset-0">
          <img src={imgImage1} alt="" className="h-full w-full object-cover mix-blend-luminosity" />
        </div>
        <div
          data-hero="logo"
          className="absolute left-[1.25%] right-[1.25%] top-[28%] flex h-[30vh] max-h-[284px] items-center justify-center md:top-[32%]"
        >
          <img src={imgImage3} alt="Meolaa" className="max-h-full w-full object-contain" />
        </div>
        <div className="absolute inset-0">
          <img src={imgImage4} alt="" className="h-full w-full object-cover mix-blend-luminosity" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 grid gap-8 px-6 pb-10 md:grid-cols-[1.15fr_0.85fr] md:items-end md:px-10 lg:px-16 lg:pb-12">
          <h1 className="max-w-[700px] font-[family-name:var(--font-fraunces)] text-[clamp(2.5rem,5vw,4rem)] font-light leading-[1.08] text-white">
            The operating system
            <br />
            for consumer brands.
          </h1>
          <div className="max-w-[424px] justify-self-start md:justify-self-end">
            <p className="text-[16.5px] leading-[1.55] text-[rgba(245,237,232,0.75)]">
              Meolaa is an AI-native house of consumer brands reading demand, building products and
              running go-to-market as one connected system.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a
                href="/our-story"
                className="rounded-[2px] bg-white px-[26px] py-[15px] text-[14.5px] font-medium text-black"
              >
                Read Our Story
              </a>
              <button
                type="button"
                className="rounded-[2px] border border-[rgba(245,237,232,0.4)] px-[26px] py-[15px] text-[14.5px] font-medium text-white"
              >
                ▶ Watch the film
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOLD 2 — copy highlight + video full-page ===== */}
      <section
        ref={visionRef}
        data-section="vision"
        className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-white"
      >
        <div className="relative z-10 mx-auto flex w-[min(1012px,90vw)] flex-col items-center gap-3 text-center">
          <p
            data-vision-line
            className="font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4.2vw,3.5rem)] font-light leading-[1.3] text-black"
          >
            Every category has an unmet need.
          </p>
          <p
            data-vision-line
            className="font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4.2vw,3.5rem)] font-light leading-[1.3]"
            style={{ opacity: 0.12, filter: "blur(4px)", color: "rgba(0,0,0,0.15)" }}
          >
            We find it, build for it, and run it faster
          </p>
          <p
            data-vision-line
            className="font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4.2vw,3.5rem)] font-light leading-[1.3]"
            style={{ opacity: 0.12, filter: "blur(4px)", color: "rgba(0,0,0,0.15)" }}
          >
            than anyone else can.
          </p>
        </div>

        <div
          ref={videoRef}
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-[#111] will-change-[width,height,transform]"
          style={{ width: 505, height: 311 }}
        >
          <video
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            poster={imgImage1}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 text-sm text-white/70">
            Video
          </div>
        </div>
      </section>

      {/* ===== HOW WE BUILD BRANDS ===== */}
      <section
        ref={pillarsRef}
        data-section="pillars"
        className="relative h-screen w-full overflow-hidden bg-black"
      >
        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-luminosity">
          <img src={imgImage234} alt="" className="h-full w-full object-cover" />
        </div>
        <h2 className="absolute left-1/2 top-[8vh] z-10 -translate-x-1/2 whitespace-nowrap px-4 text-center font-[family-name:var(--font-fraunces)] text-[clamp(2.5rem,8vw,6rem)] font-light text-white blur-[6px]">
          HOW WE BUILD BRANDS
        </h2>
        <div ref={pillarsTrackRef} className="absolute inset-y-0 left-0 flex items-center gap-8 px-8 pt-24">
          {[
            {
              label: "Signal",
              title: "We read the market before it moves.",
              body: "Consumer behaviour, demand and whitespace, sorted into a single opportunity score.",
              mt: "mt-0",
            },
            {
              label: "Build",
              title: "AI does the heavy lifting.",
              body: "Product, brand and go-to-market assembled by a small team, not a large one.",
              mt: "mt-20",
            },
            {
              label: "Run",
              title: "The system keeps it running.",
              body: "Distribution, content and operations kept alive by the same engine that built it.",
              mt: "mt-40",
            },
          ].map((card) => (
            <article
              key={card.label}
              className={`h-[min(509px,70vh)] w-[min(418px,85vw)] shrink-0 bg-white/5 p-8 ${card.mt}`}
            >
              <div className="mb-8 size-[159px]">
                <img src={imgRectangle34624962} alt="" className="size-full object-cover" />
              </div>
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-sm text-white/40">
                {card.label}
              </p>
              <h3 className="mt-4 font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,3vw,2.625rem)] font-light leading-[1.08] text-white">
                {card.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[rgba(245,237,232,0.75)]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ===== MEOLAA LAB ===== */}
      <section className="relative w-full overflow-hidden bg-[#f5f1ea]">
        <div className="grid min-h-[756px] lg:grid-cols-[minmax(280px,0.35fr)_1fr]">
          <div className="relative px-8 py-16 md:px-16">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[12px] tracking-[0.96px] text-black/50">
              MEOLAA LAB
            </p>
            <div className="pointer-events-none absolute left-8 top-28 h-[50%] w-[60%] opacity-10 md:left-16">
              <img src={imgImage22527} alt="" className="h-full w-full object-contain object-left" />
            </div>
            <p className="absolute bottom-12 left-8 max-w-[322px] font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,3vw,2.625rem)] font-light leading-[1.08] md:left-16">
              One system. Four capabilities.
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-black/10 lg:grid-cols-4 lg:border-t-0 lg:border-l">
            {[
              { id: "01", title: "Reading demand", img: imgImage22523 },
              { id: "02", title: "Product & brand", img: imgImage22524 },
              { id: "03", title: "Go-to-market", img: imgImage22525 },
              { id: "04", title: "Distribution & ops", img: imgImage22526 },
            ].map((col) => (
              <div key={col.id} className="relative min-h-[420px] border-l border-black/10 first:border-l-0">
                <p className="absolute left-4 top-6 text-[14px] text-[#211a37]">{col.id}</p>
                <h3 className="absolute left-4 top-14 max-w-[90%] font-[family-name:var(--font-fraunces)] text-[clamp(1.5rem,2.5vw,2.625rem)] font-light leading-[1.08]">
                  {col.title}
                </h3>
                <div className="absolute inset-x-0 bottom-0 top-36 overflow-hidden">
                  <img src={col.img} alt="" className="h-full w-full object-cover object-top" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PORTFOLIO ===== */}
      <section className="flex min-h-[70vh] w-full items-center justify-center bg-white px-6">
        <h2 className="text-center font-[family-name:var(--font-fraunces)] text-[clamp(2.5rem,8vw,6rem)] font-light text-black blur-[6px]">
          THE PORTFOLIO
        </h2>
      </section>

      <section className="w-full bg-white px-6 py-20 md:px-16">
        <p className="text-[11px] font-semibold tracking-[2.86px] text-[#6b6b6b]">BRANDS</p>
        {[
          {
            n: "1",
            name: "HIRA",
            desc: "Bodycare — Meolaa's first brand, live and shipping.",
            cta: "View brand ↗",
            img: imgImage,
            soon: false,
          },
          {
            n: "2",
            name: "Brand 02",
            desc: "Beauty — Validated opportunity, in build.",
            cta: "Coming soon",
            img: imgImage2,
            soon: true,
          },
          {
            n: "3",
            name: "Brand 03",
            desc: "TBD — Next signal in the pipeline.",
            cta: "Coming soon",
            img: imgImage6,
            soon: true,
          },
        ].map((b, i) => (
          <div key={b.name}>
            <article
              data-brand-row
              className="flex flex-col gap-8 py-8 lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="flex flex-1 flex-wrap items-start gap-6 md:gap-8">
                <p className="font-[family-name:var(--font-fraunces)] text-[clamp(4rem,10vw,7.5rem)] font-black leading-[0.8] tracking-[-0.06em]">
                  {b.n}
                </p>
                <p className="pt-4 font-[family-name:var(--font-fraunces)] text-lg">{b.name}</p>
                <div className="max-w-[710px] pt-4">
                  {b.soon && (
                    <p className="mb-2 text-[10px] font-medium tracking-[1.8px] text-[#6b6b6b]">
                      COMING SOON
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{b.desc}</p>
                  <p className={`mt-2 text-[13px] font-medium ${b.soon ? "text-[#6b6b6b]" : ""}`}>
                    {b.cta}
                  </p>
                </div>
              </div>
              <div className="relative h-[220px] w-full max-w-[360px] overflow-hidden bg-[#e6e6e6] mix-blend-luminosity">
                <img src={b.img} alt="" className="h-full w-full object-cover" />
                {i === 1 && (
                  <img src={imgImage5} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                )}
              </div>
            </article>
            {i < 2 && <div className="h-px bg-[#dbdbdb]" />}
          </div>
        ))}
      </section>

      {/* ===== STAIRS ===== */}
      <section data-section="metrics" className="relative grid w-full grid-cols-2 bg-white lg:grid-cols-4">
        {[
          { v: "$6M", l: "Raised across seed rounds", h: "min-h-[176px] lg:mt-[275px]" },
          { v: "120+", l: "Categories mapped", h: "min-h-[220px] lg:mt-[191px]" },
          { v: "1", l: "Brand live", h: "min-h-[280px] lg:mt-[92px]" },
          { v: "3", l: "Market Served", h: "min-h-[320px] lg:mt-0" },
        ].map((m) => (
          <div
            key={m.l}
            data-metric
            className={`flex flex-col items-center justify-center bg-black px-4 py-12 text-center text-white ${m.h}`}
          >
            <p className="font-[family-name:var(--font-fraunces)] text-[clamp(3rem,8vw,6rem)] font-light leading-[1.2]">
              {m.v}
            </p>
            <p className="mt-2 text-sm text-[rgba(245,237,232,0.6)]">{m.l}</p>
          </div>
        ))}
      </section>

      {/* ===== INVESTORS ===== */}
      <section className="flex w-full flex-col items-center gap-9 bg-black px-6 py-[100px] text-center text-white md:px-16">
        <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[12px] tracking-[0.96px] text-white/50">
          BACKED BY
        </p>
        <h2 className="max-w-[553px] font-[family-name:var(--font-fraunces)] text-[28px] font-light">
          Investors who back systems, not just brands.
        </h2>
        <div className="flex flex-wrap justify-center gap-10 font-[family-name:var(--font-fraunces)] text-[19px] font-semibold text-[rgba(245,237,232,0.4)]">
          <span>Colossa Ventures</span>
          <span>General Catalyst</span>
          <span>Turbostart</span>
        </div>
        <a
          href="/partners"
          className="rounded-[2px] border border-[rgba(245,237,232,0.4)] px-6 py-[13px] text-sm font-medium"
        >
          Partner with us →
        </a>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="flex w-full flex-col items-center gap-6 bg-white px-6 py-[90px] text-center md:px-16">
        <h2 className="font-[family-name:var(--font-fraunces)] text-[clamp(1.5rem,3vw,1.875rem)] font-light">
          Get the signal before it&apos;s a headline.
        </h2>
        <div className="flex w-full max-w-[440px]">
          <input
            type="email"
            placeholder="you@company.com"
            className="h-12 flex-1 border border-[rgba(10,48,56,0.3)] px-[18px] text-sm outline-none"
          />
          <button type="button" className="h-12 w-[120px] bg-black text-sm font-medium text-white">
            Subscribe
          </button>
        </div>
        <p className="text-[11.5px] text-black/40">
          By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
        </p>
      </section>

      {/* ===== WHERE TO NEXT ===== */}
      <section className="w-full bg-black px-6 py-[90px] text-white md:px-16">
        <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.88px] text-[rgba(245,237,232,0.4)]">
          WHERE TO NEXT
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { n: "02", t: "About Us", h: "The thesis behind an AI-native brand company. →" },
            { n: "04", t: "Meolaa Lab", h: "How the OS finds and builds every brand. →" },
            { n: "07", t: "Careers", h: "Build with a small team, real ownership. →" },
          ].map((c) => (
            <div
              key={c.n}
              className="border border-[rgba(245,237,232,0.15)] bg-[rgba(245,237,232,0.05)] p-6"
            >
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] text-[rgba(192,138,46,0.8)]">
                {c.n}
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-fraunces)] text-[19px] font-semibold">
                {c.t}
              </h3>
              <p className="mt-3 text-[12.5px] text-[rgba(245,237,232,0.55)]">{c.h}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="w-full bg-black px-6 pb-10 pt-[72px] text-white md:px-16">
        <div className="grid gap-10 border-b border-[rgba(245,237,232,0.15)] pb-12 md:grid-cols-2 lg:grid-cols-5">
          <p className="text-[13.5px] text-[rgba(245,237,232,0.6)]">
            Reading the market.
            <br />
            Building what it needs.
          </p>
          <div className="space-y-3 text-[15px]">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11.5px] tracking-[0.92px] text-white/50">
              COMPANY
            </p>
            <p>CMI Platform</p>
            <p>Brand Co-pilot</p>
            <p>Our Brands</p>
            <p>Who We Are</p>
            <p>Careers</p>
          </div>
          <div className="space-y-3 text-[15px]">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11.5px] tracking-[0.92px] text-white/50">
              CONNECT
            </p>
            <p>Contact</p>
            <p>Newsroom</p>
            <p>Investors & Partners</p>
          </div>
          <div className="space-y-3 text-[15px]">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11.5px] tracking-[0.92px] text-white/50">
              BRANDS
            </p>
            <p>HIRA ↗</p>
          </div>
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11.5px] tracking-[0.92px] text-white/50">
              NEWSLETTER
            </p>
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full max-w-[200px] rounded border border-[rgba(245,237,232,0.25)] bg-[rgba(245,237,232,0.08)] px-3.5 py-3 text-[13.5px] outline-none"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4 text-[12.5px] text-white/50 md:flex-row md:justify-between">
          <p>© 2026 Meolaa. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
          </div>
        </div>
        <img src={logoWhite} alt="Meolaa" className="mt-16 h-[100px] w-full max-w-[900px] object-contain object-left" />
      </footer>
    </div>
  );
}
