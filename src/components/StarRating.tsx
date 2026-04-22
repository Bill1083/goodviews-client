interface Props {
  value: number
  onChange?: (rating: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: Props) {
  return (
    <div
      className={`flex gap-1 ${sizeClasses[size]}`}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star`}
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={[
            'transition-transform duration-75',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            star <= value ? 'text-teal' : 'text-gray-muted',
          ].join(' ')}
        >
          ★
        </button>
      ))}
    </div>
  )
}
