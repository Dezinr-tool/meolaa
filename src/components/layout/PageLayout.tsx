import type { ReactNode } from 'react'
import { SiteNav } from '../SiteNav'
import { SiteFooter } from '../home/SiteFooter'
import { InnerNavScroll } from './InnerNavScroll'
import { InnerPageAnimations } from './InnerPageAnimations'
import '../../styles/inner-pages.css'

type PageLayoutProps = {
  children: ReactNode
  /** Root page class, e.g. page-editorial, page-lab */
  pageClass?: string
  /** Dark hero — nav starts light-on-dark until scroll */
  navOverDark?: boolean
  /** Inner pages render the flat footer by default. Pass false to use the
   *  same animated/full footer as the home page (About Us only, per request —
   *  every other inner page must keep the flat one). */
  footerSimple?: boolean
}

export function PageLayout({
  children,
  pageClass = 'page-editorial',
  navOverDark = false,
  footerSimple = true,
}: PageLayoutProps) {
  return (
    <div className={`app app--inner ${pageClass}`}>
      <InnerNavScroll />
      <SiteNav variant="inner" navOverDark={navOverDark} />
      <main>{children}</main>
      <SiteFooter simple={footerSimple} />
      <InnerPageAnimations />
    </div>
  )
}
