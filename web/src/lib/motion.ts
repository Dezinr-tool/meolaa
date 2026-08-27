/**
 * Motion stack for the Meolaa React rebuild.
 * Design reference (static prototype): ../prototype
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
gsap.registerPlugin(SplitText)

export { gsap, ScrollTrigger, SplitText, Lenis }
