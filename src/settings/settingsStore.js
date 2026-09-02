import { useSyncExternalStore } from 'react'
import { DEFAULT_SETTINGS } from './schema'

/**
 * Module-level store instead of React context — the R3F canvas renders in a
 * separate reconciler that does not forward context, so both the DOM drawer and
 * the in-canvas scene subscribe here.
 */
const STORAGE_KEY = 'prism.settings.v13'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

let state = {
  settings: { ...DEFAULT_SETTINGS, ...loadStored() },
  open: false,
}

const listeners = new Set()

function emit() {
  for (const fn of listeners) fn()
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings))
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot() {
  return state
}

export function setSetting(key, value) {
  if (state.settings[key] === value) return
  state = { ...state, settings: { ...state.settings, [key]: value } }
  persist()
  emit()
}

export function resetSettings() {
  state = { ...state, settings: { ...DEFAULT_SETTINGS } }
  persist()
  emit()
}

export function setDrawerOpen(next) {
  const open = typeof next === 'function' ? next(state.open) : next
  if (open === state.open) return
  state = { ...state, open }
  emit()
}

export function useSettings() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// Press "P" to toggle the drawer, Esc to close it.
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'password', 'number', 'tel'])

function isTextEntry(el) {
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') return TEXT_INPUT_TYPES.has((el.type || 'text').toLowerCase())
  return false
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.open) {
      setDrawerOpen(false)
      return
    }
    if (e.key !== 'p' && e.key !== 'P') return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (isTextEntry(e.target)) return
    e.preventDefault()
    setDrawerOpen((v) => !v)
  })
}
