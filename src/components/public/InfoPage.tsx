import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import PublicHeader from './PublicHeader'
import PublicFooter from './PublicFooter'

/** Layout for the text pages (About, Privacy Policy, Terms of Use). */
export default function InfoPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  const { hash } = useLocation()

  // The app scrolls to the top on every route change, so a link to a section
  // (e.g. /privacy#contact) has to scroll there itself.
  useEffect(() => {
    if (!hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <div>
          <h1 style={{ fontFamily: '"Source Sans 3", sans-serif' }} className="text-3xl font-bold text-gray-lighter sm:text-4xl">
            {title}
          </h1>
          {intro && <div className="mt-3 text-sm leading-relaxed text-gray-medium">{intro}</div>}
        </div>
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}

export function InfoSection({ id, heading, children }: { id?: string; heading: string; children: ReactNode }) {
  return (
    <section id={id} className="panel-card scroll-mt-24 p-5 sm:p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal">{heading}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-gray-light/90">{children}</div>
    </section>
  )
}

/** A launch detail from BRAND (operator, contact, governing law). Until it is
 *  filled in it renders as an obvious highlighted placeholder, so an
 *  unfinished policy can't pass for a finished one. */
export function BrandDetail({ value, label }: { value: string; label: string }) {
  if (value !== 'TODO') return <>{value}</>
  return <mark className="rounded bg-magenta/20 px-1 text-magenta">[{label} — to be added]</mark>
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal underline decoration-teal/40 underline-offset-2 hover:text-teal/80"
    >
      {children}
    </a>
  )
}
