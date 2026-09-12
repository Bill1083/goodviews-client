import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getCuratedOnboardingPeople,
  addFavouriteActor,
  removeFavouriteActor,
  addFavouriteDirector,
  removeFavouriteDirector,
} from '../../services/apiClient'
import type { CuratedPerson } from '../../services/apiClient'
import PersonCard from '../../components/PersonCard'
import PrimaryButton from '../../components/PrimaryButton'

interface Props {
  genreIds: number[]
  movieIds: number[]
  onBack: () => void
  onFinish: () => void
  finishing: boolean
}

export default function FavouritesStep({ genreIds, movieIds, onBack, onFinish, finishing }: Props) {
  const { data: people = [], isLoading } = useQuery({
    queryKey: ['onboarding', 'curated-people', genreIds, movieIds],
    queryFn: () => getCuratedOnboardingPeople(genreIds, movieIds),
    staleTime: Infinity,
  })
  const [selected, setSelected] = useState<Record<number, boolean>>({})

  const toggle = async (person: CuratedPerson) => {
    const wasSelected = !!selected[person.id]
    setSelected((s) => ({ ...s, [person.id]: !wasSelected }))
    try {
      if (person.type === 'director') {
        if (wasSelected) await removeFavouriteDirector(person.id)
        else await addFavouriteDirector({ person_id: person.id, name: person.name, profile_path: person.profile_path })
      } else {
        if (wasSelected) await removeFavouriteActor(person.id)
        else await addFavouriteActor({ person_id: person.id, name: person.name, profile_path: person.profile_path })
      }
    } catch {
      // Revert the optimistic toggle on failure.
      setSelected((s) => ({ ...s, [person.id]: wasSelected }))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-lighter">Any of these your favourites? (optional)</p>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      ) : people.length === 0 ? (
        <p className="text-sm text-gray-muted">
          Couldn't load suggestions right now — that's okay, you can skip this.
        </p>
      ) : (
        <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
          {people.map((person) => {
            const isSelected = !!selected[person.id]
            return (
              <div key={person.id} className="relative">
                <PersonCard
                  person={{ ...person, known_for_department: person.type === 'director' ? 'Director' : 'Actor' }}
                  onClick={() => toggle(person)}
                />
                {isSelected && (
                  <>
                    <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-teal" />
                    <div className="pointer-events-none absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-navy">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-muted">You can always add more favourites later.</p>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-sm text-gray-muted hover:text-gray-lighter">
          Back
        </button>
        <PrimaryButton onClick={onFinish} isLoading={finishing}>
          Finish
        </PrimaryButton>
      </div>
    </div>
  )
}
