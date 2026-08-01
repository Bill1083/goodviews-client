import { useEffect, useRef, useState } from 'react'
import type { Movie } from '../../types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'
const FALLBACK_IMG = 'https://via.placeholder.com/342x513?text=No+Poster'

const DRIFT_SPEED = 1 / 7 // slots per second — slow, continuous auto-scroll
const RESUME_DELAY_MS = 1200 // pause auto-drift briefly after the user lets go
const CLICK_MOVE_THRESHOLD = 6 // px — below this a pointer-up counts as a tap, not a swipe

interface Props {
  movies: Movie[]
  onOpenAll: () => void
  onSelectMovie: (movie: Movie) => void
}

export default function MovieCarousel({ movies, onOpenAll, onSelectMovie }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [offset, setOffset] = useState(0)

  const draggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartOffsetRef = useRef(0)
  const dragMovedRef = useRef(0)
  const resumeAtRef = useRef(0)
  const rafRef = useRef<number>()
  const lastTsRef = useRef<number | null>(null)

  const n = movies.length

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (n === 0) return
    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts
      if (!draggingRef.current && Date.now() >= resumeAtRef.current) {
        setOffset((o) => o + DRIFT_SPEED * dt)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTsRef.current = null
    }
  }, [n])

  const slotWidth = Math.min(220, Math.max(130, containerWidth / 3.7))
  const posterWidth = slotWidth * 0.78
  const posterHeight = posterWidth * 1.5

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    dragMovedRef.current = 0
    dragStartXRef.current = e.clientX
    dragStartOffsetRef.current = offset
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const dx = e.clientX - dragStartXRef.current
    dragMovedRef.current = Math.max(dragMovedRef.current, Math.abs(dx))
    setOffset(dragStartOffsetRef.current - dx / slotWidth)
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    resumeAtRef.current = Date.now() + RESUME_DELAY_MS
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const moved = dragMovedRef.current
    endDrag()
    if (moved >= CLICK_MOVE_THRESHOLD) return

    // Tap: figure out whether it landed on a clearly-visible poster (open that movie)
    // or on empty space around the carousel (open the full list page instead).
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || n === 0) { onOpenAll(); return }
    const tapX = e.clientX - rect.left
    const approxPosition = (tapX - containerWidth / 2) / slotWidth
    if (Math.abs(approxPosition) <= 1.05) {
      const i = Math.round(offset + approxPosition)
      const idx = ((i % n) + n) % n
      onSelectMovie(movies[idx])
    } else {
      onOpenAll()
    }
  }

  if (n === 0 || containerWidth === 0) {
    return <div ref={containerRef} className="h-40 w-full" />
  }

  const rangeStart = Math.floor(offset - 2)
  const rangeEnd = Math.ceil(offset + 2)
  const items: { key: number; movie: Movie; position: number }[] = []
  for (let i = rangeStart; i <= rangeEnd; i++) {
    const position = i - offset
    if (Math.abs(position) > 2.1) continue
    const idx = ((i % n) + n) % n
    items.push({ key: i, movie: movies[idx], position })
  }

  return (
    <div
      ref={containerRef}
      data-no-swipe
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      className="relative isolate w-full select-none overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ height: posterHeight * 1.25, touchAction: 'none' }}
    >
      {items.map(({ key, movie, position }) => {
        const absPos = Math.abs(position)
        const scale = absPos <= 1 ? 1.15 - 0.2 * absPos : 0.95 - 0.45 * Math.min(1, absPos - 1)
        const opacity = absPos <= 1 ? 1 : Math.max(0, 1 - (absPos - 1))
        const left = containerWidth / 2 + position * slotWidth
        const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : FALLBACK_IMG

        return (
          <div
            key={key}
            className="absolute top-1/2 pointer-events-none"
            style={{
              left,
              width: posterWidth,
              height: posterHeight,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              zIndex: 100 - Math.round(absPos * 10),
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-card shadow-lg shadow-black/40 border border-white/10 bg-navy-card/40">
              <img
                src={posterUrl}
                alt={movie.title}
                className="h-full w-full object-cover"
                draggable={false}
                loading="lazy"
              />
              {absPos < 0.6 && (
                <div
                  className="absolute inset-x-0 bottom-0 px-2 py-1.5"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                    opacity: 1 - absPos / 0.6,
                  }}
                >
                  <p className="truncate text-[11px] font-medium text-white/90">{movie.title}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
