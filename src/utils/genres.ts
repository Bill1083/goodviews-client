export const TMDB_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
]

/** id → display name, including TMDB's "TV Movie" (10770), which the picker
 * above deliberately leaves out but the backend can still report. */
export const GENRE_NAME_BY_ID: Record<number, string> = Object.fromEntries([
  ...TMDB_GENRES.map((g) => [g.id, g.name]),
  [10770, 'TV Movie'],
])

/** Accent colour + emoji per genre for the dashboard and Wrapped. The colours
 * come from the validated categorical set in components/charts/chartTheme.ts
 * and only ever appear beside the genre's name — with 19 genres and 8 safe
 * hues, several share a colour, so the colour is decoration, never identity. */
export const GENRE_STYLE: Record<number, { color: string; emoji: string }> = {
  28: { color: '#d95926', emoji: '💥' },     // Action
  12: { color: '#199e70', emoji: '🧭' },     // Adventure
  16: { color: '#c93ccf', emoji: '✨' },     // Animation
  35: { color: '#c98500', emoji: '😂' },     // Comedy
  80: { color: '#9085e9', emoji: '🔍' },     // Crime
  99: { color: '#1aa7a4', emoji: '🎥' },     // Documentary
  18: { color: '#3987e5', emoji: '🎭' },     // Drama
  10751: { color: '#c98500', emoji: '🧸' },  // Family
  14: { color: '#9085e9', emoji: '🐉' },     // Fantasy
  36: { color: '#c98500', emoji: '🏛️' },    // History
  27: { color: '#e05580', emoji: '👻' },     // Horror
  10402: { color: '#c93ccf', emoji: '🎵' },  // Music
  9648: { color: '#9085e9', emoji: '🕵️' },  // Mystery
  10749: { color: '#e05580', emoji: '💞' },  // Romance
  878: { color: '#1aa7a4', emoji: '🚀' },    // Sci-Fi
  53: { color: '#d95926', emoji: '🔪' },     // Thriller
  10752: { color: '#199e70', emoji: '⚔️' },  // War
  37: { color: '#c98500', emoji: '🤠' },     // Western
  10770: { color: '#6f6d7a', emoji: '📺' },  // TV Movie
}

const FALLBACK_STYLE = { color: '#6f6d7a', emoji: '🎞️' }

export function genreStyle(id: number): { color: string; emoji: string } {
  return GENRE_STYLE[id] ?? FALLBACK_STYLE
}
