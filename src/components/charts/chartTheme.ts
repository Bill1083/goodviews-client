/**
 * Chart colour roles for the dark card surface (#160a2f, `bg-navy-card`).
 *
 * SERIES is a fixed-order categorical set validated with the dataviz palette
 * checker against that surface (lightness band, chroma floor, adjacent-pair
 * colour-vision separation, contrast). Hues are assigned in this order and
 * never cycled: anything past eight folds into "Other". Every coloured mark
 * sits beside a text label, so identity is never colour-alone.
 */
export const SERIES = [
  '#1aa7a4', // teal (brand)
  '#e05580', // pink (brand)
  '#3987e5', // blue
  '#c98500', // gold
  '#9085e9', // violet
  '#199e70', // green
  '#d95926', // orange
  '#c93ccf', // magenta (brand, stepped down)
] as const

/** The one hue for every single-series chart. */
export const SERIES_PRIMARY = SERIES[0]

/** Polarity (loved / okay / disliked, kinder / harsher): warm–cool poles
 * with a neutral grey midpoint that reads as "nothing". */
export const SENTIMENT = {
  positive: '#1aa7a4',
  neutral: '#6f6d7a',
  negative: '#e05580',
} as const

export const INK = {
  primary: '#e9e9e9',
  secondary: '#c9c9c5',
  muted: '#888887',
} as const

export const SURFACE = '#160a2f'
export const GRIDLINE = 'rgba(255,255,255,0.08)'
export const BASELINE = 'rgba(255,255,255,0.18)'
export const TRACK = 'rgba(255,255,255,0.07)'

/** Series slot for the i-th category; past the palette, a neutral. */
export function seriesColor(index: number): string {
  return index < SERIES.length ? SERIES[index] : SENTIMENT.neutral
}

/** Sequential (one hue, light → dark) as an alpha step of the primary hue. */
export function sequentialAlpha(value: number, max: number, floor = 0.12): number {
  if (max <= 0) return floor
  return floor + (1 - floor) * Math.min(1, Math.max(0, value / max))
}
