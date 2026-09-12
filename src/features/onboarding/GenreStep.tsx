import { TMDB_GENRES } from '../../utils/genres'
import PrimaryButton from '../../components/PrimaryButton'

const MIN_GENRES = 3

interface Props {
  selectedGenreIds: number[]
  onChange: (ids: number[]) => void
  onNext: () => void
}

export default function GenreStep({ selectedGenreIds, onChange, onNext }: Props) {
  const toggle = (id: number) => {
    onChange(
      selectedGenreIds.includes(id) ? selectedGenreIds.filter((g) => g !== id) : [...selectedGenreIds, id],
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-lighter">Pick a few genres you love (at least {MIN_GENRES})</p>
      <div className="flex flex-wrap gap-2">
        {TMDB_GENRES.map((genre) => {
          const active = selectedGenreIds.includes(genre.id)
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggle(genre.id)}
              className={[
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-teal bg-teal/20 text-teal-light'
                  : 'border-white/15 bg-navy-card/40 text-gray-muted hover:border-white/30 hover:text-gray-lighter',
              ].join(' ')}
            >
              {genre.name}
            </button>
          )
        })}
      </div>
      <div className="flex justify-end">
        <PrimaryButton onClick={onNext} disabled={selectedGenreIds.length < MIN_GENRES}>
          Next
        </PrimaryButton>
      </div>
    </div>
  )
}
