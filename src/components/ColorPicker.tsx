import { useEffect, useRef } from 'react'

const PRESET_COLORS = [
  // Reds
  '#FF4444', '#CC2222', '#8B1515', '#FF6B6B', '#FF0000',
  // Oranges/Yellows
  '#FF8C00', '#FFA500', '#FFD700', '#F9A825', '#F57F17',
  // Greens
  '#00C853', '#2ECC71', '#1ABC9C', '#00695C', '#2E7D32',
  // Teals/Light Blues
  '#14CECA', '#00BCD4', '#29B6F6', '#039BE5', '#0288D1',
  // Blues
  '#1E90FF', '#1565C0', '#016DB9', '#3949AB', '#0D47A1',
  // Purples
  '#9C27B0', '#7B1FA2', '#6A1B9A', '#DD3EE3', '#AB47BC',
  // Pinks/Magentas
  '#E91E63', '#FF69B4', '#FF1493', '#F06292', '#EC407A',
  // Grays / Black / White
  '#FFFFFF', '#C0C0C0', '#808080', '#404040', '#000000',
]

interface Props {
  value: string | null
  onChange: (color: string | null) => void
  onClose: () => void
}

export default function ColorPicker({ value, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 p-3 rounded-xl bg-navy-card border border-white/20 shadow-2xl"
      style={{ minWidth: 168 }}
    >
      <div className="grid grid-cols-5 gap-1.5 mb-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => { onChange(color); onClose() }}
            className="w-7 h-7 rounded-md transition-transform hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: color,
              border: value === color ? '2px solid #fff' : '2px solid transparent',
              boxShadow: value === color ? '0 0 0 1px rgba(255,255,255,0.4)' : undefined,
            }}
            title={color}
          />
        ))}
      </div>
      <button
        onClick={() => { onChange(null); onClose() }}
        className="w-full text-xs text-gray-muted hover:text-gray-lighter py-1 transition-colors"
      >
        Clear (transparent)
      </button>
    </div>
  )
}
