import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import PrimaryButton from '../components/PrimaryButton'

export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-4 py-20 text-center">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <span className="rounded-full border border-teal/30 bg-teal/10 px-4 py-1 text-xs font-medium text-teal tracking-wider uppercase">
          Social Movie Tracking
        </span>

        <h1 className="text-4xl font-bold leading-tight text-gray-light sm:text-5xl">
          Your movies.
          <br />
          <span className="text-teal">Your circle.</span>
        </h1>

        <p className="max-w-md text-base text-gray-muted leading-relaxed">
          Search for any film, log your rating, write your take, and share
          recommendations with the exact friends who care.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <>
            <PrimaryButton onClick={() => navigate('/search')}>
              Search Movies
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => navigate('/profile')}>
              My Profile
            </PrimaryButton>
          </>
        ) : (
          <>
            <PrimaryButton onClick={() => navigate('/register')}>
              Get Started — It&apos;s Free
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => navigate('/login')}>
              Sign In
            </PrimaryButton>
          </>
        )}
      </div>

      {/* Feature grid */}
      <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: '🎬',
            title: 'Search & Log',
            desc: 'Find any movie via TMDB and add it to your library with a star rating.',
          },
          {
            icon: '⭐',
            title: 'Rate & Review',
            desc: 'Give films a 1-5 star score and write your own take.',
          },
          {
            icon: '👥',
            title: 'Share with Groups',
            desc: 'Push recommendations to specific friend groups who share your taste.',
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-2 rounded-card border border-purple/20 bg-navy p-5"
          >
            <span className="text-3xl">{icon}</span>
            <h3 className="font-semibold text-gray-light">{title}</h3>
            <p className="text-xs text-gray-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
