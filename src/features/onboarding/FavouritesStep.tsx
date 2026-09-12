import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchPeople } from '../../services/apiClient'
import MovieSearchBar from '../movies/MovieSearchBar'
import PersonCard from '../../components/PersonCard'
import PersonModal from '../../components/PersonModal'
import PrimaryButton from '../../components/PrimaryButton'

interface Props {
  onBack: () => void
  onFinish: () => void
  finishing: boolean
}

export default function FavouritesStep({ onBack, onFinish, finishing }: Props) {
  const [query, setQuery] = useState('')
  const [personModalId, setPersonModalId] = useState<number | null>(null)

  const { data, isFetching } = useQuery({
    queryKey: ['people', 'search', query, 1],
    queryFn: ({ signal }) => searchPeople(query, 1, signal),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-lighter">Any favourite actors or directors? (optional)</p>
      <MovieSearchBar onSearch={setQuery} isLoading={isFetching} placeholder="Search actors, directors…" />

      {query.length >= 2 && data && data.results.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {data.results.map((person) => (
            <PersonCard key={person.id} person={person} onClick={() => setPersonModalId(person.id)} />
          ))}
        </div>
      )}
      {query.length >= 2 && data && data.results.length === 0 && !isFetching && (
        <p className="text-sm text-gray-muted">No results.</p>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-sm text-gray-muted hover:text-gray-lighter">
          Back
        </button>
        <PrimaryButton onClick={onFinish} isLoading={finishing}>
          Finish
        </PrimaryButton>
      </div>

      {personModalId !== null && (
        <PersonModal
          personId={personModalId}
          onClose={() => setPersonModalId(null)}
          onMovieSelect={() => setPersonModalId(null)}
        />
      )}
    </div>
  )
}
