import { useState } from 'react'
import MovieDetailModal from './MovieDetailModal'
import SendToFriendsPanel from './SendToFriendsPanel'
import ReviewModal from '../features/reviews/ReviewModal'
import type { NotInterestedScope } from '../services/apiClient'
import type { Movie } from '../types'

/** A film's detail modal with the signed-in member's actions on it:
 *  watchlist, write a review, send to friends, and (on recommendations)
 *  not interested. Shared by Discover and the public film page. */
export default function MovieActionsModal({
  movie,
  onClose,
  inWatchlist,
  onAddWatchlist,
  onRemoveWatchlist,
  onPersonClick,
  forYouReason,
  onNotInterested,
}: {
  movie: Movie
  onClose: () => void
  inWatchlist: boolean
  onAddWatchlist: () => void
  onRemoveWatchlist: () => void
  onPersonClick: (personId: number, name: string, type: 'actor' | 'director') => void
  forYouReason?: string | null
  onNotInterested?: (scope: NotInterestedScope) => void
}) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSendPanel, setShowSendPanel] = useState(false)

  return (
    <>
      <MovieDetailModal
        movie={movie}
        onClose={onClose}
        onPersonClick={onPersonClick}
        forYouReason={forYouReason}
        extraContent={
          showSendPanel ? (
            <SendToFriendsPanel movie={movie} onCancel={() => setShowSendPanel(false)} onSent={() => setShowSendPanel(false)} />
          ) : undefined
        }
        actions={[
          {
            key: 'watchlist',
            label: inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist',
            variant: inWatchlist ? 'teal' : 'outline',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {inWatchlist ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                )}
              </svg>
            ),
            onClick: () => (inWatchlist ? onRemoveWatchlist() : onAddWatchlist()),
          },
          {
            key: 'review',
            label: 'Write a Review',
            variant: 'primary',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            onClick: () => setShowReviewModal(true),
          },
          {
            key: 'send',
            label: 'Send to Friends',
            variant: 'magenta',
            active: showSendPanel,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
              </svg>
            ),
            onClick: () => setShowSendPanel((v) => !v),
          },
        ]}
        onNotInterested={onNotInterested}
      />

      {showReviewModal && (
        <ReviewModal movie={movie} mode="create" onClose={() => setShowReviewModal(false)} />
      )}
    </>
  )
}
