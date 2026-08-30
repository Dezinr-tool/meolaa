/**
 * HOW WE BUILD BRANDS — shared pin + scrub (homepage + About Us).
 * Requires GSAP + ScrollTrigger. Safe no-op when section is absent.
 */
(function initPillars() {
  // Skip pin/scrub when Figma capture is active — keep cards fully visible
  if (/#figmacapture=/.test(location.hash)) return;
  const pillars = document.querySelector('[data-section="pillars"]');
  if (!pillars) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const pillarsTitle = pillars.querySelector(".pillars__title");
  const pillarCards = gsap.utils.toArray(pillars.querySelectorAll(".pillar-card"));

  if (!pillarsTitle || !pillarCards.length) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.set(pillarCards, { y: 140, opacity: 0 });

  const pillarsTl = gsap.timeline({
    scrollTrigger: {
      trigger: pillars,
      start: "top top",
      end: "+=200%",
      pin: true,
      pinSpacing: true,
      // transform pin survives .page-editorial overflow-x:clip; no early paint over prior section
      pinType: document.body.classList.contains("page-editorial") ? "transform" : "fixed",
      scrub: 1,
      anticipatePin: 0,
    },
  });

  pillarsTl.fromTo(
    pillarsTitle,
    { filter: "blur(9px)", opacity: 0.55, y: "38vh" },
    { filter: "blur(0px)", opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
    0,
  );

  pillarCards.forEach((card, i) => {
    pillarsTl.fromTo(
      card,
      { y: 140, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.28, ease: "power2.out" },
      0.18 + i * 0.22,
    );
  });

  // After MV + timeline pins register, re-measure so pinSpacing stacks correctly
  requestAnimationFrame(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
})();
