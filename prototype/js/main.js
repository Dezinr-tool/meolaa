gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const arrow = document.getElementById("arrow");
const arrowFloat = arrow?.querySelector(".arrow__float");
const arrowShape = arrow?.querySelector(".arrow__shape");
const hero = document.querySelector('[data-section="hero"]');
const vision = document.querySelector('[data-section="vision"]');
const pillars = document.querySelector('[data-section="pillars"]');
const lab = document.querySelector('[data-section="lab"]');
const labArrowSlot = document.querySelector("[data-lab-arrow-slot]");

const ARROW_WHITE = "#ffffff";
const ARROW_GREEN = "rgba(10, 48, 56, 0.22)";

function mixArrowColor(t) {
  const r = gsap.utils.interpolate(255, 10, t);
  const g = gsap.utils.interpolate(255, 48, t);
  const b = gsap.utils.interpolate(255, 56, t);
  const a = gsap.utils.interpolate(1, 0.22, t);
  return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a.toFixed(2)})`;
}

document.querySelectorAll('.site-nav__links a[data-nav="home"]').forEach((a) => {
  a.classList.add("is-active");
});

function labSlotCenter() {
  if (!labArrowSlot) return { x: 120, y: window.innerHeight * 0.55 };
  const rect = labArrowSlot.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.55,
  };
}

function heroArrowPoint() {
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.44,
  };
}

function visionArrowPoint() {
  const copy = document.querySelector(".vision__copy");
  if (!copy) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 };
  const rect = copy.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.5,
  };
}

function pillarsArrowPoint() {
  const rect = pillars.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.48,
    y: rect.top + rect.height * 0.42,
  };
}

if (arrow && arrowFloat && arrowShape && hero && vision && pillars && lab) {
  gsap.set(arrow, {
    left: "50%",
    top: "44%",
    xPercent: -50,
    yPercent: -50,
    rotation: 0,
    scale: 1,
    opacity: 1,
    visibility: "visible",
  });
  gsap.set(arrowShape, { backgroundColor: ARROW_WHITE });

  const floatTween = gsap.to(arrowFloat, {
    y: 10,
    duration: 3.4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  function setArrowAt(x, y, rotation = 0) {
    gsap.set(arrow, {
      left: x,
      top: y,
      xPercent: -50,
      yPercent: -50,
      rotation,
      scale: 1,
      opacity: 1,
      visibility: "visible",
    });
  }

  function resetHeroArrow() {
    arrow.classList.remove("is-behind-copy");
    gsap.set(arrow, {
      left: "50%",
      top: "44%",
      xPercent: -50,
      yPercent: -50,
      rotation: 0,
      scale: 1,
      opacity: 1,
      visibility: "visible",
    });
    gsap.set(arrowShape, { backgroundColor: ARROW_WHITE });
    gsap.set(arrowFloat, { y: 0 });
    floatTween.play();
  }

  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    endTrigger: vision,
    end: "top top",
    scrub: 0.55,
    onUpdate: (self) => {
      if (self.progress > 0.01) {
        floatTween.pause();
        gsap.set(arrowFloat, { y: 0 });
      } else {
        floatTween.play();
      }

      const from = heroArrowPoint();
      const to = visionArrowPoint();
      const p = self.progress;
      setArrowAt(
        gsap.utils.interpolate(from.x, to.x, p),
        gsap.utils.interpolate(from.y, to.y, p),
        gsap.utils.interpolate(0, 18, p),
      );

      const colorP = gsap.utils.clamp(0, 1, (p - 0.2) / 0.8);
      gsap.set(arrowShape, {
        backgroundColor: mixArrowColor(colorP),
      });
      arrow.classList.toggle("is-behind-copy", p > 0.28);
    },
    onLeaveBack: resetHeroArrow,
  });

  ScrollTrigger.create({
    trigger: vision,
    start: "top top",
    end: "+=120%",
    scrub: true,
    onUpdate: () => {
      floatTween.pause();
      gsap.set(arrowFloat, { y: 0 });
      const p = visionArrowPoint();
      setArrowAt(p.x, p.y, 18);
      arrow.classList.add("is-behind-copy");
      gsap.set(arrowShape, { backgroundColor: ARROW_GREEN });
    },
    onLeaveBack: () => {
      if (window.scrollY <= hero.offsetTop + hero.offsetHeight) resetHeroArrow();
    },
  });

  ScrollTrigger.create({
    trigger: vision,
    start: "+=120% top",
    endTrigger: lab,
    end: "top 35%",
    scrub: 0.75,
    onUpdate: (self) => {
      floatTween.pause();
      gsap.set(arrowFloat, { y: 0 });
      arrow.classList.remove("is-behind-copy");

      const from = visionArrowPoint();
      const mid = pillarsArrowPoint();
      const to = labSlotCenter();
      let x;
      let y;
      let rot;

      if (self.progress < 0.45) {
        const p = self.progress / 0.45;
        x = gsap.utils.interpolate(from.x, mid.x, p);
        y = gsap.utils.interpolate(from.y, mid.y, p);
        rot = gsap.utils.interpolate(18, 28, p);
      } else {
        const p = (self.progress - 0.45) / 0.55;
        x = gsap.utils.interpolate(mid.x, to.x, p);
        y = gsap.utils.interpolate(mid.y, to.y, p);
        rot = gsap.utils.interpolate(28, 0, p);
      }

      setArrowAt(x, y, rot);
      gsap.set(arrowShape, { backgroundColor: ARROW_GREEN });
    },
  });
}

if (hero) {
  gsap.to("[data-hero-bg]", {
    yPercent: 8,
    scale: 1.03,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

function splitVisionLines(lines) {
  lines.forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = "";
    line.setAttribute("aria-label", text);

    // Wrap by word so scroll-reveal chars never mid-break (e.g. "faste" / "r")
    text.split(/(\s+)/).forEach((token) => {
      if (/^\s+$/.test(token)) {
        const space = document.createElement("span");
        space.className = "vision__char is-space";
        space.textContent = "\u00a0";
        line.appendChild(space);
        return;
      }

      const word = document.createElement("span");
      word.className = "vision__word";
      [...token].forEach((char) => {
        const span = document.createElement("span");
        span.className = "vision__char";
        span.textContent = char;
        word.appendChild(span);
      });
      line.appendChild(word);
    });
  });
}

const lines = gsap.utils.toArray("[data-vision-line]");
const videoBox = document.querySelector("[data-video-box]");
const visionCopy = document.querySelector(".vision__copy");
const visionVideo = videoBox?.querySelector("video");
const isFigmaCapture = /#figmacapture=/.test(location.hash);

if (vision && videoBox && lines.length && !isFigmaCapture) {
  splitVisionLines(lines);
  const chars = gsap.utils.toArray(".vision__char");

  gsap.set(videoBox, {
    opacity: 0,
    visibility: "hidden",
    y: "120%",
    width: Math.min(505, window.innerWidth * 0.9),
    height: 311,
  });

  gsap.set(chars, { opacity: 0.12, filter: "blur(6px)" });

  const vtl = gsap.timeline({
    scrollTrigger: {
      trigger: vision,
      start: "top top",
      end: "+=280%",
      pin: true,
      scrub: 1,
      anticipatePin: 1,
    },
  });

  vtl.fromTo(
    chars,
    { opacity: 0.12, filter: "blur(6px)" },
    {
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.05,
      stagger: 0.008,
      ease: "power1.out",
    },
    0,
  );

  vtl.to(visionCopy, { opacity: 0, duration: 0.12, ease: "power1.in" }, "+=0.08");

  vtl.set(videoBox, { visibility: "visible" });
  vtl.fromTo(
    videoBox,
    {
      opacity: 0,
      y: "120%",
      width: Math.min(505, window.innerWidth * 0.9),
      height: 311,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
      onStart: () => {
        if (visionVideo) {
          visionVideo.play().catch(() => {});
        }
      },
    },
  );

  vtl.to(
    videoBox,
    {
      width: "100vw",
      height: "100vh",
      y: 0,
      borderRadius: 0,
      duration: 1,
      ease: "power2.inOut",
    },
    "+=0.12",
  );
}

/* Pillars pin/scrub lives in js/pillars.js (shared with About Us) */

const portfolioTitle = document.querySelector(".portfolio-title h2");
if (portfolioTitle) {
  gsap.fromTo(
    portfolioTitle,
    { filter: "blur(9px)", opacity: 0.55, y: 24 },
    {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".portfolio-title",
        start: "top 75%",
        end: "top 25%",
        scrub: 1,
      },
    },
  );
}

const metricBlocks = gsap.utils.toArray("[data-metric]");
if (metricBlocks.length && !isFigmaCapture) {
  gsap.set(metricBlocks, { clipPath: "inset(100% 0 0 0)" });
  gsap.to(metricBlocks, {
    clipPath: "inset(0% 0 0 0)",
    duration: 0.7,
    ease: "power3.out",
    stagger: { each: 0.16, from: "end" },
    scrollTrigger: {
      trigger: "[data-section='metrics']",
      start: "top 75%",
      toggleActions: "play none none reverse",
    },
  });
} else if (metricBlocks.length && isFigmaCapture) {
  gsap.set(metricBlocks, { clipPath: "none", clearProps: "clipPath" });
}

window.addEventListener("load", () => ScrollTrigger.refresh());
window.addEventListener("resize", () => ScrollTrigger.refresh());

const siteNav = document.querySelector(".site-nav");
if (siteNav) {
  const toggleNavGlass = () => siteNav.classList.toggle("is-scrolled", window.scrollY > 40);
  toggleNavGlass();
  window.addEventListener("scroll", toggleNavGlass, { passive: true });
}

const brandFilters = document.querySelectorAll(".brand-filter");
const brandCards = document.querySelectorAll(".brands .brand-card[data-category]");
brandFilters.forEach((btn) => {
  btn.addEventListener("click", () => {
    brandFilters.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const filter = btn.dataset.filter;
    brandCards.forEach((card) => {
      card.style.display = filter === "all" || card.dataset.category === filter ? "" : "none";
    });
    ScrollTrigger.refresh();
  });
});

/* Brand portfolio — pinned scrub stack.
   Pin .brands once; scrub cards 2–3 up over HIRA (yPercent 100→50 / 75).
   Final read ≈ HIRA 50% + card2 25% + card3 25%. Mobile: CSS stack only.
   CSS fallback (.brands:not(.is-stack-ready)) keeps covers at translateY(100%)
   until this init clears transform and GSAP owns yPercent alone. */
/* Brand stack pin — skip entirely during Figma capture so all cards serialize */
if (!/#figmacapture=/.test(location.hash)) ScrollTrigger.matchMedia({
  "(min-width: 901px)": function () {
    const section = document.querySelector(".brands");
    const cards = gsap.utils.toArray(".brands .brand-card");
    if (!section || cards.length < 2) return;

    const [hira, card2, card3] = cards;
    const covers = cards.slice(1);
    const hiraInner = hira?.querySelector(".brand-card__inner");

    // Hand off from CSS translateY → GSAP yPercent (avoid double offset)
    section.classList.add("is-stack-ready");
    gsap.set(covers, { clearProps: "transform" });
    gsap.set(covers, { yPercent: 100, force3D: true });
    // No scale on HIRA — shrink + overflow:hidden clipped the hero numeral/title
    // under the fixed nav. Covers still get a light scale for depth.
    if (card2) gsap.set(card2, { scale: 1, transformOrigin: "center top" });
    if (hiraInner) gsap.set(hiraInner, { paddingBottom: 92 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 2.6)}`,
        scrub: true,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Phase 1 — Brand 02 rises; HIRA copy lifts into the visible top peek
    tl.fromTo(
      card2,
      { yPercent: 100 },
      { yPercent: 50, duration: 1 },
      0,
    );
    if (hiraInner) {
      tl.to(
        hiraInner,
        {
          paddingBottom: () => Math.round(window.innerHeight * 0.5),
          duration: 1,
        },
        0,
      );
    }

    // Phase 2 — Brand 03 rises into the bottom band; card2 settles
    if (card3) {
      tl.fromTo(
        card3,
        { yPercent: 100 },
        { yPercent: 75, duration: 1 },
        1,
      );
      tl.to(card2, { scale: 0.985, duration: 1 }, 1);
    }

    // Brief settle so the final stack can read before unpin
    tl.to({}, { duration: 0.35 });

    return () => {
      section.classList.remove("is-stack-ready");
      gsap.set(covers, { clearProps: "transform" });
      if (hiraInner) gsap.set(hiraInner, { clearProps: "paddingBottom" });
    };
  },
});
else {
  const section = document.querySelector(".brands");
  if (section) {
    section.classList.add("is-stack-ready");
    section.querySelectorAll(".brand-card").forEach((card) => {
      card.style.transform = "none";
      card.style.opacity = "1";
      card.style.visibility = "visible";
    });
  }
}