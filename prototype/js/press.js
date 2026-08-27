/* Press & Media — category filter + pagination; state reflected in URL */

(function initPressPage() {
  const list = document.querySelector("[data-press-list]");
  if (!list) return;

  const PAGE_SIZE = 5;
  const items = [...list.querySelectorAll("[data-press-item]")];
  const chips = [...document.querySelectorAll("[data-press-cat]")];
  const empty = document.querySelector("[data-press-empty]");
  const pager = document.querySelector("[data-press-pager]");
  const pagesEl = document.querySelector("[data-press-pages]");
  const prevBtn = document.querySelector("[data-press-prev]");
  const nextBtn = document.querySelector("[data-press-next]");

  const state = { cat: "all", page: 1 };

  function fromUrl() {
    const p = new URLSearchParams(location.search);
    const cat = p.get("category");
    const page = parseInt(p.get("page") || "1", 10);
    if (cat) state.cat = cat;
    if (page > 0) state.page = page;
  }

  function toUrl() {
    const p = new URLSearchParams();
    if (state.cat !== "all") p.set("category", state.cat);
    if (state.page > 1) p.set("page", String(state.page));
    const q = p.toString();
    history.replaceState(null, "", q ? `?${q}${location.hash}` : location.pathname + location.hash);
  }

  function filtered() {
    return items.filter((el) => state.cat === "all" || el.dataset.cat === state.cat);
  }

  function render() {
    const match = filtered();
    const totalPages = Math.max(1, Math.ceil(match.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const visibleSet = new Set(match.slice(start, end));

    items.forEach((el) => {
      el.hidden = !visibleSet.has(el);
    });

    if (empty) empty.hidden = match.length > 0;

    chips.forEach((c) => c.classList.toggle("is-active", c.dataset.pressCat === state.cat));

    if (pagesEl) {
      pagesEl.innerHTML = "";
      for (let i = 1; i <= totalPages; i += 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "press-pager__num" + (i === state.page ? " is-active" : "");
        btn.textContent = String(i);
        btn.setAttribute("aria-label", `Page ${i}`);
        if (i === state.page) btn.setAttribute("aria-current", "page");
        btn.addEventListener("click", () => {
          state.page = i;
          apply();
          list.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        pagesEl.appendChild(btn);
      }
    }

    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= totalPages;
    if (pager) pager.hidden = match.length === 0;

    toUrl();
  }

  function apply() {
    render();
  }

  chips.forEach((c) => {
    c.addEventListener("click", () => {
      state.cat = c.dataset.pressCat;
      state.page = 1;
      apply();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        apply();
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(filtered().length / PAGE_SIZE));
      if (state.page < totalPages) {
        state.page += 1;
        apply();
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* Light reveal on scroll for featured + kit rows */
  const reveals = document.querySelectorAll(".press-featured, .press-row, .press-kit__item, .press-contact__card");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => {
      el.classList.add("press-reveal");
      io.observe(el);
    });
  }

  fromUrl();
  apply();
})();
