/**
 * Everything brand-specific, in one place. The product is being renamed, so
 * nothing else in the app should spell out the name, the domain or the
 * contact details — read them from here. Renaming is then an edit to this
 * file plus the logo in components/brand/BrandLogo.tsx.
 *
 * vite.config.ts imports this file too (index.html tokens, robots.txt,
 * sitemap, manifest, security.txt), so keep it free of browser-only code.
 */

/** Marks a value that must be filled in before launch. */
const TODO = 'TODO'

export const BRAND = {
  name: 'GoodViews',
  /** The wordmark is drawn as "{before} [film strip] {after}". */
  wordmark: { before: 'Good', after: 'Views' },
  /** Two letters inside the film-strip monogram. */
  monogram: ['G', 'V'] as const,
  tagline: 'Track the films you watch. Find the next one worth your time.',
  description:
    'Rate and review the films you watch, keep a watchlist, see what your friends loved, and get recommendations built from your own taste.',
  /** No trailing slash. Canonical URLs, the sitemap and share images all use it. */
  siteUrl: 'https://goodviews.online',
  locale: 'en_AU',
  themeColor: '#000a29',
  backgroundColor: '#000a29',
  /** Who runs the site, as shown on the Privacy Policy and Terms. */
  operatorName: TODO,
  /** Public contact address (support, privacy and security reports). */
  contactEmail: TODO,
  /** Where the Terms say disputes are governed, e.g. "New South Wales, Australia". */
  governingLaw: TODO,
  /** 1200×630 share image under public/, e.g. '/og-image.png'. Left out until the new logo exists. */
  ogImage: null as string | null,
} as const

/** True while any launch detail above is still a placeholder. */
export const BRAND_HAS_PLACEHOLDERS = ([BRAND.operatorName, BRAND.contactEmail, BRAND.governingLaw] as string[]).includes(TODO)

/** The bare host, e.g. "goodviews.online". */
export const BRAND_HOST = BRAND.siteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

/** Lowercase, hyphenated name for file names, e.g. "goodviews". */
export const BRAND_SLUG = BRAND.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Where "Contact" links go: the contact email once it's set, otherwise the
 *  contact section of the Privacy Policy. */
export const BRAND_CONTACT_HREF = BRAND.contactEmail.includes('@') ? `mailto:${BRAND.contactEmail}` : '/privacy#contact'

/** An absolute URL on the site for a path like "/privacy". */
export function siteUrl(path = '/'): string {
  return `${BRAND.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}
