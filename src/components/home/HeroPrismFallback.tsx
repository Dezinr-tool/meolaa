/** Static SVG fallback while WebGL loads or when unavailable. */
export function HeroPrismFallback() {
  return (
    <svg
      className="hero-prism__svg"
      viewBox="0 0 80 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="hero-prism-clip">
          <polygon points="40,3 3,67 77,67" />
        </clipPath>

        <linearGradient
          id="hero-prism-rainbow"
          x1="40"
          y1="8"
          x2="40"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.95" />
          <stop offset="18%" stopColor="#ffb347" stopOpacity="0.9" />
          <stop offset="36%" stopColor="#fff06a" stopOpacity="0.85" />
          <stop offset="54%" stopColor="#6bffb8" stopOpacity="0.8" />
          <stop offset="72%" stopColor="#5ec8ff" stopOpacity="0.85" />
          <stop offset="90%" stopColor="#b388ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff4d6d" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient
          id="hero-prism-glass"
          x1="40"
          y1="3"
          x2="40"
          y2="67"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
        </linearGradient>

        <linearGradient
          id="hero-prism-edge-glow"
          x1="12"
          y1="18"
          x2="68"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <g clipPath="url(#hero-prism-clip)">
        <rect
          className="hero-prism__rainbow"
          x="0"
          y="0"
          width="80"
          height="70"
          fill="url(#hero-prism-rainbow)"
        />
        <rect x="0" y="0" width="80" height="70" fill="url(#hero-prism-glass)" />
        <rect
          x="0"
          y="0"
          width="80"
          height="70"
          fill="url(#hero-prism-edge-glow)"
          opacity="0.65"
        />
      </g>

      <polygon
        className="hero-prism__outline"
        points="40,3 3,67 77,67"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
