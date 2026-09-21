import { createContext, useContext } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { tmdbImage } from '../../utils/tmdbImage'

/** Whether the story should skip staggered entrances and count-ups. Set once
 * by WrappedStory from prefers-reduced-motion. */
export const WrappedMotionContext = createContext<{ reduced: boolean }>({ reduced: false })

/** Per-element entrance with a delay by position: `stagger(i)` returns the
 * class + style to spread onto any element in a slide. */
export function useStagger() {
  const { reduced } = useContext(WrappedMotionContext)
  return (i: number, ms = 140): { className: string; style: CSSProperties } =>
    reduced
      ? { className: '', style: {} }
      : { className: 'animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)_both]', style: { animationDelay: `${i * ms}ms` } }
}

interface ShellProps {
  children: ReactNode
  /** Optional TMDB backdrop shown blurred behind the slide. */
  backdropPath?: string | null
  align?: 'center' | 'start'
  className?: string
}

/** The frame every slide sits in: safe-area padding, a readable column, and
 * an optional blurred backdrop of the featured film. */
export default function SlideShell({ children, backdropPath, align = 'start', className = '' }: ShellProps) {
  const backdrop = tmdbImage(backdropPath, 'w780')
  return (
    <div className="absolute inset-0 overflow-hidden">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
        />
      )}
      <div
        className={`relative mx-auto flex h-full w-full max-w-2xl flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'} justify-center gap-5 px-6 pb-24 pt-20 sm:px-10 ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

export function Eyebrow({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const stagger = useStagger()
  return (
    <p {...stagger(index)} className={`text-xs font-semibold uppercase tracking-[0.28em] text-white/70 ${stagger(index).className}`}>
      {children}
    </p>
  )
}

export function Headline({ children, index = 1, size = 'lg' }: { children: ReactNode; index?: number; size?: 'lg' | 'xl' }) {
  const stagger = useStagger()
  const s = stagger(index)
  return (
    <h2
      className={`font-bold leading-[1.05] text-white drop-shadow-md ${size === 'xl' ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'} ${s.className}`}
      style={{ ...s.style, fontFamily: '"Source Sans 3", sans-serif' }}
    >
      {children}
    </h2>
  )
}

export function Body({ children, index = 2 }: { children: ReactNode; index?: number }) {
  const stagger = useStagger()
  const s = stagger(index)
  return (
    <p className={`max-w-prose text-base leading-relaxed text-white/85 sm:text-lg ${s.className}`} style={s.style}>
      {children}
    </p>
  )
}

/** A giant number — the hero figure of a slide. */
export function BigNumber({ value, label, index = 1 }: { value: string; label?: string; index?: number }) {
  const stagger = useStagger()
  const s = stagger(index)
  return (
    <div className={s.className} style={s.style}>
      <p className="text-7xl font-bold leading-none text-white drop-shadow-lg sm:text-8xl" style={{ fontFamily: '"Source Sans 3", sans-serif' }}>
        {value}
      </p>
      {label && <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/70">{label}</p>}
    </div>
  )
}
