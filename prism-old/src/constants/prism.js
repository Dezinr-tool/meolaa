/**
 * Shared prism mesh scale — used by Prism, TransmissionPrism, and Scene beam aim.
 * Keep a single source so visual glass and raycast geometry never drift apart.
 *
 * Base was 1.1; ×1.4 ≈ mid of the requested 1.3–1.5 hero-size bump.
 */
export const PRISM_SCALE = 1.1 * 1.4

/** Extrusion depth / material thickness — matches both prism meshes. */
export const PRISM_DEPTH = 1.1
