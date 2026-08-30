import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  getPrismSettings,
  prismSettingsJson,
  resetPrismSettings,
  setPrismSettings,
  subscribePrismSettings,
  type HeroPrismSettings,
} from './heroPrismSettings'
import './HeroPrismDebugPanel.css'

type Field = {
  key: keyof HeroPrismSettings
  label: string
  min: number
  max: number
  step: number
}

type Section = { title: string; fields: Field[] }

const SECTIONS: Section[] = [
  {
    title: 'Pyramid',
    fields: [
      { key: 'baseSide', label: 'Base side', min: 0.8, max: 3, step: 0.01 },
      { key: 'height', label: 'Height', min: 0.6, max: 2.8, step: 0.01 },
      { key: 'rotX', label: 'Rot X', min: -1.5, max: 1.5, step: 0.01 },
      { key: 'rotY', label: 'Rot Y', min: -2, max: 2, step: 0.01 },
      { key: 'rotZ', label: 'Rot Z', min: -1.5, max: 1.5, step: 0.01 },
      { key: 'posY', label: 'Pos Y', min: -0.5, max: 0.5, step: 0.01 },
      { key: 'idleAmount', label: 'Idle amount', min: 0, max: 0.12, step: 0.005 },
    ],
  },
  {
    title: 'Glass',
    fields: [
      { key: 'roughness', label: 'Roughness', min: 0, max: 0.5, step: 0.005 },
      { key: 'thickness', label: 'Thickness', min: 0.1, max: 2, step: 0.01 },
      { key: 'ior', label: 'IOR', min: 1.1, max: 2.2, step: 0.01 },
      {
        key: 'chromaticAberration',
        label: 'Chromatic aberr.',
        min: 0,
        max: 1.2,
        step: 0.01,
      },
      { key: 'envMapIntensity', label: 'Env intensity', min: 0, max: 3, step: 0.05 },
      { key: 'reflectivity', label: 'Reflectivity', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: 'White beam',
    fields: [
      { key: 'beamEntryX', label: 'Entry X', min: -2.5, max: 1, step: 0.01 },
      { key: 'beamEntryY', label: 'Entry Y', min: -0.6, max: 0.6, step: 0.01 },
      { key: 'beamLength', label: 'Length', min: 1, max: 7, step: 0.05 },
      { key: 'beamWidth', label: 'Width', min: 0.04, max: 0.4, step: 0.01 },
      { key: 'beamOpacity', label: 'Opacity', min: 0, max: 1.5, step: 0.01 },
      { key: 'beamAngle', label: 'Angle', min: -0.4, max: 0.4, step: 0.01 },
    ],
  },
  {
    title: 'Spectrum ribbon',
    fields: [
      { key: 'spectrumExitX', label: 'Exit X', min: 0, max: 2, step: 0.01 },
      { key: 'spectrumExitY', label: 'Exit Y', min: -0.5, max: 1, step: 0.01 },
      { key: 'spectrumLength', label: 'Length', min: 1, max: 7, step: 0.05 },
      { key: 'spectrumWidth', label: 'Width', min: 0.1, max: 1.2, step: 0.01 },
      { key: 'spectrumAngle', label: 'Angle', min: 0, max: 1.2, step: 0.01 },
      { key: 'spectrumSpread', label: 'Spread Y', min: 0, max: 0.12, step: 0.001 },
      { key: 'spectrumFan', label: 'Fan', min: 0, max: 0.25, step: 0.005 },
      { key: 'spectrumOpacity', label: 'Opacity', min: 0, max: 1.5, step: 0.01 },
      { key: 'spectrumLayers', label: 'Layers', min: 5, max: 16, step: 1 },
    ],
  },
  {
    title: 'Edges',
    fields: [
      { key: 'edgeCyanOpacity', label: 'Cyan', min: 0, max: 1, step: 0.01 },
      { key: 'edgeWhiteOpacity', label: 'White', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: 'Camera',
    fields: [
      { key: 'camX', label: 'Cam X', min: -2, max: 2, step: 0.05 },
      { key: 'camY', label: 'Cam Y', min: -1, max: 2, step: 0.05 },
      { key: 'camZ', label: 'Cam Z', min: 2, max: 8, step: 0.05 },
      { key: 'camFov', label: 'FOV', min: 20, max: 50, step: 0.5 },
      { key: 'lookX', label: 'Look X', min: -1, max: 1, step: 0.01 },
      { key: 'lookY', label: 'Look Y', min: -1, max: 1, step: 0.01 },
      { key: 'lookZ', label: 'Look Z', min: -1, max: 1, step: 0.01 },
    ],
  },
]

function usePrismSettings() {
  return useSyncExternalStore(subscribePrismSettings, getPrismSettings, getPrismSettings)
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '')
}

/** Press P to toggle. Copy JSON → paste back in chat for exact values. */
export function HeroPrismDebugPanel() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const settings = usePrismSettings()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  const copy = async () => {
    const json = prismSettingsJson()
    try {
      await navigator.clipboard.writeText(json)
      setToast('Copied — paste this JSON in chat')
    } catch {
      setToast('Copy failed — select values manually')
    }
    window.setTimeout(() => setToast(null), 2200)
  }

  return (
    <aside className="prism-debug" role="dialog" aria-label="Prism settings">
      <div className="prism-debug__head">
        <div>
          <div className="prism-debug__title">Prism settings</div>
          <div className="prism-debug__hint">Press P to close · Copy JSON for exact values</div>
        </div>
      </div>

      <div className="prism-debug__actions">
        <button type="button" className="prism-debug__btn prism-debug__btn--primary" onClick={copy}>
          Copy JSON
        </button>
        <button type="button" className="prism-debug__btn" onClick={() => resetPrismSettings()}>
          Reset
        </button>
        <button type="button" className="prism-debug__btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="prism-debug__section">
          <div className="prism-debug__section-title">{section.title}</div>
          {section.fields.map((field) => {
            const value = settings[field.key]
            return (
              <label key={field.key} className="prism-debug__row">
                <span className="prism-debug__label">{field.label}</span>
                <span className="prism-debug__value">{fmt(value)}</span>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={value}
                  onChange={(e) =>
                    setPrismSettings({
                      [field.key]: Number(e.target.value),
                    } as Partial<HeroPrismSettings>)
                  }
                />
              </label>
            )
          })}
        </div>
      ))}

      {toast && <div className="prism-debug__toast">{toast}</div>}
      <pre
        style={{
          marginTop: 10,
          padding: 8,
          fontSize: 10,
          maxHeight: 120,
          overflow: 'auto',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {JSON.stringify(settings, null, 2)}
      </pre>
    </aside>
  )
}
