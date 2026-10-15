import { Link } from 'react-router-dom'
import InfoPage, { BrandDetail, ExternalLink, InfoSection } from '../components/public/InfoPage'
import { BRAND } from '../config/brand'
import { PUBLIC_PAGES } from '../config/seo'
import { usePageMeta } from '../hooks/usePageMeta'

const LAST_UPDATED = '15 October 2026'

const linkClass = 'text-teal underline decoration-teal/40 underline-offset-2 hover:text-teal/80'

export default function TermsPage() {
  usePageMeta(PUBLIC_PAGES['/terms'])

  const contact = BRAND.contactEmail.includes('@') ? (
    <a href={`mailto:${BRAND.contactEmail}`} className={linkClass}>{BRAND.contactEmail}</a>
  ) : (
    <BrandDetail value={BRAND.contactEmail} label="contact email" />
  )

  return (
    <InfoPage title="Terms of Use" intro={<>Last updated {LAST_UPDATED}.</>}>
      <InfoSection heading="Agreeing to these terms">
        <p>
          {BRAND.name} is run by <BrandDetail value={BRAND.operatorName} label="operator name" />. By creating
          an account or using the site you agree to these terms and to the{' '}
          <Link to="/privacy" className={linkClass}>Privacy Policy</Link>. If you don't agree, please don't use{' '}
          {BRAND.name}.
        </p>
      </InfoSection>

      <InfoSection heading="Your account">
        <p>
          You need to be at least 13 to create an account. Give a real email address, keep your password to
          yourself, and let us know if you think someone else has got into your account. An account is for
          one person; you're responsible for what's done with it.
        </p>
      </InfoSection>

      <InfoSection heading="What you post">
        <p>
          Your ratings, reviews and other content stay yours. You give us permission to store them and to
          show them to the people your settings allow, and to include your ratings in anonymous totals on
          public film pages. You can delete them, or your whole account, at any time.
        </p>
        <p>You're responsible for what you post, and it mustn't break the law or anyone else's rights.</p>
      </InfoSection>

      <InfoSection heading="Fair use">
        <p>Please don't:</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-teal/70">
          <li>post anything unlawful, hateful, harassing, sexually explicit or that invades someone's privacy;</li>
          <li>pretend to be someone else, or spam other members;</li>
          <li>scrape the site, or access it with bots or scripts other than an ordinary browser;</li>
          <li>try to get around security, rate limits or other people's privacy settings;</li>
          <li>do anything that disrupts the service for others.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Film information">
        <p>
          Film details and images come from{' '}
          <ExternalLink href="https://www.themoviedb.org/">The Movie Database (TMDB)</ExternalLink>. {BRAND.name}{' '}
          uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability changes often
          and may be out of date — check with the service before you rely on it.
        </p>
      </InfoSection>

      <InfoSection heading="The service">
        <p>
          {BRAND.name} is free. We work hard to keep it running and accurate, but it's provided as it is: we
          may change, pause or remove features, and we can't promise it will always be available or
          error-free.
        </p>
      </InfoSection>

      <InfoSection heading="Ending things">
        <p>
          You can delete your account at any time in Settings. We may suspend or close an account that
          breaks these terms, or if we have to for legal reasons.
        </p>
      </InfoSection>

      <InfoSection heading="Liability">
        <p>
          Nothing in these terms takes away rights you have under consumer law that can't be excluded,
          including the Australian Consumer Law. Apart from those, and as far as the law allows, we aren't
          liable for indirect or consequential loss, or for loss of data, arising from your use of{' '}
          {BRAND.name}.
        </p>
      </InfoSection>

      <InfoSection heading="Changes and governing law">
        <p>
          We may update these terms; the new version will be posted here with a new date, and continuing to
          use {BRAND.name} after that means you accept it. These terms are governed by the laws of{' '}
          <BrandDetail value={BRAND.governingLaw} label="governing law" />.
        </p>
      </InfoSection>

      <InfoSection heading="Contact">
        <p>Questions about these terms: {contact}.</p>
      </InfoSection>
    </InfoPage>
  )
}
