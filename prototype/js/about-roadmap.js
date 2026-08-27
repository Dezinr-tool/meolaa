/**
 * About Us — Our Story roadmap.
 * Pins the card ~1 viewport; vertical scroll scrubs active milestone
 * (capsule fill + diamond ring + bullets under the active marker).
 * About Us only — do not couple to Our Story page sections.
 *
 * pinType: "transform" — .page-editorial overflow-x:clip breaks fixed pins.
 */
(function initAboutRoadmap() {
  if (/#figmacapture=/.test(location.hash)) return;
  const root = document.querySelector("[data-au-roadmap]");
  if (!root) return;

  const pin = root.querySelector("[data-au-roadmap-pin]");
  const track = root.querySelector("[data-au-roadmap-track]");
  const steps = Array.from(root.querySelectorAll("[data-au-roadmap-step]"));
  if (!pin || !track || !steps.length) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    root.classList.add("is-ready", "is-static");
    setActive(0);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const SCRUB = 0.55;
  const PIN_VH = 2.4;
  let tween = null;
  let lenis = null;
  let lenisRaf = null;
  let lenisOwned = false;
  let lastIndex = -1;
  let resizeTimer = null;
  let mode = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isNarrow() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  function setActive(index) {
    const i = Math.max(0, Math.min(steps.length - 1, index));
    if (i === lastIndex) return;
    lastIndex = i;
    steps.forEach((el, n) => {
      const on = n === i;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-current", on ? "step" : "false");
    });
  }

  function progressToIndex(p) {
    const n = steps.length;
    if (n <= 1) return 0;
    return Math.round(p * (n - 1));
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

  function scrubDistance() {
    const byVh = window.innerHeight * PIN_VH;
    const lagBuffer = window.innerHeight * (SCRUB + 0.25);
    return Math.round(Math.max(byVh, window.innerHeight * 1.6) + lagBuffer);
  }

  function applySectionTravelHeight() {
    const dist = scrubDistance();
    root.style.setProperty("--au-rm-pin-travel", `${dist}px`);
    root.style.minHeight = `calc(100vh + ${dist}px)`;
    return dist;
  }

  function killTween() {
    if (tween) {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      tween = null;
    }
    root.style.removeProperty("--au-rm-pin-travel");
    root.style.removeProperty("min-height");
    root.classList.remove("is-pinning");
  }

  function scrollActiveIntoView(index) {
    if (!isNarrow()) return;
    const el = steps[index];
    if (!el) return;
    const left =
      el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }

  function buildScrub() {
    killTween();
    root.classList.remove("is-static");
    root.classList.add("is-ready");
    ensureLenis();
    applySectionTravelHeight();

    const state = { value: 0 };
    tween = gsap.to(state, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: () => `+=${applySectionTravelHeight()}`,
        scrub: SCRUB,
        pin: pin,
        pinSpacing: true,
        pinType: "transform",
        anticipatePin: 0,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        onEnter: () => root.classList.add("is-pinning"),
        onEnterBack: () => root.classList.add("is-pinning"),
        onLeave: () => root.classList.remove("is-pinning"),
        onLeaveBack: () => root.classList.remove("is-pinning"),
        onRefresh: () => {
          applySectionTravelHeight();
          setActive(progressToIndex(state.value));
        },
      },
      onUpdate: () => {
        const idx = progressToIndex(state.value);
        setActive(idx);
        if (isNarrow()) scrollActiveIntoView(idx);
      },
    });

    setActive(0);
  }

  function buildStatic() {
    killTween();
    destroyLenis();
    root.classList.add("is-ready", "is-static");
    setActive(0);
  }

  function applyMode(force) {
    const next = prefersReducedMotion() ? "static" : "scrub";
    if (!force && next === mode) return;
    mode = next;
    if (next === "static") buildStatic();
    else buildScrub();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  steps.forEach((el, i) => {
    el.addEventListener("click", () => {
      if (mode !== "scrub" || !tween || !tween.scrollTrigger) {
        setActive(i);
        scrollActiveIntoView(i);
        return;
      }
      const st = tween.scrollTrigger;
      const p = steps.length <= 1 ? 0 : i / (steps.length - 1);
      const y = st.start + (st.end - st.start) * p;
      if (window.lenis && typeof window.lenis.scrollTo === "function") {
        window.lenis.scrollTo(y, { duration: 0.85 });
      } else {
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  });

  applyMode(true);

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const next = prefersReducedMotion() ? "static" : "scrub";
      if (next !== mode) applyMode(true);
      else if (mode === "scrub") {
        applySectionTravelHeight();
        ScrollTrigger.refresh();
      }
    }, 160);
  });

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    applyMode(true);
  });

  window.addEventListener("load", () => {
    if (mode === "scrub") applySectionTravelHeight();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
})();
