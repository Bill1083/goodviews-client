import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import MovieDetailModal from '../../../components/MovieDetailModal'
import PersonModal from '../../../components/PersonModal'
import { getMyCategories, getMyStats } from '../../../services/apiClient'
import type { MovieRef } from '../../../types/stats'
import ActivitySection from './ActivitySection'
import CategoriesSection from './CategoriesSection'
import { DashboardError, DashboardSkeleton, EmptyDashboard } from './DashboardStates'
import DecadesSection from './DecadesSection'
import FavouritesCoverageSection from './FavouritesCoverageSection'
import FriendsSection from './FriendsSection'
import GenreDnaSection from './GenreDnaSection'
import HeadlineStrip from './HeadlineStrip'
import PeopleSection from './PeopleSection'
import RatingsSection from './RatingsSection'
import RewatchSection from './RewatchSection'
import RuntimeSection from './RuntimeSection'
import TasteVsWorldSection from './TasteVsWorldSection'
import TopRatedShelf from './TopRatedShelf'
import WatchlistSection from './WatchlistSection'
import WorldSection from './WorldSection'
import WrappedHubCard from './WrappedHubCard'

/** The all-time taste dashboard that leads the profile page. One request
 * (`/api/stats/me`), one grid; every section hides itself when it has
 * nothing to say. Poster and person taps open the app's usual modals. */
export default function TasteDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats', 'me'],
    queryFn: getMyStats,
    staleTime: 2 * 60_000,
  })
  // Shared with ProfilePage's own categories query (same key), so this is free.
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getMyCategories })
  const [movie, setMovie] = useState<MovieRef | null>(null)
  const [personId, setPersonId] = useState<number | null>(null)

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return <DashboardError onRetry={() => void refetch()} />

  const films = data.headline.films
  const onMovie = (m: MovieRef) => setMovie(m)
  const onPerson = (id: number) => setPersonId(id)
  const wide = 'md:col-span-2'
  const full = 'md:col-span-2 xl:col-span-3'

  return (
    <div className="flex flex-col gap-4">
      <WrappedHubCard />
      {films === 0 ? (
        <EmptyDashboard />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <HeadlineStrip stats={data} className={full} />
          <TopRatedShelf stats={data} index={1} className={full} onMovie={onMovie} />
          <GenreDnaSection stats={data} index={2} className={wide} />
          <RatingsSection stats={data} index={3} />
          <PeopleSection stats={data} index={4} className={wide} onPerson={onPerson} />
          <DecadesSection stats={data} index={5} onMovie={onMovie} />
          <ActivitySection stats={data} index={6} className={wide} />
          <TasteVsWorldSection stats={data} index={7} onMovie={onMovie} />
          <RuntimeSection stats={data} index={8} onMovie={onMovie} />
          <RewatchSection stats={data} index={9} onMovie={onMovie} />
          <WatchlistSection stats={data} index={10} onMovie={onMovie} />
          <FriendsSection stats={data} index={11} className={wide} onMovie={onMovie} />
          <FavouritesCoverageSection stats={data} index={12} onPerson={onPerson} onMovie={onMovie} />
          <CategoriesSection stats={data} categories={categories} index={13} />
          <WorldSection stats={data} index={14} className={wide} onMovie={onMovie} />
        </div>
      )}

      {movie && (
        <MovieDetailModal
          movie={movie}
          onClose={() => setMovie(null)}
          actions={[]}
          onPersonClick={(id) => {
            setMovie(null)
            setPersonId(id)
          }}
        />
      )}
      {personId !== null && <PersonModal personId={personId} onClose={() => setPersonId(null)} />}
    </div>
  )
}
