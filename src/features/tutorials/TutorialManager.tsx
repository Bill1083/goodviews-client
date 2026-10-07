import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, markTutorialSeen } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import { useTutorialReplayStore } from '../../store/tutorialReplayStore'
import { TUTORIALS } from './registry'
import TutorialIntroToast from './TutorialIntroToast'
import SpotlightTour from './SpotlightTour'

/** Mounted once near the app root — the only place a tutorial is ever
 *  rendered from, since a spotlight tour can navigate between pages
 *  mid-tour and needs to survive that, which a component nested inside one
 *  particular page (e.g. the Help modal that requests a replay) can't.
 *
 *  Two ways a tutorial gets here:
 *  - Automatically: at most one eligible tutorial at a time, oldest-shipped
 *    first. Eligible = the account existed before that tutorial's
 *    shippedAt and hasn't dismissed it yet — a brand-new signup is always
 *    younger than every shippedAt, so this never shows them anything.
 *  - Voluntarily: TutorialsHelpModal hands off a key via
 *    tutorialReplayStore, which jumps the queue and skips the intro toast
 *    (they already asked for it) straight to the spotlight. */
export default function TutorialManager() {
  const session = useAuthStore((s) => s.session)
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded)
  const qc = useQueryClient()
  const replayKey = useTutorialReplayStore((s) => s.replayKey)
  const clearReplay = useTutorialReplayStore((s) => s.clearReplay)

  // Hides a tutorial the instant it's dismissed, rather than waiting on the
  // markTutorialSeen round-trip + profile refetch.
  const [dismissedThisSession, setDismissedThisSession] = useState<Set<string>>(new Set())
  const [touring, setTouring] = useState<string | null>(null)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!session && hasOnboarded === true,
  })

  const dismissMutation = useMutation({
    mutationFn: (key: string) => markTutorialSeen(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  const replayTutorial = TUTORIALS.find((t) => t.key === replayKey)
  if (replayTutorial) {
    return (
      <SpotlightTour
        key={`replay-${replayTutorial.key}`}
        steps={replayTutorial.spotlights}
        onDone={() => {
          clearReplay()
          dismissMutation.mutate(replayTutorial.key)
        }}
      />
    )
  }

  if (!profile?.created_at) return null

  const createdAt = new Date(profile.created_at).getTime()
  const seen = new Set(profile.seen_tutorials ?? [])
  const next = TUTORIALS
    .filter((t) => createdAt < new Date(t.shippedAt).getTime())
    .filter((t) => !seen.has(t.key) && !dismissedThisSession.has(t.key))
    .sort((a, b) => new Date(a.shippedAt).getTime() - new Date(b.shippedAt).getTime())[0]

  if (!next) return null

  const finish = () => {
    setDismissedThisSession((prev) => new Set(prev).add(next.key))
    setTouring(null)
    dismissMutation.mutate(next.key)
  }

  if (touring === next.key) {
    return <SpotlightTour key={next.key} steps={next.spotlights} onDone={finish} />
  }

  return (
    <TutorialIntroToast
      key={next.key}
      text={next.intro}
      onShowMe={() => setTouring(next.key)}
      onDismiss={finish}
    />
  )
}
