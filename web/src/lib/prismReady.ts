/**
 * Shared “prism WebGL scene ready” gate for the homepage preloader.
 * Set once materials/shaders have compiled past first frames (or on hard fail).
 */

type Listener = (ready: boolean) => void

let ready = false
const listeners = new Set<Listener>()

export function isPrismSceneReady(): boolean {
  return ready
}

export function markPrismSceneReady(value = true) {
  if (ready === value) return
  ready = value
  for (const listener of listeners) listener(ready)
}

/** Reset between StrictMode remounts / HMR so the gate can fire again. */
export function resetPrismSceneReady() {
  ready = false
  for (const listener of listeners) listener(false)
}

export function subscribePrismSceneReady(listener: Listener): () => void {
  listeners.add(listener)
  listener(ready)
  return () => {
    listeners.delete(listener)
  }
}
