import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSettings, setSetting, resetSettings, setDrawerOpen } from './settingsStore'
import { SETTINGS_SCHEMA } from './schema'

function ColorField({ field, value }) {
  return (
    <label className="settings-field settings-field--color">
      <span className="settings-field__label">{field.label}</span>
      <span className="settings-field__swatch">
        <input
          type="color"
          value={value}
          onChange={(e) => setSetting(field.key, e.target.value)}
        />
        <span className="settings-field__hex">{value}</span>
      </span>
    </label>
  )
}

function RangeField({ field, value }) {
  // Heavy fields (FBO / geometry rebuild) commit a short beat after you stop
  // dragging, so the slider stays smooth and nothing flickers or vanishes.
  const deferred = Boolean(field.remount || field.deferred)
  const [local, setLocal] = useState(value)
  const dirtyRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!dirtyRef.current) setLocal(value)
  }, [value])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const shown = dirtyRef.current ? local : value
  const display = Number.isInteger(field.step)
    ? Math.round(shown)
    : Number(shown).toFixed(3)

  const onChange = (e) => {
    const v = parseFloat(e.target.value)
    setLocal(v)
    if (!deferred) {
      setSetting(field.key, v)
      return
    }
    dirtyRef.current = true
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      dirtyRef.current = false
      setSetting(field.key, v)
    }, 220)
  }

  return (
    <label className="settings-field">
      <span className="settings-field__row">
        <span className="settings-field__label">{field.label}</span>
        <span className="settings-field__value">{display}</span>
      </span>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={shown}
        onChange={onChange}
      />
    </label>
  )
}

function Field({ field, value }) {
  return field.type === 'color' ? (
    <ColorField field={field} value={value} />
  ) : (
    <RangeField field={field} value={value} />
  )
}

export default function SettingsDrawer() {
  const { settings, open } = useSettings()

  // Portalled to <body>: this integration mounts <SettingsDrawer> inside the
  // hero's pointer-events:none / overflow:hidden / GSAP-pinned (transformed)
  // stage, and `position: fixed` re-anchors to the nearest transformed
  // ancestor rather than the viewport — without the portal the drawer was
  // clipped and un-clickable behind the hero content instead of floating
  // over the whole page.
  return createPortal(
    <aside
      className={`settings-drawer${open ? ' settings-drawer--open' : ''}`}
      data-lenis-prevent
      aria-hidden={!open}
    >
      <header className="settings-drawer__header">
        <h2>Scene Settings</h2>
        <div className="settings-drawer__actions">
          <button type="button" onClick={resetSettings}>Reset</button>
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close settings">
            ✕
          </button>
        </div>
      </header>

      <div className="settings-drawer__body">
        {SETTINGS_SCHEMA.map((group) => (
          <section key={group.id} className="settings-group">
            <h3>{group.label}</h3>
            {group.fields.map((field) => (
              <Field key={field.key} field={field} value={settings[field.key]} />
            ))}
          </section>
        ))}
        <p className="settings-drawer__hint">
          Press <kbd>P</kbd> to toggle this panel.
        </p>
      </div>
    </aside>,
    document.body,
  )
}
