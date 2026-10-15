import { useEffect } from 'react'
import { BRAND, siteUrl } from '../config/brand'
import { documentTitle } from '../config/seo'

export interface PageMetaOptions {
  /** Shown before the brand name; null for the home page. */
  title: string | null
  description?: string
  /** Canonical path; defaults to the current pathname (no query string). */
  path?: string
  /** Keep the page out of search results (signed-in and account-flow pages). */
  noindex?: boolean
  /** Absolute URL of a share image for this page. */
  image?: string | null
  ogType?: 'website' | 'video.movie'
  /** Page-specific structured data, alongside the site-wide block in index.html. */
  jsonLd?: Record<string, unknown> | null
}

const PAGE_JSON_LD_ID = 'page-jsonld'

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

function setJsonLd(data: Record<string, unknown> | null) {
  document.getElementById(PAGE_JSON_LD_ID)?.remove()
  if (!data) return
  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.id = PAGE_JSON_LD_ID
  el.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
  document.head.appendChild(el)
}

function apply(options: PageMetaOptions) {
  const title = documentTitle(options.title)
  const description = options.description ?? BRAND.description
  const url = siteUrl(options.path ?? window.location.pathname)
  const image = options.image ?? (BRAND.ogImage ? siteUrl(BRAND.ogImage) : null)

  document.title = title
  setCanonical(url)
  setMeta('name', 'description', description)
  setMeta('name', 'robots', options.noindex ? 'noindex, nofollow' : 'index, follow')
  setMeta('property', 'og:type', options.ogType ?? 'website')
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:image', image)
  setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', image)
  setJsonLd(options.jsonLd ?? null)
}

/**
 * Sets the document title, description, canonical URL, robots and share tags
 * for the current page, and puts the home-page defaults back when the page
 * unmounts. Every routed page calls it once.
 */
export function usePageMeta(options: PageMetaOptions) {
  const key = JSON.stringify(options)
  useEffect(() => {
    apply(JSON.parse(key) as PageMetaOptions)
    return () => apply({ title: null, path: '/' })
  }, [key])
}
