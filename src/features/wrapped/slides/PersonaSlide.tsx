import { useContext, useEffect, useState } from 'react'
import type { WrappedSlide } from '../../../types/stats'
import SlideShell, { Body, Eyebrow, WrappedMotionContext, useStagger } from '../SlideShell'

type Persona = Extract<WrappedSlide, { kind: 'persona' }>

/** Two beats: the evidence lines land first, then the title pops. */
export default function PersonaSlide({ slide }: { slide: Persona }) {
  const stagger = useStagger()
  const { reduced } = useContext(WrappedMotionContext)
  const [reveal, setReveal] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const t = window.setTimeout(() => setReveal(true), 2200)
    return () => window.clearTimeout(t)
  }, [reduced])

  return (
    <SlideShell align="center">
      <Eyebrow index={0}>Which means you are…</Eyebrow>
      <ul className="flex flex-col gap-2">
        {slide.evidence.map((line, i) => (
          <li key={line} {...stagger(1 + i, 500)} className={`text-base text-white/85 sm:text-lg ${stagger(1 + i, 500).className}`}>
            {line}
          </li>
        ))}
      </ul>
      <div className={`mt-4 flex flex-col items-center gap-3 transition-opacity duration-500 ${reveal ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
        {reveal && (
          <>
            <p className={`text-6xl ${reduced ? '' : 'wrapped-pop'}`} aria-hidden="true">
              {slide.emoji}
            </p>
            <h2 className={`text-gradient-brand text-5xl font-bold leading-tight sm:text-7xl ${reduced ? '' : 'wrapped-pop'}`} style={{ fontFamily: '"Source Sans 3", sans-serif', animationDelay: '120ms' }}>
              {slide.title}
            </h2>
            <p className="text-lg italic text-white/90">{slide.tagline}</p>
            <Body index={0}>{slide.description}</Body>
          </>
        )}
      </div>
    </SlideShell>
  )
}
