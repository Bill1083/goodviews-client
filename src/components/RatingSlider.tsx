interface Props {
  value: number
  onChange: (value: number) => void
}

const LABELS = ['Hated it', 'Not for me', 'It was okay', 'Liked it', 'Loved it']

export default function RatingSlider({ value, onChange }: Props) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="text-sm font-semibold text-teal-light">{LABELS[value - 1]}</p>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rating"
        className="h-2 w-full max-w-xs cursor-pointer appearance-none rounded-full bg-navy-card accent-teal"
      />
      <div className="flex w-full max-w-xs justify-between px-0.5 text-[10px] text-gray-muted">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  )
}
