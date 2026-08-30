/**
 * Motion stack for the Meolaa React rebuild.
 * Design reference (static prototype): ../prototype
 */
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin)

export { gsap, ScrollTrigger, Draggable, InertiaPlugin, Lenis }
