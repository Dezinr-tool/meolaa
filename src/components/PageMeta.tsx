import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { getPageMeta } from '../lib/pageMeta'

export function PageMeta() {
  const { pathname } = useLocation()
  const meta = getPageMeta(pathname)

  return (
    <Helmet>
      <html lang="en" />
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  )
}
