/**
 * Motion stack for the Meolaa React rebuild.
 * Design reference (static prototype): ../prototype
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger, Lenis }
