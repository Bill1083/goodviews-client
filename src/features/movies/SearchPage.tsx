import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { searchMovies, createReview } from '../../services/apiClient'
import MovieSearchBar from './MovieSearchBar'
import StarRating from '../../components/StarRating'
import type { Movie } from '../../types'

type Step = 'search' | 'rate' | 'share'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

export default function SearchPage() {
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const { data, isFetching, isError } = useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () =>
      createReview({
        movie_id: selectedMovie!.id,
        rating,
        review_text: reviewText,
      }),
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: () => {
      setSubmitError('Failed to submit review. Please try again.')
    },
  })

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
  }

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie)
    setRating(0)
    setReviewText('')
    setSubmitError(null)
    setSubmitted(false)
    setStep('rate')
  }

  const handleNext = () => {
    if (rating === 0) return
    setStep('share')
  }

  const handleBack = () => {
    if (step === 'share') { setStep('rate'); return }
    setStep('search')
    setSelectedMovie(null)
  }

  const handleSend = () => {
    submitReview()
  }

  const handleReset = () => {
    setStep('search')
    setSelectedMovie(null)
    setQuery('')
    setRating(0)
    setReviewText('')
    setSubmitted(false)
    setSubmitError(null)
  }

  // ── Step: search ──────────────────────────────────────────────────────────
  if (step === 'search') {
    return (
      <main className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-lighter">Make a Review</h1>

        <div className="w-full max-w-2xl">
          <MovieSearchBar onSearch={handleSearch} isLoading={isFetching} />
        </div>

        {isError && (
          <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
        )}

        {data && data.results.length > 0 && (
          <>
            <div className="grid w-full grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-5">
              {data.results.map((movie) => {
                const posterUrl = movie.poster_path
                  ? `${TMDB_IMG}${movie.poster_path}`
                  : FALLBACK_IMG
                return (
                  <article
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className="poster-card cursor-pointer"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
                      <img
                        src={posterUrl}
                        alt={`${movie.title} poster`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-center text-xs font-medium text-gray-lighter line-clamp-2 leading-snug">
                      {movie.title}
                    </p>
                  </article>
                )
              })}
            </div>

            {data.total_pages > 1 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-muted">
                  Page {page} of {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                  className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal/80"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {!query && !isFetching && (
          <p className="text-sm text-gray-muted">Type at least 2 characters to search for movies.</p>
        )}
      </main>
    )
  }

  // ── Shared poster panel (steps: rate + share) ─────────────────────────────
  const posterUrl = selectedMovie?.poster_path
    ? `${TMDB_IMG}${selectedMovie.poster_path}`
    : FALLBACK_IMG

  return (
    <main className="mx-auto flex max-w-4xl items-stretch gap-0 rounded-2xl overflow-hidden shadow-2xl my-8 mx-6">
      {/* Left — poster */}
      <div className="w-72 shrink-0 bg-navy-card">
        <img
          src={posterUrl}
          alt={`${selectedMovie?.title} poster`}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col gap-5 bg-navy-wine/90 p-8">
        {/* Back */}
        <button onClick={handleBack} className="self-start text-xs text-gray-muted hover:text-gray-lighter transition-colors">
          ← Back
        </button>

        <div>
          <h2 className="text-xl font-bold text-gray-lighter">{selectedMovie?.title}</h2>
          {selectedMovie?.release_date && (
            <p className="text-sm text-gray-muted">{selectedMovie.release_date.slice(0, 4)}</p>
          )}
        </div>

        {/* ── Step: rate ── */}
        {step === 'rate' && (
          <>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-lighter">Rate This Movie</h3>
              <p className="text-xs text-gray-muted">Click a star to rate</p>
              <div className="mt-2">
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-light/70 uppercase tracking-wide">
                Write a Review <span className="normal-case text-gray-muted">(optional)</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
                placeholder="Share your thoughts…"
                className="input-base resize-none"
                maxLength={2000}
              />
            </div>

            <button
              onClick={handleNext}
              disabled={rating === 0}
              className="mt-auto w-full rounded-lg bg-magenta py-2.5 text-sm font-semibold text-white
                         hover:bg-magenta/90 active:scale-95 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </>
        )}

        {/* ── Step: share ── */}
        {step === 'share' && !submitted && (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-light/80">
                Your rating:&nbsp;
                <span className="font-semibold text-magenta">{'★'.repeat(rating)}</span>
              </p>
              {reviewText && (
                <p className="text-sm text-gray-light/70 italic line-clamp-3">"{reviewText}"</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-light/70 uppercase tracking-wide">Add to categories</p>
              <p className="rounded-lg border border-white/10 px-4 py-3 text-xs text-gray-muted/60 italic">
                Category management coming soon…
              </p>
            </div>

            {submitError && (
              <p className="rounded-md bg-red-900/30 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                {submitError}
              </p>
            )}

            <button
              onClick={handleSend}
              disabled={isPending}
              className="mt-auto w-full rounded-lg bg-magenta py-2.5 text-sm font-semibold text-white
                         hover:bg-magenta/90 active:scale-95 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Submitting…' : 'Send to Friends'}
            </button>
          </>
        )}

        {/* ── Submitted ── */}
        {submitted && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <span className="text-4xl">🎉</span>
            <p className="text-lg font-semibold text-gray-lighter">Review saved!</p>
            <button
              onClick={handleReset}
              className="rounded-lg border border-white/20 px-5 py-2 text-sm text-gray-lighter hover:bg-white/5 transition-colors"
            >
              Review another movie
            </button>
          </div>
        )}
      </div>
    </main>
  )
}


export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  const { data, isFetching, isError } = useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 min
  })

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-8">
      <h1 className="self-start text-2xl font-bold text-gray-light">
        Find a Movie
      </h1>

      <MovieSearchBar onSearch={handleSearch} isLoading={isFetching} />

      {isError && (
        <p className="text-pink-brand text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      {data && (
        <>
          <div className="w-full">
            <MovieGrid
              movies={data.results}
              onSelectMovie={setSelectedMovie}
            />
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal-light"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-muted">
                Page {page} of {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="text-sm text-teal disabled:text-gray-muted disabled:cursor-not-allowed hover:text-teal-light"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {!query && !isFetching && (
        <p className="mt-8 text-gray-muted text-sm">
          Type at least 2 characters to search for movies.
        </p>
      )}

      {selectedMovie && (
        <ReviewModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </main>
  )
}
