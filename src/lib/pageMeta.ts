export type PageMetaEntry = {
  title: string
  description: string
}

/** Per-route document metadata for independent pages. */
export const PAGE_META: Record<string, PageMetaEntry> = {
  '/': {
    title: 'Meolaa — AI-native house of brands',
    description:
      'Meolaa reads demand signals, builds consumer brands with AI, and runs them on one operating system — from signal to shelf.',
  },
  '/about': {
    title: 'About Us | Meolaa',
    description:
      'The thesis behind Meolaa: signal over opinion, small teams with real ownership, and a system that builds and runs brands end to end.',
  },
  '/story': {
    title: 'Our Story | Meolaa',
    description:
      'How Meolaa got built — from reading demand before it peaks to proving the system works across live and pipeline brands.',
  },
  '/lab': {
    title: 'Meolaa Lab | Meolaa',
    description:
      'Inside the Meolaa Lab: four capabilities in one loop — reading demand, product & brand, go-to-market, and distribution & ops.',
  },
  '/press': {
    title: 'Press & Media | Meolaa',
    description:
      'Press releases, announcements, and media kit downloads from Meolaa — the AI-native house of brands.',
  },
  '/partners': {
    title: 'Partners | Meolaa',
    description:
      'Investors, manufacturers, distributors, and brand collaborators building with Meolaa on one shared operating system.',
  },
  '/careers': {
    title: 'Careers | Meolaa',
    description:
      'Join a small team with real ownership. Open roles across intelligence, brand build, and growth at Meolaa.',
  },
  '/contact': {
    title: 'Contact | Meolaa',
    description:
      'Get in touch with Meolaa — general inquiries, press, careers, and investor or partnership conversations.',
  },
}

export const PRERENDER_ROUTES = Object.keys(PAGE_META)

export function getPageMeta(pathname: string): PageMetaEntry {
  return PAGE_META[pathname] ?? PAGE_META['/']
}
