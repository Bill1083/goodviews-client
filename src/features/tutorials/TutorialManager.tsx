import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, markTutorialSeen } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import { TUTORIALS } from './registry'
import TutorialModal from './TutorialModal'

/** Mounted once near the app root. Shows at most one tutorial at a time,
 *  queued oldest-shipped-first, for accounts that already existed before a
 *  given feature shipped and haven't dismissed it yet — a brand-new signup
 *  is always younger than every tutorial's shippedAt, so this never shows
 *  them anything (see registry.ts). Gated on has_onboarded so it can't pop
 *  up mid-onboarding-wizard or before a session exists. */
export default function TutorialManager() {
  const session = useAuthStore((s) => s.session)
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded)
  const qc = useQueryClient()
  // Hides a tutorial the instant its close button is clicked, rather than
  // waiting on the markTutorialSeen round-trip + profile refetch.
  const [dismissedThisSession, setDismissedThisSession] = useState<Set<string>>(new Set())

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!session && hasOnboarded === true,
  })

  const dismissMutation = useMutation({
    mutationFn: (key: string) => markTutorialSeen(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  if (!profile?.created_at) return null

  const createdAt = new Date(profile.created_at).getTime()
  const seen = new Set(profile.seen_tutorials ?? [])
  const next = TUTORIALS
    .filter((t) => createdAt < new Date(t.shippedAt).getTime())
    .filter((t) => !seen.has(t.key) && !dismissedThisSession.has(t.key))
    .sort((a, b) => new Date(a.shippedAt).getTime() - new Date(b.shippedAt).getTime())[0]

  if (!next) return null

  return (
    <TutorialModal
      key={next.key}
      tutorial={next}
      onClose={() => {
        setDismissedThisSession((prev) => new Set(prev).add(next.key))
        dismissMutation.mutate(next.key)
      }}
    />
  )
}
