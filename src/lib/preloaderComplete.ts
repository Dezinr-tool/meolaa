/**
 * Shared “preloader exit finished” gate for homepage intro animations
 * (e.g. hero beam draw-in). Marked once when the preloader finishes or
 * when it was already skipped this session.
 */

type Listener = () => void

let complete = false
const listeners = new Set<Listener>()

export function isPreloaderComplete(): boolean {
  return complete
}

export function markPreloaderComplete() {
  if (complete) return
  complete = true
  for (const listener of listeners) listener()
}

/** Reset between StrictMode remounts / HMR so the gate can fire again. */
export function resetPreloaderComplete() {
  complete = false
}

export function subscribePreloaderComplete(listener: Listener): () => void {
  listeners.add(listener)
  if (complete) {
    queueMicrotask(() => {
      if (complete) listener()
    })
  }
  return () => {
    listeners.delete(listener)
  }
}
