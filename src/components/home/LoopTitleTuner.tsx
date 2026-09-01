/**
 * Dev-only tuning panel for the Loop title — letter-spacing, line-height,
 * outline width. Live-writes CSS vars onto `.loop` so you can drag to a
 * value, read it off the panel, and hand the three numbers back to bake
 * in as the CSS defaults. Only mounts with `?tune` in the URL.
 */
import { useEffect, useState, type CSSProperties } from 'react'

const DEFAULTS = {
  ls: -2, // letter-spacing, px
  lh: 0.95, // line-height, unitless
  ow: 1.75, // outline width, px
}

function hasTuneFlag() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('tune')
}

export function LoopTitleTuner() {
  const [enabled, setEnabled] = useState(false)
  const [ls, setLs] = useState(DEFAULTS.ls)
  const [lh, setLh] = useState(DEFAULTS.lh)
  const [ow, setOw] = useState(DEFAULTS.ow)

  useEffect(() => {
    setEnabled(hasTuneFlag())
  }, [])

  useEffect(() => {
    if (!enabled) return
    const el = document.querySelector('.loop') as HTMLElement | null
    if (!el) return
    el.style.setProperty('--loop-title-ls', `${ls}px`)
    el.style.setProperty('--loop-title-lh', `${lh}`)
    el.style.setProperty('--loop-title-outline-w', `${ow}px`)
  }, [enabled, ls, lh, ow])

  if (!enabled) return null

  return (
    <div style={panelStyle}>
      <strong style={{ display: 'block', marginBottom: 10 }}>
        Loop title tuner
      </strong>

      <label style={rowStyle}>
        <span style={labelRowStyle}>
          Letter spacing<span style={valueStyle}>{ls}px</span>
        </span>
        <input
          type="range"
          min={-4}
          max={12}
          step={0.5}
          value={ls}
          onChange={(e) => setLs(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </label>

      <label style={rowStyle}>
        <span style={labelRowStyle}>
          Line height<span style={valueStyle}>{lh.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0.8}
          max={1.6}
          step={0.01}
          value={lh}
          onChange={(e) => setLh(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </label>

      <label style={rowStyle}>
        <span style={labelRowStyle}>
          Outline width<span style={valueStyle}>{ow}px</span>
        </span>
        <input
          type="range"
          min={0}
          max={6}
          step={0.25}
          value={ow}
          onChange={(e) => setOw(parseFloat(e.target.value))}
          style={sliderStyle}
        />
      </label>

      <button
        type="button"
        onClick={() => {
          setLs(DEFAULTS.ls)
          setLh(DEFAULTS.lh)
          setOw(DEFAULTS.ow)
        }}
        style={resetBtnStyle}
      >
        Reset
      </button>
    </div>
  )
}

const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 9999,
  background: 'rgba(20, 20, 20, 0.92)',
  color: '#fff',
  padding: '14px 16px',
  borderRadius: 10,
  fontFamily: 'monospace',
  fontSize: 12,
  width: 230,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
}

const rowStyle: CSSProperties = {
  display: 'block',
  marginBottom: 12,
}

const labelRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 4,
}

const valueStyle: CSSProperties = {
  opacity: 0.7,
}

const sliderStyle: CSSProperties = {
  width: '100%',
}

const resetBtnStyle: CSSProperties = {
  width: '100%',
  padding: '6px 0',
  marginTop: 4,
  background: 'rgba(255, 255, 255, 0.12)',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.24)',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 12,
  cursor: 'pointer',
}
