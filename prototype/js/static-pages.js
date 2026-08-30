/* Minimal nav behavior for static inner pages — no GSAP/Lenis */

(function initStaticPages() {
  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll(`.site-nav__links a[data-nav="${page}"]`).forEach((a) => {
      a.classList.add("is-active");
    });
  }

  const nav = document.querySelector(".site-nav");  const hero = document.querySelector("[data-pg-hero]");
  if (!nav) return;

  function updateNav() {
    const threshold = hero ? hero.offsetTop + hero.offsetHeight - 80 : 80;
    nav.classList.toggle("is-scrolled", window.scrollY > threshold);
  }

  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });
})();
