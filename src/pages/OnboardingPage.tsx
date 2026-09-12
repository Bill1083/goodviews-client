import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { updateProfile } from '../services/apiClient'
import GenreStep from '../features/onboarding/GenreStep'
import RateMoviesStep from '../features/onboarding/RateMoviesStep'
import FavouritesStep from '../features/onboarding/FavouritesStep'

const STEP_LABELS = ['Genres', 'Quick Ratings', 'Favourites'] as const

export default function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setHasOnboarded = useAuthStore((s) => s.setHasOnboarded)
  const [step, setStep] = useState(0)
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([])
  const [lovedMovieIds, setLovedMovieIds] = useState<number[]>([])
  const [finishing, setFinishing] = useState(false)

  // Someone with no session at all shouldn't land here — send them to log in properly.
  if (!user) return <Navigate to="/auth" replace />

  const finish = async () => {
    setFinishing(true)
    try {
      await updateProfile({ has_onboarded: true, onboarding_genre_ids: selectedGenreIds })
    } finally {
      // Fail open even if the save errored — the aim is a good first
      // impression, not a hard gate the user can get stuck behind.
      setHasOnboarded(true)
      navigate('/')
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="panel-card dialog-scale-in flex w-full flex-col gap-6 p-6 sm:p-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={['h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-teal' : 'bg-white/10'].join(' ')} />
            ))}
          </div>
          <h1 className="text-lg font-semibold text-gray-lighter">Welcome to GoodViews</h1>
          <p className="mt-1 text-sm text-gray-muted">
            A few quick steps so "For You" can start recommending movies you'll actually like.
          </p>
        </div>

        {step === 0 && (
          <GenreStep selectedGenreIds={selectedGenreIds} onChange={setSelectedGenreIds} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <RateMoviesStep
            onBack={() => setStep(0)}
            onNext={(loved) => {
              setLovedMovieIds(loved)
              setStep(2)
            }}
          />
        )}
        {step === 2 && (
          <FavouritesStep
            genreIds={selectedGenreIds}
            movieIds={lovedMovieIds}
            onBack={() => setStep(1)}
            onFinish={finish}
            finishing={finishing}
          />
        )}
      </div>
    </div>
  )
}
