import pageMetaJson from '../data/pageMeta.json'

export type PageMetaEntry = {
  title: string
  description: string
}

/** Per-route document metadata for independent pages. */
export const PAGE_META = pageMetaJson as Record<string, PageMetaEntry>

export const PRERENDER_ROUTES = Object.keys(PAGE_META)

export function getPageMeta(pathname: string): PageMetaEntry {
  return PAGE_META[pathname] ?? PAGE_META['/']
}
