/** The app's vocabulary for the five star values, index 0 = 1 star. Shared by
 * the rating slider, the dashboard and the Wrapped so the words never drift. */
export const RATING_LABELS = ['Hated it', 'Not for me', 'It was okay', 'Liked it', 'Loved it'] as const

export function ratingLabel(rating: number): string {
  const idx = Math.min(4, Math.max(0, Math.round(rating) - 1))
  return RATING_LABELS[idx]
}
