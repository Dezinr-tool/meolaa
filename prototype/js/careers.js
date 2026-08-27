/* 7.2 How we work — scroll reveal for function rows */

(function initHowWeWork() {
  const section = document.querySelector(".how-work");
  if (!section) return;

  const rows = [...section.querySelectorAll("[data-how-fn]")];
  if (!rows.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    rows.forEach((row) => row.classList.add("is-in"));
    return;
  }

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      });
    },
    { threshold: 0.22, rootMargin: "0px 0px -6% 0px" }
  );

  rows.forEach((row) => reveal.observe(row));
})();

/* 7.3 Open roles — function + location filters, state reflected in URL */

(function initRoleFilters() {
  const list = document.querySelector("[data-role-list]");
  if (!list) return;

  const roles = [...list.querySelectorAll(".ct-role")];
  const empty = document.querySelector("[data-role-empty]");
  const fnChips = [...document.querySelectorAll("[data-fn]")].filter((el) => el.tagName === "BUTTON");
  const locChips = [...document.querySelectorAll("[data-loc]")].filter((el) => el.tagName === "BUTTON");

  const state = { fn: "all", loc: "all" };

  function fromUrl() {
    const p = new URLSearchParams(location.search);
    if (p.get("function")) state.fn = p.get("function");
    if (p.get("location")) state.loc = p.get("location");
  }

  function toUrl() {
    const p = new URLSearchParams();
    if (state.fn !== "all") p.set("function", state.fn);
    if (state.loc !== "all") p.set("location", state.loc);
    const q = p.toString();
    history.replaceState(null, "", q ? `?${q}${location.hash}` : location.pathname + location.hash);
  }

  function apply() {
    let shown = 0;
    roles.forEach((role) => {
      const okFn = state.fn === "all" || role.dataset.fn === state.fn;
      const okLoc = state.loc === "all" || role.dataset.loc === state.loc;
      const visible = okFn && okLoc;
      role.hidden = !visible;
      if (visible) shown += 1;
    });
    if (empty) empty.hidden = shown > 0;

    fnChips.forEach((c) => c.classList.toggle("is-active", c.dataset.fn === state.fn));
    locChips.forEach((c) => c.classList.toggle("is-active", c.dataset.loc === state.loc));
    toUrl();
  }

  fnChips.forEach((c) => c.addEventListener("click", () => { state.fn = c.dataset.fn; apply(); }));
  locChips.forEach((c) => c.addEventListener("click", () => { state.loc = c.dataset.loc; apply(); }));

  fromUrl();
  apply();
})();

/* 7.8 The team — seamless horizontal auto-scroll (pause on interact / reduced motion) */

