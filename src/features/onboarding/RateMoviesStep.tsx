import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCuratedOnboardingMovies, createReview } from '../../services/apiClient'
import PrimaryButton from '../../components/PrimaryButton'

const MIN_REACTIONS = 5
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

interface Props {
  onBack: () => void
  onNext: () => void
}

export default function RateMoviesStep({ onBack, onNext }: Props) {
  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['onboarding', 'curated-movies'],
    queryFn: getCuratedOnboardingMovies,
    staleTime: Infinity,
  })
  const [index, setIndex] = useState(0)
  const [reactionCount, setReactionCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const movie = movies[index]
  const atEnd = !isLoading && index >= movies.length
  const canSkipAhead = atEnd || movies.length === 0

  const react = async (rating: 5 | 1 | null) => {
    if (!movie) return
    setSubmitting(true)
    try {
      if (rating !== null) {
        // A real review row — the user just confirmed they've seen it, so it
        // showing up under "Movies I've Watched" afterward is intentional.
        await createReview({
          movie_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          genre_ids: movie.genre_ids,
          vote_average: movie.vote_average,
          rating,
          review_text: '',
        })
        setReactionCount((c) => c + 1)
      }
      setIndex((i) => i + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-lighter">
        Quick ratings — loved or hated any of these? ({Math.min(reactionCount, MIN_REACTIONS)}/{MIN_REACTIONS})
      </p>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      ) : !movie ? (
        <p className="py-8 text-center text-sm text-gray-muted">
          {movies.length === 0
            ? "Couldn't load movies right now — that's okay, you can skip this."
            : "That's all of them — thanks!"}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 overflow-hidden rounded-lg border border-white/10 shadow-lg sm:w-36">
            <div className="aspect-[2/3] w-full bg-navy-card">
              {movie.poster_path && (
                <img
                  src={`${TMDB_IMG}${movie.poster_path}`}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>
          <p className="text-center text-sm font-semibold text-gray-lighter">{movie.title}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => react(5)}
              className="rounded-full border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-medium text-teal-light transition-colors hover:bg-teal/20 disabled:opacity-50"
            >
              Loved it
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => react(1)}
              className="rounded-full border border-pink-brand/40 bg-pink-brand/10 px-4 py-2 text-sm font-medium text-pink-brand transition-colors hover:bg-pink-brand/20 disabled:opacity-50"
            >
              Hated it
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => react(null)}
              className="rounded-full border border-white/15 bg-navy-card/40 px-4 py-2 text-sm font-medium text-gray-muted transition-colors hover:border-white/30 hover:text-gray-lighter disabled:opacity-50"
            >
              Haven't seen it
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-sm text-gray-muted hover:text-gray-lighter">
          Back
        </button>
        <PrimaryButton onClick={onNext} disabled={reactionCount < MIN_REACTIONS && !canSkipAhead}>
          Next
        </PrimaryButton>
      </div>
    </div>
  )
}
