/** Brand-colour theming for each curated streaming service's tile and its
 * world page's hero banner (see StreamingWorldTile / StreamingWorldPage).
 * Colours are each service's well-known public brand colour, not any
 * trademarked artwork — paired with TMDB's own hosted logo image (already
 * used elsewhere in this app for provider attribution).
 *
 * Keyed by provider_name (same curated names as the backend's
 * CURATED_PROVIDER_NAMES — see server/app/services/streaming_picks.py),
 * lowercased, so this stays correct even if TMDB's provider_ids ever shift.
 */
export interface ServiceTheme {
  /** Primary brand colour — the tile's glow and the portal's core colour. */
  color: string
  /** A darker shade of the same colour, for the tile's gradient edge and
   * the entrance overlay's backdrop. */
  shade: string
}

const DEFAULT_THEME: ServiceTheme = { color: '#5B8DEF', shade: '#121a33' }

const THEMES_BY_NAME: Record<string, ServiceTheme> = {
  'netflix': { color: '#E50914', shade: '#2b0607' },
  'amazon prime video': { color: '#00A8E1', shade: '#041c26' },
  'disney plus': { color: '#1A3FE4', shade: '#060f3d' },
  'stan': { color: '#1FD4E8', shade: '#07262b' },
  'binge': { color: '#FF2D78', shade: '#330a1a' },
  'paramount plus': { color: '#1F5BFF', shade: '#0a1740' },
  'hbo max': { color: '#9A5AE5', shade: '#1c0b33' },
  'apple tv': { color: '#9B9B9B', shade: '#0a0a0a' },
  'foxtel now': { color: '#D2042D', shade: '#2b0309' },
  'britbox': { color: '#2338C2', shade: '#070b2e' },
  'crunchyroll': { color: '#F47521', shade: '#331a05' },
  'sbs on demand': { color: '#E2231A', shade: '#1f1f1f' },
}

export function themeFor(providerName: string): ServiceTheme {
  return THEMES_BY_NAME[providerName.trim().toLowerCase()] ?? DEFAULT_THEME
}
