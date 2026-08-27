/**
 * Brand asset paths + token helpers.
 * CSS tokens in src/styles/tokens.css remain source of truth.
 * Guidelines: docs/Meolaa_Brand_Guidelines.pdf
 */
export const brandPaths = {
  /** Planet Blue wordmark — default for white / ecru (guidelines prefer this) */
  logo: '/brand/logo-planet.png',
  /** Same cropped Planet Blue mark */
  logoDark: '/brand/logo-planet.png',
  /** Black cropped wordmark fallback */
  logoBlack: '/brand/logo-dark.png',
  /** Ecru / cream wordmark — Planet Blue / dark backgrounds */
  logoWhite: '/brand/logo-white.png',
  /** Vector mark from Downloads (SVG) */
  logoSvg: '/brand/logo.svg',
} as const

export const fonts = {
  display: 'var(--font-display)',
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
} as const

/** Named palette from Brand Guidelines p.14–15 */
export const colors = {
  planetBlue: '#002f3a',
  joyousYellow: '#fdf28c',
  /** Semantic secondary — pale creamy yellow (swatch-sampled) */
  secondary: '#fef8c0',
  ecru: '#f8ece4',
  white: '#ffffff',
  lilac: '#a8a3e3',
  lilacDeep: '#5656ad',
  ecruDeep: '#f0d5cc',
  sustainableGreen: '#41857a',
} as const
