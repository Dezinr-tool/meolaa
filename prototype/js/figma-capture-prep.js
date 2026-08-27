/**
 * Figma capture prep — only when #figmacapture= is present.
 * Goal: freeze scroll/pin animations and expose real section content + images
 * so captures are not empty black spacer blocks.
 */
(function () {
  if (!/#figmacapture=/.test(location.hash)) return;

  function killMotion() {
    try {
      if (window.ScrollTrigger) {
        if (typeof window.ScrollTrigger.getAll === "function") {
          window.ScrollTrigger.getAll().forEach(function (t) {
            try {
              t.kill(true);
            } catch (e) {}
          });
        }
        if (typeof window.ScrollTrigger.clearScrollMemory === "function") {
          window.ScrollTrigger.clearScrollMemory();
        }
        if (typeof window.ScrollTrigger.refresh === "function") {
          window.ScrollTrigger.refresh();
        }
      }
      if (window.gsap) {
        try {
          window.gsap.globalTimeline.clear();
        } catch (e) {}
        try {
          window.gsap.killTweensOf("*");
        } catch (e) {}
      }
      if (window.lenis && typeof window.lenis.destroy === "function") {
        try {
          window.lenis.destroy();
        } catch (e) {}
      }
    } catch (e) {}
  }

  function injectCss() {
    if (document.querySelector("[data-figma-capture-prep]")) return;
    var style = document.createElement("style");
    style.setAttribute("data-figma-capture-prep", "1");
    style.textContent = [
      "html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; }",
      "html { filter: grayscale(1) !important; -webkit-filter: grayscale(1) !important; }",
      /* Kill pin spacers that become solid black voids in Figma */
      ".pin-spacer, [data-pin-spacer], .ScrollTrigger-pin-spacer {",
      "  display: contents !important;",
      "  height: auto !important;",
      "  padding: 0 !important;",
      "  margin: 0 !important;",
      "}",
      "*, *::before, *::after {",
      "  animation: none !important;",
      "  transition: none !important;",
      "  scroll-snap-type: none !important;",
      "}",
      /* Force content readable — do NOT force every node opacity 1 on decorative overlays only */
      "section, .fold, .story-chapter, main, footer, header, .brands, .metrics,",
      ".founding, .investors, .press-feed, .lab-os, .lab-caps, .lab-tech, .lab-case,",
      ".au2-mv, .lead-grid, .cr-team, .val-rows, .ct-roles, .ct-benefits, .ct-life, .ct-team,",
      ".pt-investors, .pt-types, .pt-engage, .pt-quotes, .pt-form-sec, .pt-updates,",
      ".press-featured, .press-releases, .press-kit, .press-contact, .pg-where-next {",
      "  position: relative !important;",
      "  top: auto !important;",
      "  left: auto !important;",
      "  right: auto !important;",
      "  bottom: auto !important;",
      "  transform: none !important;",
      "  opacity: 1 !important;",
      "  visibility: visible !important;",
      "  height: auto !important;",
      "  max-height: none !important;",
      "  min-height: 0 !important;",
      "  overflow: visible !important;",
      "  clip: auto !important;",
      "  clip-path: none !important;",
      "}",
      "img, picture, video, canvas, svg {",
      "  opacity: 1 !important;",
      "  visibility: visible !important;",
      "  filter: grayscale(1) !important;",
      "  -webkit-filter: grayscale(1) !important;",
      "}",
      /* Reveal typically-hidden accordion panels */
      "[hidden] { display: block !important; }",
      "details > *:not(summary) { display: block !important; }",
      /* HOW WE BUILD BRANDS — flatten pin scrub into a normal stacked section */
      ".fold.pillars, [data-section='pillars'] {",
      "  display: flex !important;",
      "  flex-direction: column !important;",
      "  align-items: stretch !important;",
      "  justify-content: flex-start !important;",
      "  height: auto !important;",
      "  min-height: 0 !important;",
      "  padding: 80px 48px !important;",
      "  gap: 48px !important;",
      "  background: #000 !important;",
      "}",
      ".pillars__title {",
      "  position: relative !important;",
      "  opacity: 1 !important;",
      "  transform: none !important;",
      "  font-size: clamp(28px, 4vw, 56px) !important;",
      "  color: #fff !important;",
      "  margin: 0 !important;",
      "}",
      ".pillars__track, [data-pillars-track] {",
      "  display: grid !important;",
      "  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;",
      "  gap: 24px !important;",
      "  width: 100% !important;",
      "  height: auto !important;",
      "  transform: none !important;",
      "  position: relative !important;",
      "}",
      ".pillar-card {",
      "  position: relative !important;",
      "  opacity: 1 !important;",
      "  transform: none !important;",
      "  visibility: visible !important;",
      "  width: auto !important;",
      "  height: auto !important;",
      "  display: flex !important;",
      "  flex-direction: column !important;",
      "  gap: 12px !important;",
      "  color: #fff !important;",
      "}",
      ".pillar-card img {",
      "  width: 100% !important;",
      "  height: 320px !important;",
      "  object-fit: cover !important;",
      "  display: block !important;",
      "  opacity: 1 !important;",
      "  filter: grayscale(1) !important;",
      "}",
      /* Vision fold — keep full copy + video visible (no letter scrub) */
      ".fold.vision, [data-section='vision'] {",
      "  height: auto !important;",
      "  min-height: 0 !important;",
      "  padding: 80px 48px !important;",
      "}",
      ".vision__copy, [data-vision-line], .vision__char {",
      "  opacity: 1 !important;",
      "  filter: none !important;",
      "  visibility: visible !important;",
      "  transform: none !important;",
      "}",
      ".vision__video-wrap, [data-video-box], .vision__video {",
      "  opacity: 1 !important;",
      "  visibility: visible !important;",
      "  transform: none !important;",
      "  position: relative !important;",
      "  width: min(505px, 90vw) !important;",
      "  height: auto !important;",
      "}",
      /* Mission & Vision — stack both panels fully readable */
      ".au2-mv, [data-mv-scroll] {",
      "  height: auto !important;",
      "  min-height: 0 !important;",
      "  overflow: visible !important;",
      "}",
      "[data-mv-pin], [data-mv-frame], [data-mv-strip], [data-mv-thesis],",
      "[data-mv-panel], [data-mv-fade], [data-mv-img] {",
      "  opacity: 1 !important;",
      "  visibility: visible !important;",
      "  transform: none !important;",
      "  filter: none !important;",
      "  position: relative !important;",
      "  height: auto !important;",
      "  width: auto !important;",
      "}",
      "[data-mv-panel] { display: block !important; margin: 48px 0 !important; }",
      ".au2-mv__panels { display: flex !important; flex-direction: column !important; gap: 48px !important; }",
    ].join("\n");
    document.head.appendChild(style);
  }

  function replaceVideosWithPosters() {
    // External/large videos can hang or bloat html-to-design serialization.
    // Keep the same visual by swapping to the poster (or first frame fallback).
    document.querySelectorAll("video").forEach(function (video) {
      if (video.getAttribute("data-figma-replaced") === "1") return;
      var poster = video.getAttribute("poster");
      var img = document.createElement("img");
      img.alt = video.getAttribute("aria-label") || "Video";
      img.src = poster || "";
      img.loading = "eager";
      img.decoding = "sync";
      var cs = window.getComputedStyle(video);
      img.style.width = cs.width || "100%";
      img.style.height = cs.height && cs.height !== "auto" ? cs.height : "auto";
      img.style.objectFit = "cover";
      img.style.display = "block";
      img.style.filter = "grayscale(1)";
      img.setAttribute("data-figma-video-poster", "1");
      video.setAttribute("data-figma-replaced", "1");
      video.pause();
      video.removeAttribute("src");
      video.querySelectorAll("source").forEach(function (s) {
        s.remove();
      });
      video.load();
      if (poster) {
        video.parentNode.insertBefore(img, video);
        video.style.display = "none";
      }
    });
  }

  function revealDom() {
    document.querySelectorAll("details").forEach(function (d) {
      d.open = true;
    });
    replaceVideosWithPosters();
    document.querySelectorAll("img").forEach(function (img) {
      if (img.loading === "lazy") img.loading = "eager";
      if (img.decode) {
        try {
          img.decode();
        } catch (e) {}
      }
    });
    // Expand lab accordion items if present
    document.querySelectorAll("[data-lab-os] button, [data-lab-caps] button, .lab-os__item, .lab-accordion__item").forEach(function (el) {
      el.classList.add("is-open", "is-active", "open");
      el.setAttribute("aria-expanded", "true");
    });
    document.querySelectorAll(".lab-os__panel, .lab-accordion__panel, [data-panel]").forEach(function (p) {
      p.style.display = "block";
      p.style.opacity = "1";
      p.style.height = "auto";
      p.hidden = false;
    });
    // Force pillars cards visible for capture
    document.querySelectorAll(".pillar-card, .pillars__track, .pillars__title").forEach(function (el) {
      el.style.opacity = "1";
      el.style.visibility = "visible";
      el.style.transform = "none";
    });
    // Restore vision lines if already character-split
    document.querySelectorAll("[data-vision-line]").forEach(function (line) {
      var label = line.getAttribute("aria-label");
      if (label) {
        line.textContent = label;
      }
      line.style.opacity = "1";
      line.style.filter = "none";
    });
    document.querySelectorAll("[data-mv-panel], [data-mv-fade], [data-mv-thesis]").forEach(function (el) {
      el.style.opacity = "1";
      el.style.visibility = "visible";
      el.style.transform = "none";
      el.hidden = false;
    });
  }

  function waitForImages(timeoutMs) {
    var imgs = Array.prototype.slice.call(document.images || []);
    var start = Date.now();
    return Promise.all(
      imgs.map(function (img) {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(function (resolve) {
          var done = function () {
            resolve();
          };
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, Math.max(0, timeoutMs - (Date.now() - start)));
        });
      })
    );
  }

  function unwrapPinSpacers() {
    document.querySelectorAll(".pin-spacer, [data-pin-spacer], .ScrollTrigger-pin-spacer").forEach(function (el) {
      var parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      el.remove();
    });
  }

  function flattenAbsoluteLayers() {
    // Capture serializer often lifts fixed/sticky/absolute sections out of Body
    // into empty Placeholder siblings. Force a single document flow.
    var nodes = document.querySelectorAll("header, footer, section, main, .fold, .brands, .metrics, .founding, .investors, .press-feed, .pg-where-next, .site-nav, .site-footer");
    nodes.forEach(function (el) {
      el.style.setProperty("position", "relative", "important");
      el.style.setProperty("top", "auto", "important");
      el.style.setProperty("left", "auto", "important");
      el.style.setProperty("right", "auto", "important");
      el.style.setProperty("bottom", "auto", "important");
      el.style.setProperty("inset", "auto", "important");
      el.style.setProperty("transform", "none", "important");
      el.style.setProperty("z-index", "auto", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("height", "auto", "important");
      el.style.setProperty("min-height", "0", "important");
      el.style.setProperty("max-height", "none", "important");
      el.style.setProperty("overflow", "visible", "important");
    });
  }

  function ensureSingleFlowRoot() {
    if (document.getElementById("figma-capture-root")) return;
    var root = document.createElement("div");
    root.id = "figma-capture-root";
    root.setAttribute("data-figma-capture-root", "1");
    root.style.cssText = "display:block;position:relative;width:100%;margin:0;padding:0;overflow:visible;";
    var body = document.body;
    while (body.firstChild) root.appendChild(body.firstChild);
    body.appendChild(root);
  }

  function run() {
    killMotion();
    injectCss();
    revealDom();
    killMotion();
    unwrapPinSpacers();
    flattenAbsoluteLayers();
    ensureSingleFlowRoot();
    flattenAbsoluteLayers();
    window.scrollTo(0, 0);
    document.body.style.height = "auto";
    document.documentElement.style.height = "auto";
  }

  function boot() {
    run();
    waitForImages(6000).then(function () {
      run();
      // nudge layout after images
      window.dispatchEvent(new Event("resize"));
      run();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(boot, 300);
      setTimeout(run, 2000);
      setTimeout(run, 4500);
      setTimeout(run, 7500);
    });
  } else {
    setTimeout(boot, 300);
    setTimeout(run, 2000);
    setTimeout(run, 4500);
    setTimeout(run, 7500);
  }
})();
