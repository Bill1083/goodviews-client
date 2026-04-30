import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createReview, updateReview, getMyCategories, getMyFriendGroups, getMyFriends } from '../../services/apiClient'
import type { Movie } from '../../types'
import StarRating from '../../components/StarRating'
import PrimaryButton from '../../components/PrimaryButton'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185'

interface Props {
  movie: Movie
  onClose: () => void
  /** 'create' (default) — new review; 'edit' — update existing; 'share' — share/categorise existing */
  mode?: 'create' | 'edit' | 'share'
  reviewId?: string
  initialRating?: number
  initialReviewText?: string
  initialCategoryId?: string
  initialCategoryIds?: string[]
  /** Called after a successful save (in addition to onClose) */
  onSaved?: () => void
}

export default function ReviewModal({
  movie,
  onClose,
  mode = 'create',
  reviewId,
  initialRating = 0,
  initialReviewText = '',
  initialCategoryId,
  initialCategoryIds,
  onSaved,
}: Props) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(initialRating)
  const [reviewText, setReviewText] = useState(initialReviewText)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialCategoryIds ?? (initialCategoryId ? [initialCategoryId] : [])
  )
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getMyCategories,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['friend-groups'],
    queryFn: getMyFriendGroups,
  })

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: getMyFriends,
  })

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const createMutation = useMutation({
    mutationFn: () =>
      createReview({
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ?? null,
        release_date: movie.release_date ?? null,
        rating,
        review_text: reviewText,
        category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        friend_ids: selectedFriendIds.length > 0 ? selectedFriendIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      onSaved?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateReview(reviewId!, {
        ...(mode === 'edit' ? { rating, review_text: reviewText } : {}),
        category_ids: selectedCategoryIds,
        group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        friend_ids: selectedFriendIds.length > 0 ? selectedFriendIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
      onSaved?.()
      onClose()
    },
  })

  const mutation = mode === 'create' ? createMutation : updateMutation

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode !== 'share' && rating === 0) return
    mutation.mutate()
  }

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  }

  const modalTitle =
    mode === 'edit' ? 'Edit Review' : mode === 'share' ? 'Share / Add to Category' : 'Write a Review'
  const submitLabel =
    mode === 'edit' ? 'Save Changes' : mode === 'share' ? 'Share' : 'Save Review'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-dark/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-card border border-purple/30 bg-navy p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
            <p className="text-xs font-medium text-gray-muted uppercase tracking-wide mb-0.5">{modalTitle}</p>
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
          {/* Rating — hidden in share mode */}
          {mode !== 'share' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
                Your Rating
              </label>
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating === 0 && mutation.isError && (
                <p className="text-xs text-pink-brand">Please select a rating.</p>
              )}
            </div>
          )}

          {/* Review text — hidden in share mode */}
          {mode !== 'share' && (
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
          )}

          {/* Category selection */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
                Add to Category <span className="text-gray-muted/60">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id)
                  const border = cat.outline_color ?? '#ffffff40'
                  const bg = isSelected ? (cat.fill_color ?? cat.outline_color ?? '#ffffff20') : 'transparent'
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategoryIds((prev) =>
                          prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                        )
                      }
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

          {/* Individual friend sharing */}
          {friends.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
                Send to Friends <span className="text-gray-muted/60">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {friends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id)
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleFriend(friend.id)}
                      className={[
                        'px-3 py-1 rounded-full text-xs font-medium transition-all border-2',
                        isSelected
                          ? 'border-teal bg-teal/20 text-teal-light'
                          : 'border-white/20 text-gray-muted hover:border-white/40',
                      ].join(' ')}
                    >
                      {friend.username}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-sm text-pink-brand">
              Failed to save. Please try again.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <PrimaryButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </PrimaryButton>
            <PrimaryButton
              type="submit"
              isLoading={mutation.isPending}
              disabled={mode !== 'share' && rating === 0}
            >
              {submitLabel}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}