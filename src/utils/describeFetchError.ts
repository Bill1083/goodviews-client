import axios from 'axios'

/** Turns a failed request into a message a person can actually act on,
 *  instead of a dead-end "Something went wrong." TMDB resets the
 *  connection from our server occasionally (a known, external flakiness,
 *  not something the app can eliminate) — this at least tells people
 *  retrying in a moment is worth trying, rather than leaving them to guess
 *  why a reload "didn't do anything." */
export function describeFetchError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Couldn't reach GoodViews. Check your connection and try again."
    if (error.response.status === 429) return "You're going a little fast. Give it a few seconds and try again."
    if (error.response.status >= 500) return "The film database isn't responding right now. Try again in a moment."
  }
  return 'Something went wrong. Please try again.'
}
