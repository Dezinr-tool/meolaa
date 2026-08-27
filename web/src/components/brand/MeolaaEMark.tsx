/**
 * Meolaa “E” arrow mark — the distinctive letter from the wordmark.
 * Source path: public/brand/logo.svg (letter E).
 */
import type { SVGProps } from 'react'

/** Tight crop around the E arrow bars. */
const VIEWBOX = '645 430 150 220'

const E_PATH =
  'M733.06,437.35l-71.52,70.5-.21.22c-5.71,6.29-12.39,15.1-13.42,27.49-1.72,20.77,12.56,35.64,26.34,49.13,11.48,11.24,50.6,50.27,58.8,58.41h50.1s-73.44-74.47-85.13-85.76h76.76v-34.22h-77.39l85.76-85.76h-50.09Z'

type MeolaaEMarkProps = SVGProps<SVGSVGElement>

export function MeolaaEMark({ className, ...rest }: MeolaaEMarkProps) {
  return (
    <svg
      className={className}
      viewBox={VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Meolaa"
      {...rest}
    >
      <path d={E_PATH} />
    </svg>
  )
}
