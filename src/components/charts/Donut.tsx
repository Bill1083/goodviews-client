import type { ReactNode } from 'react'
import { ChartTooltip, useChartTooltip } from './ChartTooltip'
import { SURFACE } from './chartTheme'

export interface DonutSegment {
  label: string
  value: number
  color: string
  valueLabel?: string
}

interface Props {
  segments: DonutSegment[]
  ariaLabel: string
  size?: number
  thickness?: number
  /** Centre content (a hero figure, usually). */
  children?: ReactNode
}

/** Part-to-whole at a glance (≤ 6 segments): thin ring, 2px surface gaps
 * between segments, a legend that always lists every segment with its value. */
export default function Donut({ segments, ariaLabel, size = 132, thickness = 14, children }: Props) {
  const { containerRef, tip, show, hide } = useChartTooltip()
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const r = size / 2 - thickness / 2
  const c = 2 * Math.PI * r
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 2 : 0

  let offset = 0
  const arcs = segments.map((seg) => {
    const len = total > 0 ? (seg.value / total) * c : 0
    const arc = { seg, dash: Math.max(0, len - gap), offset }
    offset += len
    return arc
  })

  return (
    <div className="flex items-center gap-4">
      <div ref={containerRef} className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={ariaLabel}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
          {arcs.map(({ seg, dash, offset: o }) =>
            dash > 0 ? (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-o - gap / 2}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                tabIndex={0}
                role="button"
                aria-label={`${seg.label}: ${seg.valueLabel ?? seg.value}`}
                className="cursor-default transition-opacity hover:opacity-80 focus:outline-none focus-visible:opacity-80"
                style={{ paintOrder: 'stroke' }}
                onPointerEnter={(e) => show(e.currentTarget, seg.label, seg.valueLabel ?? String(seg.value))}
                onPointerLeave={hide}
                onFocus={(e) => show(e.currentTarget, seg.label, seg.valueLabel ?? String(seg.value))}
                onBlur={hide}
              />
            ) : null,
          )}
          <circle cx={size / 2} cy={size / 2} r={r - thickness / 2 - 1} fill="none" stroke={SURFACE} strokeWidth={0} />
        </svg>
        {children && <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>}
        <ChartTooltip tip={tip} containerRef={containerRef} />
      </div>
      <ul className="flex min-w-0 flex-col gap-1.5">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} aria-hidden="true" />
            <span className="truncate text-gray-light">{seg.label}</span>
            <span className="ml-auto shrink-0 pl-3 text-xs font-semibold text-gray-lighter">{seg.valueLabel ?? seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
