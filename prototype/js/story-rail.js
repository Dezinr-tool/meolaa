/**
 * Our Story — left vertical timeline / timer rail.
 * Sticky compact rail (no pin, not viewport-tall); ScrollTrigger scrubs
 * line progress across chapter bounds + scrollspy highlights the chapter
 * in view. Lenis-compatible click-to-scroll.
 * Our Story only — does not touch About Us .au-roadmap.
 *
 * Anchors (rail + [data-story-chapter] inside [data-story-body]):
 * Insight → Build → First Brand. Founder quote lives outside story-body
 * and is not part of progress / scroll-spy / dimming.
 *
 * Progress fills between first chapter top → last chapter bottom so the
 * line tracks content tightly (avoids a lonely last node in empty space).
 */
(function initStoryRail() {
  const body = document.querySelector("[data-story-body]");
  const rail = document.querySelector("[data-story-rail]");
  if (!body || !rail) return;

  /* Only chapters inside story-body — excludes post-timeline quote */
  const chapters = Array.from(body.querySelectorAll("[data-story-chapter]"));
  const items = Array.from(rail.querySelectorAll("[data-story-rail-item]"));
  const progressEl = rail.querySelector("[data-story-rail-progress]");
  const mobileBar = document.querySelector("[data-story-rail-mobile]");
  const mobileFill = mobileBar
    ? mobileBar.querySelector("[data-story-rail-mobile-fill]")
    : null;
  const mobileLabel = mobileBar
    ? mobileBar.querySelector("[data-story-rail-mobile-label]")
    : null;

  if (!chapters.length || !items.length) return;
  if (chapters.length !== items.length) {
    console.warn(
      "[story-rail] chapter count (%s) !== rail items (%s)",
      chapters.length,
      items.length
    );
  }

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let lastIndex = -1;
  let progressTrigger = null;
  const spyTriggers = [];
  let lenis = null;
  let lenisOwned = false;
  let lenisRaf = null;
  let resizeTimer = null;

  function setProgress(p) {
    const clamped = Math.max(0, Math.min(1, p));
    const pct = `${(clamped * 100).toFixed(2)}%`;
    if (progressEl) progressEl.style.height = pct;
    if (mobileFill) mobileFill.style.width = pct;
    rail.style.setProperty("--story-rail-progress", String(clamped));
  }

  function labelFor(index) {
    const item = items[index];
    if (!item) return "";
    const year = item.querySelector(".story-rail__year");
    const name = item.querySelector(".story-rail__name");
    const y = year ? year.textContent.trim() : "";
    const n = name ? name.textContent.trim() : "";
    return [y, n].filter(Boolean).join(" · ");
  }

  function setActive(index) {
    const i = Math.max(0, Math.min(chapters.length - 1, index));
    if (i === lastIndex) return;
    lastIndex = i;

    items.forEach((el, n) => {
      const on = n === i;
      el.classList.toggle("is-active", on);
      el.classList.toggle("is-past", n < i);
      el.setAttribute("aria-current", on ? "step" : "false");
    });

    chapters.forEach((el, n) => {
      el.classList.toggle("is-story-active", n === i);
    });

    if (mobileLabel) mobileLabel.textContent = labelFor(i);
  }

  function destroyLenis() {
    if (lenisRaf && typeof gsap !== "undefined") {
      gsap.ticker.remove(lenisRaf);
      lenisRaf = null;
    }
    if (lenis && lenisOwned) {
      lenis.destroy();
      if (window.lenis === lenis) window.lenis = undefined;
    }
    lenis = null;
    lenisOwned = false;
  }

  function ensureLenis() {
    if (typeof Lenis === "undefined" || prefersReducedMotion()) return;
    if (window.lenis) {
      lenis = window.lenis;
      lenisOwned = false;
      return;
    }
    if (lenis || typeof gsap === "undefined") return;
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenisOwned = true;
    window.lenis = lenis;
    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
    }
    lenisRaf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToChapter(index) {
    const target = chapters[index];
    if (!target) return;
    const offset = 88;

    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(target, {
        offset: -offset,
        duration: prefersReducedMotion() ? 0 : 1.15,
      });
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function killTriggers() {
    if (progressTrigger) {
      progressTrigger.kill();
      progressTrigger = null;
    }
    while (spyTriggers.length) {
      const st = spyTriggers.pop();
      st.kill();
    }
  }

  function bindClicks() {
    items.forEach((btn, i) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToChapter(i);
      });
    });
  }

  /** Progress 0→1 from first chapter enter through last chapter exit. */
  function chapterProgress() {
    const first = chapters[0];
    const last = chapters[chapters.length - 1];
    if (!first || !last) return 0;
    const start = first.offsetTop - window.innerHeight * 0.45;
    const end = last.offsetTop + last.offsetHeight - window.innerHeight * 0.45;
    if (end <= start) return 1;
    return (window.scrollY - start) / (end - start);
  }

  function setupStaticFallback() {
    body.classList.add("is-story-rail-ready", "is-story-rail-static");
    setActive(0);
    setProgress(0);

    const onScroll = () => {
      const mid = window.scrollY + window.innerHeight * 0.42;
      let best = 0;
      chapters.forEach((ch, i) => {
        if (ch.offsetTop <= mid) best = i;
      });
      setActive(best);
      setProgress(chapterProgress());
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setupScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);
    ensureLenis();
    killTriggers();

    const first = chapters[0];
    const last = chapters[chapters.length - 1];

    /* Scrub across chapter content only — not the full story-body height */
    progressTrigger = ScrollTrigger.create({
      trigger: first,
      endTrigger: last,
      start: "top 45%",
      end: "bottom 45%",
      scrub: 0.35,
      onUpdate: (self) => setProgress(self.progress),
      onEnter: () => {
        body.classList.add("is-story-rail-engaged");
        rail.classList.add("is-visible");
        if (mobileBar) mobileBar.classList.add("is-visible");
      },
      onEnterBack: () => {
        body.classList.add("is-story-rail-engaged");
        rail.classList.add("is-visible");
        if (mobileBar) mobileBar.classList.add("is-visible");
      },
      onLeave: () => {
        setProgress(1);
        setActive(chapters.length - 1);
      },
      onLeaveBack: () => {
        body.classList.remove("is-story-rail-engaged");
        rail.classList.remove("is-visible");
        if (mobileBar) mobileBar.classList.remove("is-visible");
        setProgress(0);
      },
    });

    chapters.forEach((chapter, i) => {
      const isLast = i === chapters.length - 1;
      const st = ScrollTrigger.create({
        trigger: chapter,
        start: "top 52%",
        /* Last chapter stays active through its bottom — no orphan gap after */
        end: isLast ? "bottom bottom" : "bottom 48%",
        onToggle: (self) => {
          if (self.isActive) setActive(i);
        },
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      });
      spyTriggers.push(st);
    });

    body.classList.add("is-story-rail-ready");
    setActive(0);
    setProgress(0);
    ScrollTrigger.refresh();
  }

  function init() {
    bindClicks();

    if (
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined" ||
      prefersReducedMotion()
    ) {
      setupStaticFallback();
      return;
    }

    setupScrollTrigger();

    window.addEventListener("load", () => {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    });

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      }, 150);
    });
  }

  init();
})();