(function initTeamAutoScroll() {
  const track = document.querySelector(".cr-team-scroll");
  if (!track) return;

  const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const SPEED = 0.035; /* px per ms ≈ 35px/s */
  const RESUME_MS = 1200;

  let originals = [];
  let loopWidth = 0;
  let paused = false;
  let pointerActive = false;
  let inView = true;
  let rafId = 0;
  let lastTs = 0;
  let resumeTimer = 0;
  let running = false;

  function measureLoopWidth() {
    const first = track.querySelector(":scope > .cr-team-scroll__card:not([data-team-clone])");
    const firstClone = track.querySelector(":scope > .cr-team-scroll__card[data-team-clone]");
    if (!first || !firstClone) return 0;
    return firstClone.offsetLeft - first.offsetLeft;
  }

  function shouldPause() {
    return (
      paused ||
      pointerActive ||
      !inView ||
      track.matches(":hover") ||
      track.matches(":focus-within")
    );
  }

  function tick(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(ts - lastTs, 64);
    lastTs = ts;

    if (!shouldPause() && loopWidth > 0) {
      track.scrollLeft += SPEED * dt;
      if (track.scrollLeft >= loopWidth) {
        track.scrollLeft -= loopWidth;
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running || reduceMq.matches) return;
    loopWidth = measureLoopWidth();
    if (loopWidth <= 0) return;
    running = true;
    lastTs = 0;
    track.classList.add("is-auto-scrolling");
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    lastTs = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    track.classList.remove("is-auto-scrolling");
  }

  function scheduleResume() {
    clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      if (!pointerActive && !track.matches(":hover") && !track.matches(":focus-within")) {
        paused = false;
      }
    }, RESUME_MS);
  }

  function removeClones() {
    track.querySelectorAll(":scope > .cr-team-scroll__card[data-team-clone]").forEach((n) => n.remove());
  }

  function setupClones() {
    removeClones();
    originals = [...track.querySelectorAll(":scope > .cr-team-scroll__card")];
    if (!originals.length) return false;

    originals.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.dataset.teamClone = "1";
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button, [tabindex]").forEach((el) => {
        el.setAttribute("tabindex", "-1");
      });
      track.appendChild(clone);
    });
    return true;
  }

  function enable() {
    if (reduceMq.matches) return;
    if (!setupClones()) return;
    loopWidth = measureLoopWidth();
    start();
  }

  function disable() {
    stop();
    removeClones();
    paused = false;
    pointerActive = false;
  }

  track.addEventListener("mouseenter", () => {
    paused = true;
    clearTimeout(resumeTimer);
  });
  track.addEventListener("mouseleave", () => {
    if (!pointerActive && !track.matches(":focus-within")) paused = false;
  });
  track.addEventListener("focusin", () => {
    paused = true;
    clearTimeout(resumeTimer);
  });
  track.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      if (!track.matches(":hover") && !track.matches(":focus-within") && !pointerActive) {
        paused = false;
      }
    });
  });

  track.addEventListener("pointerdown", () => {
    pointerActive = true;
    paused = true;
    clearTimeout(resumeTimer);
  });
  window.addEventListener("pointerup", () => {
    if (!pointerActive) return;
    pointerActive = false;
    scheduleResume();
  });
  window.addEventListener("pointercancel", () => {
    if (!pointerActive) return;
    pointerActive = false;
    scheduleResume();
  });

  track.addEventListener(
    "wheel",
    () => {
      paused = true;
      scheduleResume();
    },
    { passive: true }
  );

  track.addEventListener(
    "scroll",
    () => {
      if (!running || loopWidth <= 0) return;
      /* Wrap forward so drag/wheel into the clone set stays seamless */
      if (track.scrollLeft >= loopWidth) {
        track.scrollLeft -= loopWidth;
      }
    },
    { passive: true }
  );

  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
    },
    { threshold: 0.05 }
  );
  io.observe(track);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!running) return;
      loopWidth = measureLoopWidth();
    }, 150);
  });

  reduceMq.addEventListener("change", () => {
    if (reduceMq.matches) disable();
    else enable();
  });

  enable();
})();

/* 7.6 Life at Meolaa — Image Scroll Flow (072-style recreation)
   Pin the full-height row while scroll travels the tall runway.
   Images enter from the right, grow at mid-path, then shrink off left —
   only right→left travel; a second R→L wave repeats for continuous strip feel. */

