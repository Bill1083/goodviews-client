/**
 * Titles and descriptions for the public pages, and which paths search
 * engines should stay out of. Shared by the runtime hook (hooks/usePageMeta)
 * and the build plugin in vite.config.ts, which bakes the same values into
 * per-page HTML for crawlers and link previews that don't run JavaScript.
 */
import { BRAND } from './brand'

export interface PageMeta {
  /** Shown before the brand name; null for the home page, which leads with the brand. */
  title: string | null
  description: string
}

export const PUBLIC_PAGES = {
  '/': {
    title: null,
    description: BRAND.description,
  },
  '/about': {
    title: 'About',
    description: `What ${BRAND.name} is, why it exists, how it's built, and where its film data comes from.`,
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: `What ${BRAND.name} stores about you, who can see it, and how to delete it.`,
  },
  '/terms': {
    title: 'Terms of Use',
    description: `The rules for using ${BRAND.name}.`,
  },
  '/login': {
    title: 'Log in',
    description: `Log in to ${BRAND.name} to rate, review and keep track of the films you watch.`,
  },
  '/signup': {
    title: 'Sign up',
    description: `Create a free ${BRAND.name} account and start rating the films you watch.`,
  },
} satisfies Record<string, PageMeta>

export type PublicPath = keyof typeof PUBLIC_PAGES

/** Public pages listed in the static sitemap (the film sitemap is served by the API). */
export const SITEMAP_PATHS: PublicPath[] = ['/', '/signup', '/about', '/privacy', '/terms']

/** Public pages that get their own pre-built HTML file at build time. */
export const PREBUILT_PATHS: PublicPath[] = ['/about', '/privacy', '/terms', '/login', '/signup']

/**
 * Signed-in and account-flow pages: kept out of search results (robots.txt
 * Disallow, and noindex on the page itself). Prefix match.
 */
export const PRIVATE_PATH_PREFIXES = [
  '/discover/',
  '/my-movies',
  '/profile',
  '/settings',
  '/u/',
  '/wrapped/',
  '/onboarding',
  '/mfa-challenge',
  '/forgot-password',
  '/reset-password',
]

/** "Privacy Policy · GoodViews", or "GoodViews — {tagline}" for the home page. */
export function documentTitle(title: string | null): string {
  return title ? `${title} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`
}
