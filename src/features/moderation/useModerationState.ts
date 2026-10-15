import { useQuery } from '@tanstack/react-query'
import { getModerationState } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import { useModerationStore } from '../../store/moderationStore'
import type { ModerationStatus } from '../../types'

export interface EffectiveModeration {
  status: ModerationStatus
  suspendedUntil: string | null
  warningCount: number
  isAdmin: boolean
  isLoaded: boolean
}

/** The signed-in user's moderation status. A 403 seen by any request (see the
 *  response interceptor in apiClient) overrides the polled value immediately. */
export function useModerationState(): EffectiveModeration {
  const user = useAuthStore((s) => s.user)
  const override = useModerationStore((s) => s.statusOverride)
  const userId = user?.id ?? null

  const { data, isSuccess } = useQuery({
    queryKey: ['moderation', 'me'],
    // A fresh answer from the server supersedes whatever a 403 told us earlier.
    queryFn: async () => {
      const state = await getModerationState()
      useModerationStore.setState({ statusOverride: null })
      return state
    },
    enabled: !!userId,
    staleTime: 30_000,
    // While restricted, keep checking so the screen lifts once an admin acts
    // or a suspension runs out.
    refetchInterval: (query) => (query.state.data && query.state.data.status !== 'active' ? 60_000 : false),
    refetchOnWindowFocus: true,
  })

  const status = override?.status ?? data?.status ?? 'active'
  return {
    status,
    suspendedUntil: override?.status === 'suspended' ? override.suspendedUntil : (data?.suspended_until ?? null),
    warningCount: data?.warning_count ?? 0,
    isAdmin: Boolean(data?.is_admin),
    isLoaded: !userId || isSuccess,
  }
}
