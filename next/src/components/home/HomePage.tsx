"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const FIGMA_W = 1440;
const FIGMA_H = 7693;

const img = {
  heroPrism: "/images/hero-prism.png",
  heroLogo: "/figma/logo-white.png",
  pillarsBg: "/figma/imgImage234.png",
  pillarIcon: "/figma/imgRectangle34624962.png",
  lab1: "/figma/imgImage22523.png",
  lab2: "/figma/imgImage22524.png",
  lab3: "/figma/imgImage22525.png",
  lab4: "/figma/imgImage22526.png",
  labArrow: "/figma/imgImage22527.png",
  brand1: "/figma/imgImage.png",
  brand2: "/figma/imgImage2.png",
  brand3: "/figma/imgImage6.png",
  line: "/figma/imgLine5.svg",
};

const pillars = [
  {
    label: "Signal",
    title: "We read the market before it moves.",
    body: "Consumer behaviour, demand and whitespace, sorted into a single opportunity score.",
  },
  {
    label: "Build",
    title: "AI does the heavy lifting.",
    body: "Product, brand and go-to-market assembled by a small team, not a large one.",
  },
  {
    label: "Run",
    title: "The system keeps it running.",
    body: "Distribution, content and operations kept alive by the same engine that built it.",
  },
];

const labSteps = [
  { id: "01", title: "Reading demand", img: img.lab1 },
  { id: "02", title: "Product & brand", img: img.lab2 },
  { id: "03", title: "Go-to-market", img: img.lab3 },
  { id: "04", title: "Distribution & ops", img: img.lab4 },
];

const brands = [
  {
    n: "1",
    name: "HIRA",
    desc: "Bodycare — Meolaa's first brand, live and shipping.",
    cta: "View brand ↗",
    soon: false,
    image: img.brand1,
  },
  {
    n: "2",
    name: "Brand 02",
    desc: "Beauty — Validated opportunity, in build.",
    cta: "Coming soon",
    soon: true,
    image: img.brand2,
  },
  {
    n: "3",
    name: "Brand 03",
    desc: "TBD — Next signal in the pipeline.",
    cta: "Coming soon",
    soon: true,
    image: img.brand3,
  },
];

