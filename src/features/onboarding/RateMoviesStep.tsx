import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCuratedOnboardingMovies, createReview } from '../../services/apiClient'
import RatingSlider from '../../components/RatingSlider'
import PrimaryButton from '../../components/PrimaryButton'

const MIN_REACTIONS = 5
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

interface Props {
  onBack: () => void
  onNext: (lovedMovieIds: number[]) => void
}

export default function RateMoviesStep({ onBack, onNext }: Props) {
  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['onboarding', 'curated-movies'],
    queryFn: getCuratedOnboardingMovies,
    staleTime: Infinity,
  })
  const [index, setIndex] = useState(0)
  const [sliderValue, setSliderValue] = useState(3)
  const [lovedMovieIds, setLovedMovieIds] = useState<number[]>([])
  const [reactionCount, setReactionCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const movie = movies[index]
  const atEnd = !isLoading && index >= movies.length
  const canSkipAhead = atEnd || movies.length === 0

  // Reset the slider back to neutral for each new movie.
  useEffect(() => {
    setSliderValue(3)
  }, [index])

  const submitRating = async () => {
    if (!movie) return
    setSubmitting(true)
    setError(null)
    try {
      // A real review row — the user just confirmed they've seen it, so it
      // showing up under "Movies I've Watched" afterward is intentional.
      await createReview({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        genre_ids: movie.genre_ids,
        vote_average: movie.vote_average,
        rating: sliderValue,
        review_text: '',
      })
      setReactionCount((c) => c + 1)
      if (sliderValue >= 4) setLovedMovieIds((ids) => [...ids, movie.id])
      setIndex((i) => i + 1)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(
        status === 429
          ? "You're rating a bit fast — wait a moment and try again."
          : "Couldn't save that rating — try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const skip = () => {
    setError(null)
    setIndex((i) => i + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-lighter">
        Quick ratings — how did you feel about these? ({Math.min(reactionCount, MIN_REACTIONS)}/{MIN_REACTIONS})
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

          <RatingSlider value={sliderValue} onChange={setSliderValue} />

          {error && <p className="text-center text-xs text-red-400">{error}</p>}

          <div className="flex flex-wrap justify-center gap-2">
            <PrimaryButton onClick={submitRating} isLoading={submitting}>
              Rate this movie
            </PrimaryButton>
            <button
              type="button"
              disabled={submitting}
              onClick={skip}
              className="rounded-card px-4 py-2.5 text-sm text-gray-muted transition-colors hover:text-gray-lighter disabled:opacity-50"
            >
              Haven't seen it
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-muted">You can always rate more movies later.</p>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-sm text-gray-muted hover:text-gray-lighter">
          Back
        </button>
        <PrimaryButton
          onClick={() => onNext(lovedMovieIds)}
          disabled={reactionCount < MIN_REACTIONS && !canSkipAhead}
        >
          Next
        </PrimaryButton>
      </div>
    </div>
  )
}
