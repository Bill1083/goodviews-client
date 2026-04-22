import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createReview } from '../../services/apiClient'
import type { Movie } from '../../types'
import StarRating from '../../components/StarRating'
import PrimaryButton from '../../components/PrimaryButton'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185'

interface Props {
  movie: Movie
  onClose: () => void
}

export default function ReviewModal({ movie, onClose }: Props) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const mutation = useMutation({
    mutationFn: () =>
      createReview({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ?? null,
        release_date: movie.release_date ?? null,
        rating,
        review_text: reviewText,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    mutation.mutate()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-dark/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-card border border-purple/30 bg-navy p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          {movie.poster_path && (
            <img
              src={`${TMDB_IMG}${movie.poster_path}`}
              alt={movie.title}
              className="h-24 w-16 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-light leading-snug">
              {movie.title}
            </h2>
            {movie.release_date && (
              <p className="text-xs text-gray-muted mt-0.5">
                {movie.release_date.slice(0, 4)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-muted hover:text-gray-light text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
              Your Rating
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating === 0 && mutation.isError && (
              <p className="text-xs text-pink-brand">Please select a rating.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="review-text"
              className="text-xs font-medium text-gray-muted uppercase tracking-wide"
            >
              Review <span className="text-gray-muted/60">(optional)</span>
            </label>
            <textarea
              id="review-text"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think?"
              maxLength={2000}
              className="input-base resize-none"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-pink-brand">
              Failed to save your review. Please try again.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <PrimaryButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </PrimaryButton>
            <PrimaryButton
              type="submit"
              isLoading={mutation.isPending}
              disabled={rating === 0}
            >
              Save Review
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