function useFullBleedScale() {
  const [scale, setScale] = useState(1);
  const [vh, setVh] = useState(952);
  useLayoutEffect(() => {
    const update = () => {
      setScale(window.innerWidth / FIGMA_W);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return { scale, vh };
}

export function HomePage() {
  const lenis = useLenis();
  const { scale, vh } = useFullBleedScale();
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const arrowImgRef = useRef<HTMLImageElement>(null);
  const [labActive, setLabActive] = useState(0);
  const heroH = Math.max(952, vh / scale);
  const contentH = FIGMA_H - 952 + heroH;

  useEffect(() => {
    if (!lenis) return;

    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Arrow motif: fold 1 (hero) → fold 4 (Meolaa Lab)
      const heroSection = root.querySelector<HTMLElement>('[data-section="hero"]');
      const visionSection = root.querySelector<HTMLElement>("[data-section='vision']");
      const pillarsSectionEl = root.querySelector<HTMLElement>("[data-section='pillars']");
      const labSection = root.querySelector<HTMLElement>('[data-section="lab"]');
      if (arrowRef.current && arrowImgRef.current && heroSection && visionSection && pillarsSectionEl && labSection) {
        const arrowStartY = heroSection.offsetTop + heroSection.offsetHeight * 0.42;
        const fold2Y = visionSection.offsetTop + visionSection.offsetHeight * 0.42;
        const fold3Y = pillarsSectionEl.offsetTop + pillarsSectionEl.offsetHeight * 0.38;
        const fold4Y = labSection.offsetTop + labSection.offsetHeight * 0.55;

        gsap.set(arrowRef.current, {
          left: FIGMA_W / 2,
          top: arrowStartY,
          xPercent: -50,
          yPercent: -50,
        });

        const whiteFilter =
          "brightness(0) invert(1) drop-shadow(0px 0px 24px rgba(245,237,232,0.35))";
        const darkFilter =
          "brightness(0) drop-shadow(0px 0px 18px rgba(0,0,0,0.5))";

        // Start: white arrow (dark folds)
        gsap.set(arrowImgRef.current, { filter: whiteFilter });

        const arrowTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            endTrigger: labSection,
            end: "bottom bottom",
            scrub: 1,
          },
        });

        arrowTl
          .to(arrowRef.current, {
            top: fold2Y,
            left: FIGMA_W * 0.54,
            scale: 0.92,
            ease: "none",
            duration: 0.33,
          })
          .to(arrowRef.current, {
            top: fold3Y,
            left: FIGMA_W * 0.48,
            scale: 0.88,
            ease: "none",
            duration: 0.33,
          })
          .to(arrowRef.current, {
            top: fold4Y,
            left: FIGMA_W * 0.52,
            scale: 0.82,
            ease: "none",
            duration: 0.34,
          });

        // Arrow color: light on dark folds, dark on light folds
        // Travel is split into 3 segments; switch colors near fold boundaries.
        const colorTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            endTrigger: labSection,
            end: "bottom bottom",
            scrub: 1,
          },
        });

        colorTl
          .to(arrowImgRef.current, { filter: darkFilter, duration: 0.01, ease: "none" }, 0.33)
          .to(arrowImgRef.current, { filter: whiteFilter, duration: 0.01, ease: "none" }, 0.66)
          .to(arrowImgRef.current, { filter: darkFilter, duration: 0.01, ease: "none" }, 0.99);
      }

      // Hero parallax on prism image
      gsap.to("[data-hero-bg]", {
        yPercent: 10,
        scale: 1.04,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-section='hero']",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Vision fold: copy highlight then video expands full-bleed from below
      const vision = root.querySelector<HTMLElement>("[data-section='vision']");
      const videoBox = root.querySelector<HTMLElement>("[data-video-box]");
      const lines = gsap.utils.toArray<HTMLElement>("[data-vision-line]");

      if (vision && videoBox && lines.length) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: vision,
            start: "top top",
            end: "+=250%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        lines.forEach((line, i) => {
          tl.fromTo(
            line,
            { opacity: i === 0 ? 1 : 0.12, filter: i === 0 ? "blur(0px)" : "blur(6px)" },
            { opacity: 1, filter: "blur(0px)", duration: 0.35 },
            i * 0.25,
          );
        });

        tl.fromTo(
          videoBox,
          {
            width: 505,
            height: 311,
            y: 80,
            borderRadius: 2,
          },
          {
            width: () => window.innerWidth / scale,
            height: () => window.innerHeight / scale,
            y: 0,
            borderRadius: 0,
            duration: 1,
            ease: "power2.inOut",
          },
          "+=0.15",
        );
      }

      // How we build — horizontal card scroll
      const track = root.querySelector<HTMLElement>("[data-pillars-track]");
      const pillarsSection = root.querySelector<HTMLElement>("[data-section='pillars']");
      if (track && pillarsSection) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - FIGMA_W),
          ease: "none",
          scrollTrigger: {
            trigger: pillarsSection,
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
          { y: 100 + i * 40, opacity: 0.35, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              trigger: "[data-section='brands']",
              start: `top+=${i * 100} 75%`,
              end: `top+=${i * 100 + 160} 55%`,
              scrub: true,
            },
          },
        );
      });

      // Stair metrics
      gsap.utils.toArray<HTMLElement>("[data-metric]").forEach((block, i) => {
        gsap.fromTo(
          block,
          { y: 70, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            scrollTrigger: {
              trigger: "[data-section='metrics']",
              start: `top+=${i * 50} 80%`,
              end: `top+=${i * 50 + 90} 60%`,
              scrub: true,
            },
          },
        );
      });
    }, root);

    // Refresh after scale changes
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [lenis, scale, vh, heroH]);

  return (
    <div
      className="relative w-full overflow-x-hidden bg-black"
      style={{ height: contentH * scale }}
    >
      {/* Full-bleed scaled artboard — edge to edge, no side gutters */}
      <div
        ref={rootRef}
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: FIGMA_W,
          height: contentH,
          transform: `scale(${scale})`,
        }}
      >
        {/* Persistent arrow — travels fold 1 → 4 (hero through Meolaa Lab) */}
        <div
          ref={arrowRef}
          className="pointer-events-none absolute z-[60] h-[96px] w-[64px] will-change-transform"
          aria-hidden
        >
          <img
            ref={arrowImgRef}
            src={img.labArrow}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>

        {/* NAV — interactive overlay on hero image */}
        <header className="absolute left-0 top-0 z-50 flex h-[92px] w-full items-center justify-between px-16">
          <a href="/" className="h-[25px] w-[125px]" aria-label="Meolaa home">
            <img src={img.heroLogo} alt="" className="h-full w-full object-contain object-left opacity-0" />
            <span className="sr-only">Meolaa</span>
          </a>
          <nav className="flex items-center gap-4 text-[14.5px] font-medium text-transparent">
            {["Platform", "Brands", "Careers", "Who We Are", "Investors"].map((l) => (
              <span key={l} className="cursor-pointer select-none">
                {l}
              </span>
            ))}
          </nav>
        </header>

        {/* ========== FOLD 1 — HERO (user prism image) ========== */}
        <section
          data-section="hero"
          data-fold="1"
          className="relative w-full overflow-hidden bg-black"
          style={{ height: heroH }}
        >
          <div data-hero-bg className="absolute inset-0">
            <img
              src={img.heroPrism}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
          <a
            href="/our-story"
            className="absolute bottom-[7%] right-[22%] z-10 h-[48px] w-[158px]"
            aria-label="Read Our Story"
          />
          <button
            type="button"
            className="absolute bottom-[7%] right-[8%] z-10 h-[48px] w-[170px] cursor-pointer bg-transparent"
            aria-label="Watch the film"
          />
        </section>

        {/* ========== FOLD 2 — VISION + VIDEO ========== */}
        <section
          data-section="vision"
          data-fold="2"
          className="relative flex h-[952px] w-full flex-col items-center justify-center overflow-hidden bg-white"
        >
          <div className="relative z-10 flex w-[1012px] flex-col items-center gap-[13px] text-center">
            <p
              data-vision-line
              className="font-[family-name:var(--font-fraunces)] text-[56px] font-light leading-[1.3] text-black"
            >
              Every category has an unmet need.
            </p>
            <p
              data-vision-line
              className="font-[family-name:var(--font-fraunces)] text-[56px] font-light leading-[1.3] text-black"
            >
              We find it, build for it, and run it faster
            </p>
            <p
              data-vision-line
              className="font-[family-name:var(--font-fraunces)] text-[56px] font-light leading-[1.3] text-black"
            >
              than anyone else can.
            </p>
          </div>

          <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-0">
            <div
              data-video-box
              className="relative overflow-hidden bg-[#111] will-change-[width,height,transform]"
              style={{ width: 505, height: 311 }}
            >
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0a3038] to-black text-sm text-white/70">
                Video
              </div>
            </div>
          </div>
        </section>

        {/* ========== FOLD 3 — HOW WE BUILD BRANDS ========== */}
        <section
          data-section="pillars"
          data-fold="3"
          className="relative h-[949px] w-full overflow-hidden bg-black"
        >
          <div className="pointer-events-none absolute -bottom-[320px] left-1/2 h-[1098px] w-[2129px] -translate-x-1/2 opacity-20 mix-blend-luminosity">
            <img src={img.pillarsBg} alt="" className="h-full w-full object-cover" />
          </div>
          <h2 className="absolute left-1/2 top-[82px] -translate-x-1/2 whitespace-nowrap font-[family-name:var(--font-fraunces)] text-[96px] font-light text-white/90 blur-[9px]">
            HOW WE BUILD BRANDS
          </h2>
          <div data-pillars-track className="absolute left-0 top-0 flex h-full w-max gap-8 px-[77px] pt-[262px]">
            {pillars.map((p, i) => (
              <article
                key={p.label}
                className="relative h-[509px] w-[418px] shrink-0 bg-white/5 px-[31px] py-[46px]"
                style={{ marginTop: i * 150 }}
              >
                <div className="relative h-[159px] w-[159px]">
                  <img src={img.pillarIcon} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-10 font-[family-name:var(--font-ibm-plex-mono)] text-[16px] text-white/40">
                  {p.label}
                </p>
                <h3 className="mt-4 font-[family-name:var(--font-fraunces)] text-[42px] font-light leading-[1.08] text-white">
                  {p.title}
                </h3>
                <p className="mt-4 text-[12.7px] leading-[1.55] text-[rgba(245,237,232,0.75)]">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ========== FOLD 4 — MEOLAA LAB ========== */}
        <section data-section="lab" data-fold="4" className="relative h-[756px] w-full overflow-hidden bg-[#f5f1ea]">
          <p className="absolute left-[75px] top-[64px] font-[family-name:var(--font-ibm-plex-mono)] text-[12px] tracking-[0.96px] text-black/50">
            MEOLAA LAB
          </p>
          <div className="absolute left-[75px] top-[131px] h-[435px] w-[286px] opacity-10">
            <img src={img.labArrow} alt="" className="h-full w-full object-contain" />
          </div>
          <p className="absolute bottom-[48px] left-[75px] w-[322px] font-[family-name:var(--font-fraunces)] text-[42px] font-light leading-[1.08]">
            One system. Four capabilities.
          </p>
          {labSteps.map((step, i) => {
            const lefts = [451, 798, 986, 1175];
            const widths = [347, 189, 189, 265];
            const open = labActive === i;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setLabActive(i)}
                className="absolute top-0 h-full border-l border-black/10 text-left"
                style={{ left: lefts[i], width: widths[i] }}
              >
                <p className="absolute left-4 top-[60px] text-[14px] text-[#211a37]">{step.id}</p>
                <h3 className="absolute left-4 top-[111px] max-w-[90%] font-[family-name:var(--font-fraunces)] text-[42px] font-light leading-[1.08]">
                  {step.title}
                </h3>
                <div
                  className="absolute bottom-[74px] left-4 overflow-hidden transition-all duration-500"
                  style={{
                    width: "calc(100% - 32px)",
                    maxHeight: open ? 120 : 0,
                    opacity: open ? 1 : 0,
                  }}
                >
                  <p className="text-[16px] leading-[1.55] text-black/75">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua.
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 top-[180px] overflow-hidden">
                  <img src={step.img} alt="" className="h-full w-full object-cover object-top opacity-80" />
                </div>
              </button>
            );
          })}
        </section>

        {/* ========== PORTFOLIO TITLE ========== */}
        <section className="relative flex h-[949px] w-full items-center justify-center bg-white">
          <h2 className="font-[family-name:var(--font-fraunces)] text-[96px] font-light text-black blur-[9px]">
            THE PORTFOLIO
          </h2>
        </section>

        {/* ========== BRANDS ========== */}
        <section data-section="brands" className="w-full bg-white px-16 py-20">
          <p className="text-[11px] font-semibold tracking-[2.86px] text-[#6b6b6b]">BRANDS</p>
          <div className="mt-3">
            {brands.map((b, i) => (
              <div key={b.name}>
                <article data-brand-row className="flex items-start justify-between gap-8 py-6">
                  <div className="flex flex-1 items-start gap-8">
                    <p className="font-[family-name:var(--font-fraunces)] text-[120px] font-black leading-[0.8] tracking-[-7.2px]">
                      {b.n}
                    </p>
                    <p className="pt-6 font-[family-name:var(--font-fraunces)] text-[18px]">{b.name}</p>
                    <div className="max-w-[710px] pt-6">
                      {b.soon && (
                        <p className="mb-2 text-[10px] font-medium tracking-[1.8px] text-[#6b6b6b]">
                          COMING SOON
                        </p>
                      )}
                      <p className="text-[14px] leading-[1.5]">{b.desc}</p>
                      <p className={`mt-2.5 text-[13px] font-medium ${b.soon ? "text-[#6b6b6b]" : ""}`}>
                        {b.cta}
                      </p>
                    </div>
                  </div>
                  <div className="relative h-[220px] w-[360px] shrink-0 overflow-hidden bg-[#e6e6e6]">
                    <img src={b.image} alt="" className="h-full w-full object-cover" />
                  </div>
                </article>
                {i < brands.length - 1 && <div className="h-px bg-[#dbdbdb]" />}
              </div>
            ))}
          </div>
        </section>

        {/* ========== STAIR METRICS ========== */}
        <section data-section="metrics" className="relative h-[451px] w-full overflow-hidden bg-white">
          {[
            { v: "$6M", l: "Raised across seed rounds", left: 0, top: 275, h: 176 },
            { v: "120+", l: "Categories mapped", left: 360, top: 191, h: 260 },
            { v: "1", l: "Brand live", left: 720, top: 92, h: 359 },
            { v: "3", l: "Market Served", left: 1080, top: 0, h: 451 },
          ].map((m) => (
            <div
              key={m.l}
              data-metric
              className="absolute flex w-[360px] flex-col items-center justify-center bg-black text-center text-white"
              style={{ left: m.left, top: m.top, height: m.h }}
            >
              <p className="font-[family-name:var(--font-fraunces)] text-[96px] font-light leading-[1.3]">
                {m.v}
              </p>
              <p className="mt-2 text-[13px] text-[rgba(245,237,232,0.6)]">{m.l}</p>
            </div>
          ))}
        </section>

        {/* ========== INVESTORS ========== */}
        <section className="flex h-[425px] w-full flex-col items-center justify-center gap-9 bg-black px-16 text-center text-white">
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[12px] tracking-[0.96px] text-white/50">
            BACKED BY
          </p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-[28px] font-light">
            Investors who back systems, not just brands.
          </h2>
          <div className="flex gap-14 font-[family-name:var(--font-fraunces)] text-[19px] font-semibold text-[rgba(245,237,232,0.4)]">
            <span>Colossa Ventures</span>
            <span>General Catalyst</span>
            <span>Turbostart</span>
          </div>
          <a
            href="/partners"
            className="rounded-[2px] border border-[rgba(245,237,232,0.4)] px-6 py-[13px] text-[14px] font-medium"
          >
            Partner with us →
          </a>
        </section>

        {/* ========== NEWSLETTER ========== */}
        <section className="flex h-[327px] w-full flex-col items-center justify-center gap-6 bg-white px-16 text-center">
          <h2 className="font-[family-name:var(--font-fraunces)] text-[30px] font-light">
            Get the signal before it&apos;s a headline.
          </h2>
          <div className="flex">
            <input
              type="email"
              placeholder="you@company.com"
              className="h-12 w-[320px] border border-[rgba(10,48,56,0.3)] px-[18px] text-[13.5px] outline-none"
            />
            <button type="button" className="h-12 w-[120px] bg-black text-[13.5px] font-medium text-white">
              Subscribe
            </button>
          </div>
          <p className="text-[11.5px] text-black/40">
            By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </section>

        {/* ========== WHERE TO NEXT ========== */}
        <section className="w-full bg-black px-16 py-[90px] text-white">
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.88px] text-[rgba(245,237,232,0.4)]">
            WHERE TO NEXT
          </p>
          <div className="mt-8 grid grid-cols-3 gap-5">
            {[
              ["02", "About Us", "The thesis behind an AI-native brand company. →"],
              ["04", "Meolaa Lab", "How the OS finds and builds every brand. →"],
              ["07", "Careers", "Build with a small team, real ownership. →"],
            ].map(([n, t, h]) => (
              <div
                key={t}
                className="border border-[rgba(245,237,232,0.15)] bg-[rgba(245,237,232,0.05)] p-6"
              >
                <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] text-[rgba(192,138,46,0.8)]">
                  {n}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-fraunces)] text-[19px] font-semibold">
                  {t}
                </h3>
                <p className="mt-3 text-[12.5px] text-[rgba(245,237,232,0.55)]">{h}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <footer className="w-full bg-black px-16 pb-10 pt-[72px] text-white">
          <div className="flex gap-20">
            <p className="w-[220px] text-[13.5px] text-[rgba(245,237,232,0.6)]">
              Reading the market.
              <br />
              Building what it needs.
            </p>
            <div className="space-y-3.5 text-[15px]">
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11.5px] tracking-[0.92px] text-white/50">
                COMPANY
              </p>
              <p>CMI Platform</p>
              <p>Brand Co-pilot</p>
              <p>Our Brands</p>
              <p>Who We Are</p>
              <p>Careers</p>
            </div>
            <div className="space-y-3.5 text-[15px]">
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11.5px] tracking-[0.92px] text-white/50">
                CONNECT
              </p>
              <p>Contact</p>
              <p>Newsroom</p>
              <p>Investors & Partners</p>
            </div>
            <div className="space-y-3.5 text-[15px]">
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11.5px] tracking-[0.92px] text-white/50">
                BRANDS
              </p>
              <p>HIRA ↗</p>
            </div>
          </div>
          <div className="mt-14 h-px w-full bg-[rgba(245,237,232,0.15)]" />
          <div className="mt-8 flex justify-between text-[12.5px] text-white/50">
            <p>© 2026 Meolaa. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
            </div>
          </div>
          <div className="mt-16">
            <img src="/figma/logo-white.png" alt="Meolaa" className="h-[120px] w-auto object-contain object-left" />
          </div>
        </footer>
      </div>
    </div>
  );
}
