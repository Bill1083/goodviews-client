import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'

export interface TooltipState {
  x: number
  y: number
  title: string
  value: string
  sub?: string
}

/** Shared hover/focus readout for the hand-rolled charts. Marks call `show`
 * with themselves as the anchor (pointer or keyboard focus — same readout);
 * the tooltip is positioned relative to `containerRef`. Tooltips enhance,
 * never gate: every value is also labelled or listed somewhere static. */
export function useChartTooltip() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<TooltipState | null>(null)

  const show = useCallback((anchor: Element, title: string, value: string, sub?: string) => {
    const container = containerRef.current
    if (!container) return
    const c = container.getBoundingClientRect()
    const a = anchor.getBoundingClientRect()
    setTip({ x: a.left + a.width / 2 - c.left, y: a.top - c.top, title, value, sub })
  }, [])

  const hide = useCallback(() => setTip(null), [])

  return { containerRef, tip, show, hide }
}

export function ChartTooltip({ tip, containerRef }: { tip: TooltipState | null; containerRef: RefObject<HTMLDivElement> }) {
  if (!tip) return null
  const width = containerRef.current?.clientWidth ?? 0
  const half = 70
  const x = width ? Math.min(Math.max(tip.x, half), Math.max(half, width - half)) : tip.x
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 w-max max-w-[180px] -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-navy px-2.5 py-1.5 text-left shadow-xl"
      style={{ left: x, top: Math.max(0, tip.y - 8) }}
    >
      <p className="text-sm font-semibold leading-tight text-gray-lighter">{tip.value}</p>
      <p className="text-[11px] leading-tight text-gray-muted">{tip.title}</p>
      {tip.sub && <p className="text-[11px] leading-tight text-gray-medium">{tip.sub}</p>}
    </div>
  )
}
