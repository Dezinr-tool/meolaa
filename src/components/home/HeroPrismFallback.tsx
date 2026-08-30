/** Exact reference cutout when WebGL is unavailable or still loading. */
export function HeroPrismFallback() {
  return (
    <img
      className="hero-prism__img"
      src="/assets/hero-prism.webp"
      srcSet="/assets/hero-prism.webp 1x, /assets/hero-prism.png 2x"
      alt=""
      draggable={false}
      decoding="async"
    />
  )
}
