import type { WrappedSlide } from '../../types/stats'
import { plural } from '../../utils/formatStats'
import { tmdbImage } from '../../utils/tmdbImage'

type Summary = Extract<WrappedSlide, { kind: 'summary' }>

const W = 1080
const H = 1920

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draws a 1080×1920 keepsake card: gradient, the year, the top five
 * posters, the headline numbers and the persona. TMDB serves its images
 * with CORS headers, so the canvas stays exportable; a poster that fails
 * to load is simply skipped. */
export async function renderShareCard(slide: Summary, year: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  try {
    await document.fonts.load('bold 96px "Source Sans 3"')
  } catch {
    // system fallback is fine
  }
  const font = (weight: string, size: number) => `${weight} ${size}px "Source Sans 3", system-ui, sans-serif`

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1e55')
  bg.addColorStop(0.55, '#12082a')
  bg.addColorStop(1, '#2a0b2c')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, 700)
  glow.addColorStop(0, 'rgba(221,62,227,0.45)')
  glow.addColorStop(1, 'rgba(221,62,227,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  const glow2 = ctx.createRadialGradient(W * 0.1, H * 0.95, 0, W * 0.1, H * 0.95, 800)
  glow2.addColorStop(0, 'rgba(20,206,202,0.4)')
  glow2.addColorStop(1, 'rgba(20,206,202,0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = font('600', 34)
  ctx.textBaseline = 'top'
  ctx.fillText('GOODVIEWS WRAPPED', 90, 120)
  ctx.fillStyle = '#ffffff'
  ctx.font = font('bold', 150)
  ctx.fillText(String(year), 84, 160)

  const posters = await Promise.all(slide.top_films.slice(0, 5).map((f) => loadImage(tmdbImage(f.movie.poster_path, 'w342') ?? '')))
  const pw = 176
  const ph = 264
  const gap = 24
  const startX = (W - (pw * 5 + gap * 4)) / 2
  posters.forEach((img, i) => {
    const x = startX + i * (pw + gap)
    const y = 400 + (i % 2) * 24
    ctx.save()
    roundedRect(ctx, x, y, pw, ph, 18)
    ctx.clip()
    if (img) ctx.drawImage(img, x, y, pw, ph)
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fillRect(x, y, pw, ph)
    }
    ctx.restore()
  })

  const stat = (label: string, value: string, x: number, y: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = font('600', 30)
    ctx.fillText(label.toUpperCase(), x, y)
    ctx.fillStyle = '#ffffff'
    ctx.font = font('bold', 88)
    ctx.fillText(value, x, y + 40)
  }
  stat('Films', String(slide.films), 90, 780)
  stat('Hours', String(Math.round(slide.minutes / 60)), 560, 780)
  stat('Top genre', slide.top_genre?.name ?? '—', 90, 980)
  stat('Average', `${slide.avg_rating?.toFixed(1) ?? '—'}★`, 560, 980)
  if (slide.top_director) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = font('600', 30)
    ctx.fillText('MOST-WATCHED DIRECTOR', 90, 1180)
    ctx.fillStyle = '#ffffff'
    ctx.font = font('bold', 64)
    ctx.fillText(`${slide.top_director.name} · ${slide.top_director.count} ${plural(slide.top_director.count, 'film')}`, 90, 1222)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  roundedRect(ctx, 90, 1380, W - 180, 260, 40)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = font('600', 30)
  ctx.fillText('YOU ARE', 140, 1430)
  ctx.fillStyle = '#ffffff'
  ctx.font = font('bold', 92)
  ctx.fillText(`${slide.persona.emoji} ${slide.persona.title}`, 140, 1480)

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = font('600', 30)
  ctx.fillText('goodviews.online', 90, 1780)

  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    } catch {
      resolve(null)
    }
  })
}

/** Share as an image where the platform allows it, else download the PNG,
 * else share/copy a text summary. Returns what happened. */
export async function shareWrapped(slide: Summary, year: number): Promise<'shared' | 'downloaded' | 'copied' | 'cancelled'> {
  const text = `My ${year} GoodViews Wrapped: ${slide.films} films, ${Math.round(slide.minutes / 60)} hours, top genre ${slide.top_genre?.name ?? '—'}. I'm ${slide.persona.title} ${slide.persona.emoji}`
  const blob = await renderShareCard(slide, year)

  if (blob) {
    const file = new File([blob], `goodviews-wrapped-${year}.png`, { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: `My ${year} Wrapped`, text })
        return 'shared'
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return 'cancelled'
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `goodviews-wrapped-${year}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 5000)
    return 'downloaded'
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: `My ${year} Wrapped`, text })
      return 'shared'
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return 'cancelled'
    }
  }
  await navigator.clipboard.writeText(text)
  return 'copied'
}
