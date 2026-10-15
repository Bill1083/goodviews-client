import InfoPage, { BrandDetail, ExternalLink, InfoSection } from '../components/public/InfoPage'
import { BRAND } from '../config/brand'
import { PUBLIC_PAGES } from '../config/seo'
import { usePageMeta } from '../hooks/usePageMeta'

const LAST_UPDATED = '15 October 2026'

function ContactEmail() {
  if (!BRAND.contactEmail.includes('@')) return <BrandDetail value={BRAND.contactEmail} label="contact email" />
  return (
    <a href={`mailto:${BRAND.contactEmail}`} className="text-teal underline decoration-teal/40 underline-offset-2 hover:text-teal/80">
      {BRAND.contactEmail}
    </a>
  )
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-teal/70">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default function PrivacyPage() {
  usePageMeta(PUBLIC_PAGES['/privacy'])

  return (
    <InfoPage title="Privacy Policy" intro={<>Last updated {LAST_UPDATED}.</>}>
      <InfoSection heading="The short version">
        <p>
          {BRAND.name} stores what you need it to store to track your films and share them with your
          friends, and nothing more. There are no ads, no advertising or analytics trackers, and your
          data is never sold or rented to anyone. You decide who sees your profile, and you can delete
          your account and everything in it at any time.
        </p>
      </InfoSection>

      <InfoSection heading="Who runs it">
        <p>
          {BRAND.name} is run by <BrandDetail value={BRAND.operatorName} label="operator name" />. Questions
          about this policy or your data go to <ContactEmail />.
        </p>
      </InfoSection>

      <InfoSection heading="What we collect">
        <List
          items={[
            <>
              <strong className="text-gray-lighter">Your account:</strong> email address, username and password.
              The password is stored only as a secure hash by our sign-in provider, Supabase, never in plain
              text. If you turn on two-factor authentication, its settings are stored too.
            </>,
            <>
              <strong className="text-gray-lighter">Your profile:</strong> bio, avatar choice, privacy settings,
              the genres you picked when you joined, and the streaming services you tell us you use.
            </>,
            <>
              <strong className="text-gray-lighter">What you do in the app:</strong> films you rate and review
              (rating, written review, rewatches, your own categories), your watchlist, favourite actors and
              directors, friends, friend requests and friend groups, films you recommend to friends, and films
              you mark as not interested.
            </>,
            <>
              <strong className="text-gray-lighter">What we work out from that:</strong> your recommendations
              (For You, Movies of the Day), your taste statistics and your year-end Wrapped.
            </>,
            <>
              <strong className="text-gray-lighter">Technical details:</strong> your IP address and basic request
              details, used for security and rate limiting, and the devices you choose to trust for two-factor
              sign-in.
            </>,
          ]}
        />
      </InfoSection>

      <InfoSection heading="How we use it">
        <p>
          To run {BRAND.name}: keeping your film history, showing your friends what you've chosen to share,
          working out recommendations and statistics, keeping accounts secure, and sending the emails an
          account needs (confirming your address, resetting a password). We don't use your data for
          advertising, we don't build profiles of you for anyone else, and we don't sell it.
        </p>
      </InfoSection>

      <InfoSection heading="Who can see what">
        <List
          items={[
            'Your profile setting decides who can open your profile: everyone, friends only, or no one. You can also hide your friends list.',
            'Your friends can see your ratings and reviews of films they look at, and anyone you send a recommendation to sees it.',
            `Public film pages show only totals: how many ${BRAND.name} members rated a film and the average rating, and only once at least three people have rated it. They never show who rated it.`,
          ]}
        />
      </InfoSection>

      <InfoSection heading="Services we rely on">
        <List
          items={[
            <>
              <ExternalLink href="https://supabase.com/privacy">Supabase</ExternalLink> hosts the database and
              handles sign-in and account emails.
            </>,
            `${BRAND.name}'s own server runs the app's API and a short-lived cache.`,
            <>
              <ExternalLink href="https://www.themoviedb.org/privacy-policy">The Movie Database (TMDB)</ExternalLink>{' '}
              provides film information. Posters and photos load straight from TMDB's servers, so TMDB sees your
              IP address when your browser fetches them.
            </>,
            <>
              <ExternalLink href="https://policies.google.com/privacy">Google Fonts</ExternalLink> serves the
              site's typeface, so Google sees your IP address when it loads.
            </>,
          ]}
        />
      </InfoSection>

      <InfoSection heading="Cookies and browser storage">
        <p>
          We don't use advertising or tracking cookies. Your browser's local storage keeps your sign-in
          session, a "trusted device" token if you choose to skip two-factor sign-in on that device, your
          display preferences, and small flags such as whether you've already watched this year's Wrapped.
          Clearing this site's data in your browser signs you out and resets those preferences.
        </p>
      </InfoSection>

      <InfoSection heading="Keeping and deleting your data">
        <p>
          We keep your data for as long as you have an account. You can delete your account in Settings at
          any time: that permanently deletes the account and everything linked to it (ratings, reviews,
          watchlist, friends, recommendations and statistics). Copies in our providers' backups expire on
          their normal schedule.
        </p>
      </InfoSection>

      <InfoSection heading="Your rights">
        <p>
          You can see and correct almost everything we hold about you in the app itself. Depending on where
          you live (for example under Australia's Privacy Act or the EU and UK GDPR) you can also ask for a
          copy of your data, ask us to correct or delete it, or object to how it's used. Email <ContactEmail />{' '}
          and we'll respond within 30 days. If you're not happy with the answer, you can complain to your
          local privacy regulator — in Australia, the{' '}
          <ExternalLink href="https://www.oaic.gov.au/">Office of the Australian Information Commissioner</ExternalLink>.
        </p>
      </InfoSection>

      <InfoSection heading="Children">
        <p>{BRAND.name} isn't meant for children under 13, and they shouldn't create an account.</p>
      </InfoSection>

      <InfoSection heading="Changes to this policy">
        <p>
          If this policy changes, the new version will be posted here with a new date. If a change affects
          how your existing data is used, we'll tell you in the app first.
        </p>
      </InfoSection>

      <InfoSection id="contact" heading="Contact">
        <p>
          For anything about your privacy or this policy, including reporting a security problem, email{' '}
          <ContactEmail />.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
