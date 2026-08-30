/**
 * Meolaa Lab (platform.html) — page interactions.
 * Motions: Typographic Chamber hero (brand reveal, scan, parallax),
 * OS triangle progress + stage focus, capability sticky scroll/tabs,
 * case stage spy.
 * Lenis + GSAP ScrollTrigger. Safe no-op if deps missing.
 */
(function initLabPlatform() {
  if (/#figmacapture=/.test(location.hash)) return;
  if (!document.body.classList.contains("page-lab")) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  let lenis = null;
  let lenisRaf = null;

  function ensureLenis() {
    if (typeof Lenis === "undefined" || reduceMotion || lenis) return;
    if (!hasGsap) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    lenisRaf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
  }

  /* ——— Hero: monumental brand reveal + field atmosphere ——— */
  function initHero() {
    const hero = document.querySelector("[data-lab-hero]");
    if (!hero) return;

    const fades = hero.querySelectorAll("[data-lab-hero-fade]");
    const clips = hero.querySelectorAll("[data-lab-hero-clip]");
    const rule = hero.querySelector("[data-lab-hero-rule]");
    const plate = hero.querySelector("[data-lab-hero-plate]");
    const scan = hero.querySelector("[data-lab-hero-scan]");
    const frame = hero.querySelector(".lab-hero__frame");
    const cue = hero.querySelector(".lab-hero__cue");
    const brandInners = hero.querySelectorAll(".lab-hero__brand-inner");
    const copyFades = hero.querySelectorAll(".lab-hero__copy [data-lab-hero-fade], .lab-hero__cue");

    if (!hasGsap || reduceMotion) {
      fades.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      if (rule) rule.style.transform = "scaleX(1)";
      if (scan) scan.style.opacity = "0";
      return;
    }

    gsap.set(fades, { opacity: 0, y: 36 });
    gsap.set(clips, { yPercent: 108 });
    if (rule) gsap.set(rule, { scaleX: 0 });
    if (plate) gsap.set(plate, { scale: 1.14, yPercent: -2 });
    if (scan) gsap.set(scan, { opacity: 0, xPercent: -55 });

    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

    /* 1 — Field settles */
    if (plate) {
      intro.to(plate, { scale: 1, yPercent: 0, duration: 2.1, ease: "power2.out" }, 0);
    }

    /* 2 — Soft scan sweep across the chamber */
    if (scan) {
      intro.to(scan, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.2);
      intro.to(scan, { xPercent: 120, duration: 1.55, ease: "power2.inOut" }, 0.25);
      intro.to(scan, { opacity: 0, duration: 0.5, ease: "power1.in" }, 1.35);
    }

    /* 3 — Brand rises through clip masks */
    intro.to(clips, { yPercent: 0, duration: 1.05, stagger: 0.12, ease: "power4.out" }, 0.35);
    if (brandInners.length) {
      intro.to(brandInners, { opacity: 1, y: 0, duration: 1.05, stagger: 0.12, ease: "power3.out" }, 0.35);
    }

    /* Threshold draws, then editorial copy + cue */
    if (rule) {
      intro.to(rule, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 0.95);
    }
    if (copyFades.length) {
      intro.to(copyFades, { opacity: 1, y: 0, duration: 0.85, stagger: 0.1, ease: "power3.out" }, 1.1);
    }

    /* Exit: plate drifts + type softens into intro */
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        if (plate) {
          gsap.set(plate, {
            yPercent: p * 14,
            scale: 1 + p * 0.06,
          });
        }
        if (frame) {
          gsap.set(frame, {
            y: p * -48,
            opacity: 1 - p * 0.55,
          });
        }
        if (cue) {
          gsap.set(cue, {
            opacity: Math.max(0, 1 - p * 1.8),
          });
        }
      },
    });
  }

  /* ——— Intro stats rise ——— */
  function initIntroStats() {
    const stats = document.querySelectorAll("[data-lab-stat]");
    if (!stats.length || !hasGsap || reduceMotion) {
      stats.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }
    gsap.set(stats, { opacity: 0, y: 36 });
    gsap.to(stats, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".lab-intro__stats",
        start: "top 80%",
      },
    });
  }

  /* ——— Three-stage OS triangle + stage focus ——— */
  function initOs() {
    const root = document.querySelector("[data-lab-os]");
    if (!root) return;
    const stages = Array.from(root.querySelectorAll("[data-lab-os-stage]"));
    const progress = root.querySelector("[data-lab-os-progress]");
    const vertices = Array.from(root.querySelectorAll("[data-lab-os-vertex]"));
    /* Equilateral perimeter: 3 × R√3 with R=220 ≈ 1143.15 */
    const pathLen =
      progress && typeof progress.getTotalLength === "function"
        ? progress.getTotalLength()
        : 3 * 220 * Math.sqrt(3);

    if (progress) {
      progress.style.strokeDasharray = String(pathLen);
      progress.style.strokeDashoffset = String(pathLen);
    }

    function setStage(index) {
      stages.forEach((el, i) => {
        el.classList.toggle("is-active", i === index);
      });
      vertices.forEach((el) => {
        const v = Number(el.getAttribute("data-lab-os-vertex"));
        el.classList.toggle("is-active", v === index);
      });
      if (progress && pathLen) {
        const filled = ((index + 1) / stages.length) * pathLen;
        progress.style.strokeDashoffset = String(pathLen - filled);
      }
    }

    setStage(0);

    if (!hasGsap || reduceMotion) return;

    stages.forEach((stage, i) => {
      ScrollTrigger.create({
        trigger: stage,
        start: "top 65%",
        end: "bottom 40%",
        onEnter: () => setStage(i),
        onEnterBack: () => setStage(i),
      });
    });
  }

  /* ——— Capability modules: tabs + scroll waypoints ——— */
  function initCaps() {
    const root = document.querySelector("[data-lab-caps]");
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll("[data-lab-cap-tab]"));
    const panels = Array.from(root.querySelectorAll("[data-lab-cap-panel]"));
    const imgs = Array.from(root.querySelectorAll("[data-lab-cap-img]"));
    const ways = Array.from(root.querySelectorAll("[data-lab-cap-way]"));
    const counter = root.querySelector("[data-lab-cap-counter]");
    let active = 0;
    let lock = false;

    function setActive(index, fromTab) {
      const i = Math.max(0, Math.min(panels.length - 1, index));
      if (i === active && !fromTab) return;
      active = i;

      tabs.forEach((tab, n) => {
        const on = n === i;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });

      panels.forEach((panel, n) => {
        const on = n === i;
        panel.classList.toggle("is-active", on);
        if (on) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      });

      imgs.forEach((img, n) => {
        img.classList.toggle("is-active", n === i);
      });

      if (counter) {
        counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(panels.length).padStart(2, "0")}`;
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const i = Number(tab.getAttribute("data-lab-cap-tab"));
        setActive(i, true);
        if (hasGsap && ways[i] && !reduceMotion) {
          lock = true;
          const top = ways[i].getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25;
          if (lenis) {
            lenis.scrollTo(top, {
              duration: 0.9,
              onComplete: () => {
                lock = false;
              },
            });
          } else {
            window.scrollTo({ top, behavior: "smooth" });
            setTimeout(() => {
              lock = false;
            }, 900);
          }
        }
      });
    });

    setActive(0, true);

    if (!hasGsap || reduceMotion || !ways.length) return;

    ways.forEach((way, i) => {
      ScrollTrigger.create({
        trigger: way,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          if (!lock) setActive(i);
        },
        onEnterBack: () => {
          if (!lock) setActive(i);
        },
      });
    });
  }

  /* ——— HIRA case stage spy ——— */
  function initCase() {
    const stages = Array.from(document.querySelectorAll("[data-lab-case-stage]"));
    if (!stages.length) return;

    function setActive(index) {
      stages.forEach((el, i) => el.classList.toggle("is-active", i === index));
    }

    setActive(0);
    if (!hasGsap || reduceMotion) return;

    stages.forEach((stage, i) => {
      ScrollTrigger.create({
        trigger: stage,
        start: "top 70%",
        end: "bottom 45%",
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      });
    });

    const media = document.querySelector("[data-lab-case-media] img");
    if (media) {
      gsap.fromTo(
        media,
        { scale: 1.08, yPercent: -4 },
        {
          scale: 1,
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-lab-case]",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }
  }

  function boot() {
    if (hasGsap) {
      gsap.registerPlugin(ScrollTrigger);
      ensureLenis();
    }
    initHero();
    initIntroStats();
    initOs();
    initCaps();
    initCase();
    if (hasGsap) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
      window.addEventListener("load", () => ScrollTrigger.refresh());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