/**
 * Our Story hero — light load + scroll motion (asymmetric panel).
 * Independent of the timeline rail; no-ops when GSAP is missing.
 */
(function initStoryHero() {
  const hero = document.querySelector(".story-hero[data-pg-hero]");
  if (!hero) return;

  const fades = Array.from(hero.querySelectorAll("[data-story-hero-fade]"));
  const panel = hero.querySelector("[data-story-hero-panel]");
  const panelImg = panel ? panel.querySelector("img") : null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof gsap === "undefined" || reduceMotion) return;

  gsap.set(fades, { opacity: 0, y: 28 });
  if (panel) gsap.set(panel, { opacity: 0, y: 36 });
  if (panelImg) gsap.set(panelImg, { yPercent: -4, scale: 1.04 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(fades, {
    opacity: 1,
    y: 0,
    duration: 0.85,
    stagger: 0.12,
  });
  if (panel) {
    tl.to(
      panel,
      { opacity: 1, y: 0, duration: 1 },
      "-=0.55"
    );
  }
  if (panelImg) {
    tl.to(
      panelImg,
      { yPercent: 0, scale: 1, duration: 1.15, ease: "power2.out" },
      "-=0.95"
    );
  }

  if (typeof ScrollTrigger !== "undefined" && panelImg) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(panelImg, {
      yPercent: 10,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
})();
