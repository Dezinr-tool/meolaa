import * as THREE from 'three'

/**
 * Cauchy's equation: n(λ) = A + B / λ²
 * @param {number} wavelengthNm - Wavelength in nanometers
 * @param {number} [A=1.5]
 * @param {number} [B=0.004] - B in μm²
 * @returns {number} Refractive index
 */
export function cauchyIndex(wavelengthNm, A = 1.5, B = 0.004) {
  const lambdaUm = wavelengthNm / 1000
  return A + B / (lambdaUm * lambdaUm)
}

/**
 * Snell's law in vector form.
 * @param {THREE.Vector3} incidentDir - Normalized incident direction
 * @param {THREE.Vector3} normal - Normalized surface normal (points against the incident ray)
 * @param {number} n1 - Index of the incident medium
 * @param {number} n2 - Index of the transmitting medium
 * @returns {THREE.Vector3 | null} Refracted direction, or null on TIR
 */
export function refract(incidentDir, normal, n1, n2) {
  const eta = n1 / n2
  const cosI = -normal.dot(incidentDir)
  const sinT2 = eta * eta * (1 - cosI * cosI)

  if (sinT2 > 1) return null

  const cosT = Math.sqrt(1 - sinT2)
  return new THREE.Vector3()
    .copy(incidentDir)
    .multiplyScalar(eta)
    .addScaledVector(normal, eta * cosI - cosT)
    .normalize()
}

export const VIBGYOR_WAVELENGTHS = [
  { name: 'violet', hex: '#6F009A', wavelengthNm: 400 },
  { name: 'indigo', hex: '#0028FF', wavelengthNm: 445 },
  { name: 'blue', hex: '#00C0FF', wavelengthNm: 475 },
  { name: 'green', hex: '#00FF00', wavelengthNm: 510 },
  { name: 'yellow', hex: '#E1FF00', wavelengthNm: 570 },
  // Slightly warmer than spectral #FFDF00 so orange reads apart from yellow
  { name: 'orange', hex: '#FF8800', wavelengthNm: 590 },
  { name: 'red', hex: '#F80000', wavelengthNm: 650 },
]
