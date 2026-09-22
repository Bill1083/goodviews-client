import { useQuery } from '@tanstack/react-query'
import { getMyStats } from '../../../services/apiClient'
import { DashboardError, DashboardSkeleton, EmptyDashboard } from './DashboardStates'
import GenreDnaSection from './GenreDnaSection'
import HeadlineStrip from './HeadlineStrip'
import WrappedHubCard from './WrappedHubCard'

/** The taste card at the top of the profile: a handful of plain totals and
 * the genre breakdown.
 *
 * Deliberately nothing more. Favourite films, most-watched directors, eras,
 * rewatches, hot takes, taste twins — all of that is what the Wrapped is for,
 * and showing it here year-round would spoil the reveal. The server doesn't
 * even send it (see /api/stats/me). */
export default function TasteDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats', 'me'],
    queryFn: getMyStats,
    staleTime: 2 * 60_000,
  })

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return <DashboardError onRetry={() => void refetch()} />

  return (
    <div className="flex flex-col gap-4">
      <WrappedHubCard />
      {data.headline.films === 0 ? (
        <EmptyDashboard />
      ) : (
        <>
          <HeadlineStrip stats={data} />
          <GenreDnaSection stats={data} index={1} />
        </>
      )}
    </div>
  )
}
