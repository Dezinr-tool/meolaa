import type { ReactNode } from 'react'
import { SiteNav } from '../SiteNav'
import { SiteFooter } from '../home/SiteFooter'
import { SmoothScroll } from '../SmoothScroll'
import { InnerNavScroll } from './InnerNavScroll'
import { InnerPageAnimations } from './InnerPageAnimations'
import '../../styles/inner-pages.css'

type PageLayoutProps = {
  children: ReactNode
  /** Root page class, e.g. page-editorial, page-lab */
  pageClass?: string
  /** Dark hero — nav starts light-on-dark until scroll */
  navOverDark?: boolean
}

export function PageLayout({
  children,
  pageClass = 'page-editorial',
  navOverDark = false,
}: PageLayoutProps) {
  return (
    <SmoothScroll>
      <div className={`app app--inner ${pageClass}`}>
        <InnerNavScroll />
        <SiteNav variant="inner" navOverDark={navOverDark} />
        <main>{children}</main>
        <SiteFooter simple />
        <InnerPageAnimations />
      </div>
    </SmoothScroll>
  )
}
