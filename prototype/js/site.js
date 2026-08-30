gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Active nav link
const page = document.body.dataset.page;
if (page) {
  document.querySelectorAll(`.site-nav__links a[data-nav="${page}"]`).forEach((a) => {
    a.classList.add("is-active");
  });
}

// Legacy reveal class (stub pages)
if (!document.body.dataset.page) {
  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.fromTo(
      el,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      },
    );
  });
}

window.addEventListener("load", () => ScrollTrigger.refresh());
