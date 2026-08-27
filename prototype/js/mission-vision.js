/**
 * Mission & Vision — Zoox AnimatedImage–inspired pin + scrub.
 *
 * Desktop beats (scrub ~1.65× viewport — tight, no idle white lead-in):
 * 0. Demand/Model thesis is centered over the pin
 * 1. Mask/frame rises from below (translateY + scale); thesis y/fade move on
 *    the same scrub so copy clears before the frame settles (geometry + motion)
 * 2. Mission copy (right) rises from below
 * 3. Mask slides to the right column
 * 4. Mission dissolves
 * 5. Vision copy enters from the left
 * 6. Optional image crossfade (mission → vision asset)
 *
 * Mobile: no pin — stacked panels with simple fades.
 * prefers-reduced-motion: static final layout.
 */
(function initMissionVision() {
  // Capture mode: leave DOM fully visible / no pin scrub
  if (/#figmacapture=/.test(location.hash)) return;
  const root = document.querySelector("[data-mv-scroll], .au2-mv");
  if (!root || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const MQ = "(max-width: 900px)";
  const START_SCALE = 0.42;
  /** Card start Y as fraction of viewport — below copy / mostly below pin */
  const START_Y_VH = 0.78;
  const SCRUB_VH = 1.65;
  /** Shared duration for frame rise+scale + thesis exit (proportional link) */
  const GROW_DUR = 0.85;
  const pin = root.querySelector("[data-mv-pin]");
  const frame = root.querySelector("[data-mv-frame]");
  const strip = root.querySelector("[data-mv-strip]");
  const thesis = root.querySelector("[data-mv-thesis]");
  const imgMission = root.querySelector('[data-mv-img="mission"]');
  const imgVision = root.querySelector('[data-mv-img="vision"]');
  const panelMission = root.querySelector('[data-mv-panel="mission"]');
  const panelVision = root.querySelector('[data-mv-panel="vision"]');
  const missionFades = panelMission
    ? Array.from(panelMission.querySelectorAll("[data-mv-fade]"))
    : [];
  const visionFades = panelVision
    ? Array.from(panelVision.querySelectorAll("[data-mv-fade]"))
    : [];

  if (!pin || !frame) return;

  let mode = null; // "desktop" | "mobile" | "reduced"
  let triggers = [];
  let tween = null;
  let mobileObserver = null;
  let lenis = null;
  let lenisRaf = null;
  let lenisOwned = false;
  let resizeTimer = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobile() {
    return window.matchMedia(MQ).matches;
  }

  function startY() {
    return Math.round(window.innerHeight * START_Y_VH);
  }

  function killDesktop() {
    if (tween) {
      tween.kill();
      tween = null;
    }
    triggers.forEach((t) => t.kill());
    triggers = [];
    ScrollTrigger.getAll().forEach((st) => {
      const t = st.trigger;
      if (t === root || t === pin || t === thesis || st.vars?.trigger === root) st.kill();
    });
    const clearTargets = [
      frame,
      strip,
      thesis,
      imgMission,
      imgVision,
      panelMission,
      panelVision,
      ...missionFades,
      ...visionFades,
    ].filter(Boolean);
    gsap.set(clearTargets, { clearProps: "all" });
    imgMission?.classList.add("is-active");
    imgVision?.classList.remove("is-active");
    root.classList.remove("is-ready", "is-static");
  }

  function killMobile() {
    if (mobileObserver) {
      mobileObserver.disconnect();
      mobileObserver = null;
    }
    root.querySelectorAll(".au2-mv__panel.is-in").forEach((el) => el.classList.remove("is-in"));
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
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisOwned = true;
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    lenisRaf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
  }

  function applyReduced() {
    killDesktop();
    killMobile();
    destroyLenis();
    root.classList.add("is-reduced");
    root.classList.remove("is-ready");
    imgVision?.classList.add("is-active");
    imgMission?.classList.remove("is-active");
  }

  function setupMobile() {
    killDesktop();
    destroyLenis();
    root.classList.remove("is-ready", "is-static", "is-reduced");

    const panels = root.querySelectorAll(".au2-mv__panel");
    mobileObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            mobileObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" }
    );
    panels.forEach((p) => mobileObserver.observe(p));
  }

  /**
   * Frame stays in a left (then right) column only — never full-bleed.
   * Entrance is rise from bottom (+ scale), then x to the opposite column.
   */
  function layoutMetrics() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const gutter = Math.max(24, w * 0.02);
    const left = w * 0.02;
    /** Keep ≤ ~46% so a clear gutter remains for mission/vision copy */
    const width = w * 0.46;
    const sideLeft = w - left - width;
    return {
      top: h * 0.04,
      left,
      width,
      height: h * 0.92,
      gutter,
      /** Translate from left column → right column (same box size) */
      sideX: sideLeft - left,
    };
  }

  function setupDesktop() {
    killDesktop();
    killMobile();
    root.classList.remove("is-reduced", "is-static");
    ensureLenis();

    const box = layoutMetrics();

    // Base geometry = settled left half; start below via y + scale from bottom
    gsap.set(frame, {
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height,
      x: 0,
      y: startY(),
      scale: START_SCALE,
      transformOrigin: "center bottom",
      borderRadius: 32,
      force3D: true,
    });
    if (strip) gsap.set(strip, { x: 0, clearProps: "transform" });
    if (thesis) gsap.set(thesis, { opacity: 1, y: 0, scale: 1, transformOrigin: "center center" });
    gsap.set(missionFades, { opacity: 0, y: 48, x: 0 });
    gsap.set(visionFades, { opacity: 0, x: -56, y: 0 });
    gsap.set(imgMission, {
      opacity: 1,
      scale: 1.12,
      transformOrigin: "center bottom",
    });
    gsap.set(imgVision, {
      opacity: 0,
      scale: 1.12,
      transformOrigin: "center bottom",
    });
    imgMission?.classList.add("is-active");
    imgVision?.classList.remove("is-active");

    root.classList.add("is-ready");

    // Pin when MV hits top — Demand/Model thesis is already in the same viewport.
    // First scrub progress drives bottom rise + thesis exit together.
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * SCRUB_VH)}`,
        pin: pin,
        pinSpacing: true,
        // Same as story timeline — body.page-editorial overflow-x:clip breaks fixed pins
        pinType: "transform",
        scrub: true,
        anticipatePin: 0,
        invalidateOnRefresh: true,
      },
    });

    // Beat 1 — image rises from below (+ grows); centered thesis moves up/out on
    // the same scrub window (GROW_DUR from t=0) so copy clears before the frame
    // reaches the collision zone. Linked progress, not staggered exit.
    if (thesis) {
      tl.to(
        thesis,
        {
          opacity: 0,
          y: () => -Math.round(window.innerHeight * 0.32),
          scale: 0.94,
          duration: GROW_DUR,
          ease: "none",
        },
        0
      );
    }
    tl.to(
      frame,
      {
        y: 0,
        scale: 1,
        duration: GROW_DUR,
        ease: "none",
      },
      0
    );
    tl.to(imgMission, { scale: 1, duration: GROW_DUR }, 0);
    if (imgVision) tl.to(imgVision, { scale: 1, duration: GROW_DUR }, 0);

    // Beat 2 — Mission on the right rises from below (stagger)
    missionFades.forEach((el, i) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.5 }, GROW_DUR * 0.55 + i * 0.06);
    });

    // Brief hold so Mission can be read
    tl.to({}, { duration: 0.18 }, GROW_DUR + 0.25);

    // Beats 3–5 — mask moves to right column; Mission dissolves; Vision enters left
    const slideAt = GROW_DUR + 0.45;
    tl.to(
      frame,
      {
        x: () => layoutMetrics().sideX,
        duration: 0.9,
      },
      slideAt
    );

    missionFades.forEach((el, i) => {
      tl.to(el, { opacity: 0, y: -8, duration: 0.4 }, slideAt + 0.06 + i * 0.035);
    });

    visionFades.forEach((el, i) => {
      tl.to(el, { opacity: 1, x: 0, duration: 0.5 }, slideAt + 0.22 + i * 0.06);
    });

    // Beat 6 — crossfade image assets inside the mask
    if (imgMission && imgVision) {
      tl.to(imgMission, { opacity: 0, duration: 0.5 }, slideAt + 0.15);
      tl.to(imgVision, { opacity: 1, scale: 1, duration: 0.5 }, slideAt + 0.15);
    }

    // Settle hold at end of pin (kept short to avoid blank scrub)
    tl.to({}, { duration: 0.2 });

    tween = tl;
    if (tl.scrollTrigger) triggers.push(tl.scrollTrigger);

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function syncMode(force) {
    const next = prefersReducedMotion() ? "reduced" : isMobile() ? "mobile" : "desktop";
    if (!force && next === mode) {
      if (next === "desktop") ScrollTrigger.refresh();
      return;
    }
    mode = next;
    if (next === "reduced") applyReduced();
    else if (next === "mobile") setupMobile();
    else setupDesktop();
  }

  syncMode(true);

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const next = prefersReducedMotion() ? "reduced" : isMobile() ? "mobile" : "desktop";
      if (next !== mode) {
        syncMode(true);
      } else if (mode === "desktop") {
        setupDesktop();
      }
    }, 160);
  });

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    syncMode(true);
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