(function initLifeFlow() {
  const root = document.querySelector("[data-life-flow]");
  if (!root) return;

  const pinHeight = root.querySelector("[data-life-pin-height]");
  const container = root.querySelector("[data-life-container]");
  const medias = [...root.querySelectorAll(".ct-life__media")];
  if (!pinHeight || !container || !medias.length) return;

  /* Capture / reduced-motion: static grid, no pin */
  if (/#figmacapture=/.test(location.hash)) {
    root.classList.add("is-static");
    return;
  }

  const SCRUB = 0.55;

  let tween = null;
  let lenis = null;
  let lenisRaf = null;
  let lenisOwned = false;
  let mode = null;
  let pathSeed = [];

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function destroyLenis() {
    if (lenisRaf) {
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
    if (lenis) return;
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenisOwned = true;
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    lenisRaf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
  }

  function travelX() {
    return Math.round(window.innerWidth * 0.72);
  }

  /* Modest mid-travel grow — base CSS frames stay small; never fill the viewport */
  function peakScale() {
    return window.matchMedia("(max-width: 640px)").matches ? 1.08 : 1.14;
  }

  function seedPaths() {
    pathSeed = medias.map((_, i) => ({
      yJitter: ((i % 5) - 2) * 28,
    }));
  }

  function killTween() {
    if (tween) {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      tween = null;
    }
    gsap.set(medias, { clearProps: "transform,visibility,opacity" });
    root.classList.remove("is-flowing");
  }

  function showStatic() {
    killTween();
    root.classList.add("is-static");
    destroyLenis();
  }

  function buildFlow() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      root.classList.add("is-static");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    killTween();
    root.classList.remove("is-static");
    root.classList.add("is-flowing");
    ensureLenis();
    seedPaths();

    const xSpan = travelX();
    const scalePeak = peakScale();
    const n = medias.length;
    /* Each image owns ~dur of the timeline; tighter stagger so more overlap R→L */
    const dur = Math.max(0.26, Math.min(0.4, 1.05 / n));
    const stagger = (0.42 - dur * 0.12) / Math.max(1, n - 1);
    /* Second wave starts as the first is winding down — same R→L, no reverse */
    const wave2 = (n - 1) * stagger + dur * 0.45;

    medias.forEach((img, i) => {
      const { yJitter } = pathSeed[i];

      gsap.set(img, {
        xPercent: -50,
        yPercent: -50,
        x: xSpan,
        y: yJitter,
        scale: 0,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        autoAlpha: 1,
        visibility: "visible",
        transformOrigin: "50% 50%",
        force3D: true,
      });
    });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: pinHeight,
        start: "top top",
        end: "bottom bottom",
        pin: container,
        pinSpacing: false,
        /* .page-editorial overflow-x:clip breaks position:fixed pins */
        pinType: document.body.classList.contains("page-editorial") ? "transform" : "fixed",
        scrub: SCRUB,
        anticipatePin: 0,
        invalidateOnRefresh: true,
      },
    });

    /* Two R→L waves — enter right, peak mid-path, exit left (never L→R) */
    const waves = [
      { offset: 0, ySign: 1, peak: scalePeak },
      { offset: wave2, ySign: -1, peak: scalePeak * 0.96 },
    ];

    waves.forEach(({ offset, ySign, peak }) => {
      medias.forEach((img, i) => {
        const { yJitter } = pathSeed[i];
        const y0 = yJitter * ySign;
        const t0 = offset + i * stagger;

        tl.fromTo(
          img,
          {
            x: xSpan,
            y: y0,
            scale: 0,
          },
          {
            x: 0,
            y: y0 * 0.35,
            scale: peak,
            duration: dur * 0.5,
            ease: "power2.out",
          },
          t0
        );
        tl.to(
          img,
          {
            x: -xSpan,
            y: -y0 * 0.5,
            scale: 0,
            duration: dur * 0.5,
            ease: "power2.in",
          },
          t0 + dur * 0.5
        );
      });
    });

    tween = tl;
  }

  function applyMode() {
    const next = prefersReducedMotion() ? "static" : "flow";
    if (next === mode) {
      if (next === "flow" && tween) ScrollTrigger.refresh();
      return;
    }
    mode = next;
    if (next === "static") {
      showStatic();
    } else {
      buildFlow();
    }
  }

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    root.classList.add("is-static");
    return;
  }

  applyMode();

  const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduceMq.addEventListener("change", applyMode);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (mode !== "flow") return;
      /* Rebuild so travel distances / peak scale match the new viewport */
      mode = null;
      applyMode();
    }, 180);
  });

  requestAnimationFrame(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
