import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveDeletion,
  getAdminOverview,
  liftSuspension,
  rejectDeletion,
} from '../../services/apiClient'
import PrimaryButton from '../../components/PrimaryButton'
import NotFoundPage from '../../pages/NotFoundPage'
import { usePageMeta } from '../../hooks/usePageMeta'
import type { AdminUser, DeletionRequest, ModerationEvent } from '../../types'
import { useModerationState } from './useModerationState'

type Warnings = 0 | 1 | 2
const WARNING_CHOICES: Warnings[] = [0, 1, 2]

const ACTION_LABELS: Record<ModerationEvent['action'], string> = {
  warning: 'Warned',
  suspension: 'Suspended',
  block: 'Blocked',
  suspension_lifted: 'Suspension lifted',
  warnings_set: 'Warnings changed',
  restored: 'Account restored',
  deleted: 'Account deleted',
}

function when(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function EventList({ events }: { events: ModerationEvent[] }) {
  if (events.length === 0) return <p className="text-xs text-gray-muted">No history.</p>
  return (
    <ul className="flex flex-col gap-2">
      {events.map((e) => (
        <li key={e.id} className="rounded-card border border-white/10 bg-black/20 p-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-gray-light">
            <span className="font-semibold">
              {ACTION_LABELS[e.action]}
              {e.category ? ` · ${e.category}` : ''}
            </span>
            <span className="text-gray-muted">{when(e.created_at)}</span>
          </div>
          {e.flagged_text && <p className="mt-1.5 break-words italic text-gray-medium">“{e.flagged_text}”</p>}
          {e.note && <p className="mt-1 text-gray-muted">{e.note}</p>}
        </li>
      ))}
    </ul>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="panel-card flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-teal">
        {title}
        {count !== undefined && <span className="ml-2 text-gray-muted">({count})</span>}
      </h2>
      {children}
    </section>
  )
}

function DeletionCard({ request, onDone }: { request: DeletionRequest; onDone: () => void }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const approve = useMutation({ mutationFn: () => approveDeletion(request.id), onSuccess: onDone })
  const reject = useMutation({ mutationFn: (w: Warnings) => rejectDeletion(request.id, w), onSuccess: onDone })
  const busy = approve.isPending || reject.isPending

  return (
    <article className="flex flex-col gap-3 rounded-card border border-pink-brand/30 bg-black/20 p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-lighter">{request.username ?? request.user_id}</h3>
        <span className="text-xs text-gray-muted">Blocked {when(request.created_at)}</span>
      </header>
      <EventList events={request.events} />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-muted">Give the account back with…</p>
        <div className="flex flex-wrap gap-2">
          {WARNING_CHOICES.map((w) => (
            <PrimaryButton key={w} variant="secondary" disabled={busy} isLoading={reject.isPending && reject.variables === w} onClick={() => reject.mutate(w)}>
              {w} {w === 1 ? 'warning' : 'warnings'}
            </PrimaryButton>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        {confirmingDelete ? (
          <>
            <span className="text-xs text-pink-brand">Permanently delete this account and all its data?</span>
            <PrimaryButton variant="danger" disabled={busy} isLoading={approve.isPending} onClick={() => approve.mutate()}>
              Yes, delete
            </PrimaryButton>
            <PrimaryButton variant="secondary" disabled={busy} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton variant="danger" disabled={busy} onClick={() => setConfirmingDelete(true)}>
            Approve deletion
          </PrimaryButton>
        )}
      </div>
      {(approve.isError || reject.isError) && <p className="text-xs text-pink-brand">That didn't work. Try again.</p>}
    </article>
  )
}

function SuspendedRow({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [warnings, setWarnings] = useState<Warnings>(Math.min(2, user.warning_count) as Warnings)
  const lift = useMutation({
    mutationFn: async () => {
      await liftSuspension(user.id, warnings)
    },
    onSuccess: onDone,
  })
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-white/10 bg-black/20 p-3">
      <div className="text-sm">
        <p className="font-semibold text-gray-lighter">{user.username ?? user.id}</p>
        <p className="text-xs text-gray-muted">Suspended until {when(user.suspended_until)}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-muted">
          Warnings after
          <select
            value={warnings}
            onChange={(e) => setWarnings(Number(e.target.value) as Warnings)}
            className="rounded-card border border-white/15 bg-navy px-2 py-1.5 text-sm text-gray-lighter"
          >
            {WARNING_CHOICES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <PrimaryButton isLoading={lift.isPending} onClick={() => lift.mutate()}>
          Lift suspension
        </PrimaryButton>
      </div>
      {lift.isError && <p className="w-full text-xs text-pink-brand">That didn't work. Try again.</p>}
    </li>
  )
}

export default function AdminPage() {
  usePageMeta({ title: 'Admin', noindex: true })
  const { isAdmin, isLoaded } = useModerationState()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: getAdminOverview,
    enabled: isAdmin,
    refetchInterval: 60_000,
  })

  if (!isLoaded) return null
  if (!isAdmin) return <NotFoundPage />

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
  }
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-lighter">Moderation</h1>
        <PrimaryButton variant="secondary" onClick={() => void refetch()}>
          Refresh
        </PrimaryButton>
      </div>

      {isLoading && <p className="text-sm text-gray-muted">Loading…</p>}
      {isError && <p className="text-sm text-pink-brand">Couldn't load the moderation queue. Try refreshing.</p>}

      {data && (
        <>
          <Section title="Blocked accounts awaiting your decision" count={data.pending_deletions.length}>
            {data.pending_deletions.length === 0 ? (
              <p className="text-sm text-gray-muted">Nothing waiting.</p>
            ) : (
              data.pending_deletions.map((r) => <DeletionCard key={r.id} request={r} onDone={refresh} />)
            )}
          </Section>

          <Section title="Suspended accounts" count={data.suspended.length}>
            {data.suspended.length === 0 ? (
              <p className="text-sm text-gray-muted">No one is suspended.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.suspended.map((u) => (
                  <SuspendedRow key={u.id} user={u} onDone={refresh} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Recent activity">
            {data.recent_events.length === 0 ? (
              <p className="text-sm text-gray-muted">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.recent_events.map((e) => (
                  <li key={e.id} className="text-xs text-gray-light">
                    <span className="font-semibold">{e.username ?? e.user_id}</span> · {ACTION_LABELS[e.action]}
                    {e.category ? ` (${e.category})` : ''}
                    <span className="ml-2 text-gray-muted">{when(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </main>
  )
}
