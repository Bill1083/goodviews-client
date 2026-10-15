import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../services/supabaseClient'
import { useModerationStore } from '../../store/moderationStore'
import { useAuthStore } from '../../store/authStore'
import PrimaryButton from '../../components/PrimaryButton'
import { useModerationState } from './useModerationState'

const NOTICE_TITLES = {
  warning: 'Comment removed',
  suspension: 'Account suspended',
  block: 'Account blocked',
} as const

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="panel-card flex w-full max-w-md flex-col gap-4 bg-navy p-6">{children}</div>
    </div>
  )
}

/** Mounted once in App. Shows the one-off "your comment was removed" dialog, a
 *  banner while suspended, and a full-screen wall while blocked. */
export default function ModerationGate() {
  const user = useAuthStore((s) => s.user)
  const { status, suspendedUntil } = useModerationState()
  const notice = useModerationStore((s) => s.notice)
  const dismissNotice = useModerationStore((s) => s.dismissNotice)
  const reset = useModerationStore((s) => s.reset)
  const queryClient = useQueryClient()
  const userId = user?.id ?? null

  // Another account signing in must not inherit the last one's notice/status.
  useEffect(() => {
    reset()
    queryClient.removeQueries({ queryKey: ['moderation', 'me'] })
  }, [userId, reset, queryClient])

  // Lock page scroll behind the blocking screen.
  const blocked = Boolean(user) && status === 'blocked'
  useEffect(() => {
    if (!blocked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [blocked])

  if (!user) return null

  if (blocked) {
    return (
      <Overlay>
        <h2 className="text-xl font-bold text-pink-brand">Your account is blocked</h2>
        <p className="text-sm leading-relaxed text-gray-light">
          Your account was blocked after repeated breaches of our community guidelines (hate speech or strong
          profanity in reviews). An admin will review it and decide whether it is deleted or restored. This
          screen will clear by itself if the account is restored.
        </p>
        <PrimaryButton
          variant="secondary"
          onClick={async () => {
            await supabase.auth.signOut()
            queryClient.clear()
          }}
        >
          Sign out
        </PrimaryButton>
      </Overlay>
    )
  }

  return (
    <>
      {status === 'suspended' && (
        <div className="border-b border-pink-brand/40 bg-pink-brand/10 px-4 py-2 text-center text-sm text-pink-brand">
          Your account is suspended{suspendedUntil ? ` until ${formatDate(suspendedUntil)}` : ''}. You can browse, but you
          can't post or edit reviews.
        </div>
      )}
      {notice && (
        <Overlay>
          <h2 className={`text-xl font-bold ${notice.action === 'warning' ? 'text-teal' : 'text-pink-brand'}`}>
            {NOTICE_TITLES[notice.action]}
          </h2>
          <p className="text-sm leading-relaxed text-gray-light">{notice.message}</p>
          {notice.action === 'suspension' && notice.suspended_until && (
            <p className="text-xs text-gray-medium">Suspension ends {formatDate(notice.suspended_until)}.</p>
          )}
          <PrimaryButton
            onClick={() => {
              dismissNotice()
              void queryClient.invalidateQueries({ queryKey: ['moderation', 'me'] })
            }}
          >
            I understand
          </PrimaryButton>
        </Overlay>
      )}
    </>
  )
}
