import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createReview, getMyCategories, getMyFriendGroups } from '../../services/apiClient'
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getMyCategories,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['friend-groups'],
    queryFn: getMyFriendGroups,
  })

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
        category_id: selectedCategoryId || null,
        group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    mutation.mutate()
  }

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
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
          {/* Rating */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
              Your Rating
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating === 0 && mutation.isError && (
              <p className="text-xs text-pink-brand">Please select a rating.</p>
            )}
          </div>

          {/* Review text */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="review-text"
              className="text-xs font-medium text-gray-muted uppercase tracking-wide"
            >
              Review <span className="text-gray-muted/60">(optional)</span>
            </label>
            <textarea
              id="review-text"
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think?"
              maxLength={2000}
              className="input-base resize-none"
            />
          </div>

          {/* Category selection */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
                Add to Category <span className="text-gray-muted/60">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id
                  const border = cat.outline_color ?? '#ffffff40'
                  const bg = isSelected ? (cat.fill_color ?? cat.outline_color ?? '#ffffff20') : 'transparent'
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(isSelected ? '' : cat.id)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        border: `2px solid ${border}`,
                        backgroundColor: bg,
                        color: '#e9e9e9',
                        opacity: isSelected ? 1 : 0.7,
                      }}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Friend group sharing */}
          {groups.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
                Share with Group <span className="text-gray-muted/60">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {groups.map((grp) => {
                  const isSelected = selectedGroupIds.includes(grp.id)
                  const border = grp.outline_color ?? '#ffffff40'
                  const bg = isSelected ? (grp.fill_color ?? grp.outline_color ?? '#ffffff20') : 'transparent'
                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => toggleGroup(grp.id)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        border: `2px solid ${border}`,
                        backgroundColor: bg,
                        color: '#e9e9e9',
                        opacity: isSelected ? 1 : 0.7,
                      }}
                    >
                      {grp.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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
