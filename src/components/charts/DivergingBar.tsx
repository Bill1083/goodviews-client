import { SENTIMENT, SURFACE, TRACK } from './chartTheme'

interface Props {
  /** Signed value; 0 is the neutral midpoint. */
  value: number
  /** Symmetric range: the bar spans -range .. +range. */
  range: number
  leftLabel: string
  rightLabel: string
  valueLabel: string
  ariaLabel: string
}

/** A single polarity reading (kinder / harsher than the crowd): warm–cool
 * poles, a neutral midpoint, the fill grows from the centre toward the
 * value, and the value is labelled at the marker. */
export default function DivergingBar({ value, range, leftLabel, rightLabel, valueLabel, ariaLabel }: Props) {
  const clamped = Math.max(-range, Math.min(range, value))
  const pct = 50 + (clamped / range) * 50
  const positive = clamped >= 0
  const fillLeft = positive ? 50 : pct
  const fillWidth = Math.abs(pct - 50)
  const color = Math.abs(clamped) < 0.05 ? SENTIMENT.neutral : positive ? SENTIMENT.positive : SENTIMENT.negative

  return (
    <div role="img" aria-label={ariaLabel} className="flex flex-col gap-1.5">
      <div className="relative h-3 w-full rounded-full" style={{ backgroundColor: TRACK }}>
        <div className="absolute inset-y-0 rounded-full" style={{ left: `${fillLeft}%`, width: `${fillWidth}%`, backgroundColor: color, opacity: 0.85 }} />
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${pct}%`, backgroundColor: color, boxShadow: `0 0 0 2px ${SURFACE}` }}
        />
        <span
          className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-gray-lighter"
          style={{ left: `${Math.min(92, Math.max(8, pct))}%` }}
        >
          {valueLabel}
        </span>
      </div>
      <div className="flex justify-between text-[11px] text-gray-muted">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}
