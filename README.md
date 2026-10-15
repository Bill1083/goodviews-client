# GoodViews — client

Vite + React + TypeScript + Tailwind. Talks to the Flask API (`goodviews-backend`) and Supabase.

```bash
npm install
npm run dev     # http://localhost:5173 — copy .env.example to .env first
npm run build   # type-check + production build into dist/
```

## Brand, and renaming the product

Nothing outside two files spells out the product's name, domain or contact details:

- `src/config/brand.ts`: name, wordmark text, tagline, description, site URL, theme colour, the
  operator and contact email shown on the Privacy Policy and Terms, governing law, and the share
  image. The build warns while any of these are still `TODO`.
- `src/components/brand/BrandLogo.tsx`: every logo in the app (navbar, sign-in page, poster reel).

To rename:

1. Edit both files above and drop the new 1200×630 share image into `public/` (set `ogImage`).
2. Backend: set `PUBLIC_SITE_URL` and `CORS_ORIGINS` for the new domain.
3. Supabase → Authentication → URL configuration: the new Site URL and redirect URLs.
4. nginx: a server block for the new domain (see below); optionally 301 the old domain to it.

Local-storage keys (e.g. `goodviews-preferences`) keep the old name on purpose: renaming them
would reset everyone's saved preferences.

## SEO and public pages

Signed-out visitors get public pages: the landing page (`/`), About, Privacy Policy, Terms of Use,
and a page per film (`/film/:id-slug`). `src/config/seo.ts` holds their titles and descriptions, and
`src/hooks/usePageMeta.ts` sets title, description, canonical URL, robots and share tags for every
page (signed-in pages are `noindex`).

At build time the `brand` plugin in `vite.config.ts` fills the `%BRAND_*%` tokens in `index.html`
and writes `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.well-known/security.txt` and a
pre-titled copy of each static public page (`dist/about/index.html`, …) for crawlers that don't run
JavaScript. The film pages' sitemap comes from the API (`/api/sitemap/films.xml`).

## Deploying

`deploy/nginx-site.conf` has the website's security headers, the routing that serves the
pre-built pages, and caching rules. Merge it into the site's nginx `server` block on the VPS.
