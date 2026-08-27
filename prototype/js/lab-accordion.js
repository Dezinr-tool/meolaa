const labPanels = gsap.utils.toArray("[data-lab-panel]");
const ACTIVE_GROW = 3.6;
const IDLE_GROW = 0.7;

function setActiveLabPanel(active) {
  labPanels.forEach((panel) => {
    const on = panel === active;
    panel.classList.toggle("is-active", on);
    panel.setAttribute("aria-expanded", on ? "true" : "false");
  });

  gsap.to(labPanels, {
    flexGrow: (i, el) => (el === active ? ACTIVE_GROW : IDLE_GROW),
    duration: 0.55,
    ease: "power3.out",
    overwrite: "auto",
  });
}

if (labPanels.length) {
  labPanels.forEach((panel) => {
    panel.style.flexGrow = panel.classList.contains("is-active")
      ? String(ACTIVE_GROW)
      : String(IDLE_GROW);
    panel.addEventListener("mouseenter", () => setActiveLabPanel(panel));
    panel.addEventListener("focus", () => setActiveLabPanel(panel));
    panel.addEventListener("click", () => setActiveLabPanel(panel));
  });
}
