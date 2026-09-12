import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../index.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { getProfile, updateProfile, deleteAccount } from '../services/apiClient'
import type { ProfileData } from '../services/apiClient'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useAuthStore } from '../store/authStore'
import { verifyReauth } from '../utils/mfa'
import { PASSWORD_HINT, PASSWORD_MAX_LENGTH, validatePassword } from '../utils/passwordPolicy'
import ReauthField from '../components/ReauthField'

function SectionHeading({ icon, tone = 'teal', children }: { icon: React.ReactNode; tone?: 'teal' | 'red'; children: React.ReactNode }) {
  return (
    <div className={`mb-4 flex items-center gap-2 ${tone === 'red' ? 'text-red-400' : 'text-teal'}`}>
      {icon}
      <h2 className="text-sm font-semibold uppercase tracking-wide">{children}</h2>
    </div>
  )
}

const iconClass = 'h-4 w-4'
const iconProps = { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2, className: iconClass } as const

const PrivacyIcon = () => (
  <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
)
const NotificationsIcon = () => (
  <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
)
const SecurityIcon = () => (
  <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
)
const AccountIcon = () => (
  <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
)
const DangerIcon = () => (
  <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
)

export default function SettingsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const userEmail = useAuthStore((s) => s.user?.email) ?? ''
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleteReauth, setDeleteReauth] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailReauth, setEmailReauth] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordReauth, setPasswordReauth] = useState('')
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const [passwordPolicyError, setPasswordPolicyError] = useState<string | null>(null)

  // Two-factor (TOTP) enrollment flow
  const [enrolling, setEnrolling] = useState(false)
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null)
  const [enrollQr, setEnrollQr] = useState<string | null>(null)
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null)
  const [enrollCode, setEnrollCode] = useState('')
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [showDisableMfaConfirm, setShowDisableMfaConfirm] = useState(false)

  useBodyScrollLock(showSignOutConfirm || showDeleteConfirm || showDisableMfaConfirm)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: mfaFactors } = useQuery({
    queryKey: ['mfa-factors'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      return data
    },
  })
  const verifiedTotp = mfaFactors?.totp.find((f) => f.status === 'verified')
  const hasMfa = !!verifiedTotp

  const visibilityMutation = useMutation({
    mutationFn: (vis: ProfileData['profile_visibility']) =>
      updateProfile({ profile_visibility: vis }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  const hideRecentMutation = useMutation({
    mutationFn: (val: boolean) => updateProfile({ hide_recent_movies: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  const muteRecommendationsMutation = useMutation({
    mutationFn: (val: boolean) => updateProfile({ mute_recommendations: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  const muteFriendRequestsMutation = useMutation({
    mutationFn: (val: boolean) => updateProfile({ mute_friend_requests: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  const emailMutation = useMutation({
    mutationFn: async (email: string) => {
      const reauthError = await verifyReauth(hasMfa, userEmail, emailReauth)
      if (reauthError) throw new Error(reauthError)
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
    },
    onSuccess: () => {
      setNewEmail('')
      setEmailReauth('')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async (password: string) => {
      // GoTrue's own GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD checks the
      // literal current_password field server-side, independent of MFA/session status —
      // so this one field is always the actual password, never a TOTP code.
      const { error } = await supabase.auth.updateUser({ password, current_password: passwordReauth })
      if (error) throw error
    },
    onSuccess: () => {
      setNewPassword('')
      setConfirmPassword('')
      setPasswordReauth('')
    },
  })

  const handleUpdateEmail = () => {
    if (!newEmail.trim() || !emailReauth) return
    emailMutation.mutate(newEmail.trim())
  }

  const handleUpdatePassword = () => {
    const policyError = validatePassword(newPassword)
    if (policyError) {
      setPasswordPolicyError(policyError)
      setPasswordMismatch(false)
      return
    }
    setPasswordPolicyError(null)
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    if (!passwordReauth) return
    passwordMutation.mutate(newPassword)
  }

  const startMfaEnroll = async () => {
    setEnrollError(null)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) {
      setEnrollError(error.message)
      return
    }
    setEnrollFactorId(data.id)
    setEnrollQr(data.totp.qr_code)
    setEnrollSecret(data.totp.secret)
    setEnrolling(true)
  }

  const cancelMfaEnroll = async () => {
    if (enrollFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: enrollFactorId }).catch(() => {})
    }
    setEnrolling(false)
    setEnrollFactorId(null)
    setEnrollQr(null)
    setEnrollSecret(null)
    setEnrollCode('')
    setEnrollError(null)
  }

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!enrollFactorId) throw new Error('Enrollment expired — please try again.')
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollFactorId, code: enrollCode })
      if (error) throw error
    },
    onSuccess: () => {
      setEnrolling(false)
      setEnrollFactorId(null)
      setEnrollQr(null)
      setEnrollSecret(null)
      setEnrollCode('')
      qc.invalidateQueries({ queryKey: ['mfa-factors'] })
    },
  })

  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      if (!verifiedTotp) return
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedTotp.id })
      if (error) throw error
    },
    onSuccess: () => {
      setShowDisableMfaConfirm(false)
      qc.invalidateQueries({ queryKey: ['mfa-factors'] })
    },
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const reauthError = await verifyReauth(hasMfa, userEmail, deleteReauth)
      if (reauthError) throw new Error(reauthError)
      await deleteAccount(deleteConfirmInput)
    },
    onSuccess: async () => {
      await supabase.auth.signOut()
      navigate('/auth')
    },
  })

  const currentVisibility = profile?.profile_visibility ?? 'friends_only'

  return (
    <main className="mx-auto flex max-w-4xl flex-col px-4 py-8 gap-6 sm:px-6 sm:py-10 sm:gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-lighter shrink-0 sm:h-20 sm:w-20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-lighter flex-1 min-w-[140px] sm:text-4xl">Settings</h1>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors sm:px-5 sm:py-2.5"
          style={{ backgroundColor: '#7c1e4e' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Settings list */}
      <div className="flex flex-col gap-6 sm:gap-8">

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading icon={<PrivacyIcon />}>Privacy</SectionHeading>
        <div className="flex flex-col divide-y divide-white/10">

        {/* Profile visibility */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <span className="text-base text-gray-light">Decide Who sees your Profile</span>
          <div className="relative shrink-0">
            <select
              value={currentVisibility}
              onChange={(e) =>
                visibilityMutation.mutate(e.target.value as ProfileData['profile_visibility'])
              }
              className="appearance-none pl-4 pr-10 py-3 rounded-lg text-sm font-medium text-gray-lighter cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal/50 transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <option className="custom-option" value="no_one">No one</option>
              <option className="custom-option" value="friends_only">Friends only</option>
              <option className="custom-option" value="everyone">Everyone</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-muted">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Hide recent movies */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-base text-gray-light">Hide recent Movies</span>
            <p className="text-xs text-gray-muted mt-0.5">Prevents your recently watched movies from appearing in friends' activity feeds</p>
          </div>
          <button
            onClick={() => hideRecentMutation.mutate(!(profile?.hide_recent_movies ?? false))}
            className={['relative w-12 h-6 rounded-full transition-colors shrink-0', profile?.hide_recent_movies ? 'bg-teal' : 'bg-white/20'].join(' ')}
            role="switch"
            aria-checked={profile?.hide_recent_movies ?? false}
          >
            <span className={['absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', profile?.hide_recent_movies ? 'translate-x-6' : ''].join(' ')} />
          </button>
        </div>
        </div>
      </section>

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading icon={<NotificationsIcon />}>Notifications</SectionHeading>
        <div className="flex flex-col divide-y divide-white/10">

        {/* Mute recommendation alerts */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-base text-gray-light">Mute Recommendation Alerts</span>
            <p className="text-xs text-gray-muted mt-0.5">Stop notifying you when friends recommend a movie to you</p>
          </div>
          <button
            onClick={() => muteRecommendationsMutation.mutate(!(profile?.mute_recommendations ?? false))}
            className={['relative w-12 h-6 rounded-full transition-colors shrink-0', profile?.mute_recommendations ? 'bg-teal' : 'bg-white/20'].join(' ')}
            role="switch"
            aria-checked={profile?.mute_recommendations ?? false}
          >
            <span className={['absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', profile?.mute_recommendations ? 'translate-x-6' : ''].join(' ')} />
          </button>
        </div>

        {/* Mute friend request alerts */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-base text-gray-light">Mute Friend Request Alerts</span>
            <p className="text-xs text-gray-muted mt-0.5">Stop notifying you when someone sends you a friend request</p>
          </div>
          <button
            onClick={() => muteFriendRequestsMutation.mutate(!(profile?.mute_friend_requests ?? false))}
            className={['relative w-12 h-6 rounded-full transition-colors shrink-0', profile?.mute_friend_requests ? 'bg-teal' : 'bg-white/20'].join(' ')}
            role="switch"
            aria-checked={profile?.mute_friend_requests ?? false}
          >
            <span className={['absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', profile?.mute_friend_requests ? 'translate-x-6' : ''].join(' ')} />
          </button>
        </div>
        </div>
      </section>

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading icon={<SecurityIcon />}>Security</SectionHeading>
        <div className="flex flex-col divide-y divide-white/10">

        {/* Two-factor authentication */}
        <div className="flex flex-col gap-3 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <span className="text-base text-gray-light">Two-Factor Authentication</span>
              <p className="text-xs text-gray-muted mt-0.5">
                {hasMfa
                  ? 'Enabled — an authenticator code is required to sign in and to change sensitive account settings.'
                  : 'Add an authenticator app as a second sign-in step, for stronger account protection.'}
              </p>
            </div>
            {hasMfa ? (
              <button
                onClick={() => setShowDisableMfaConfirm(true)}
                className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors shrink-0"
              >
                Disable
              </button>
            ) : !enrolling ? (
              <button
                onClick={startMfaEnroll}
                className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors shrink-0"
              >
                Enable
              </button>
            ) : null}
          </div>

          {enrollError && <p className="text-xs text-red-400">{enrollError}</p>}

          {enrolling && enrollQr && (
            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-navy-card/40 p-4 sm:flex-row sm:items-start">
              <img
                src={enrollQr}
                alt="Authenticator QR code"
                className="h-32 w-32 shrink-0 self-center rounded bg-white p-1.5 sm:self-start"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-xs text-gray-muted">
                  Scan this with an authenticator app (Google Authenticator, Authy, 1Password…), or enter the code manually:
                </p>
                {enrollSecret && (
                  <code className="break-all rounded bg-black/30 px-2 py-1 text-xs text-gray-light">{enrollSecret}</code>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={enrollCode}
                    onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="input-base w-32 text-center tracking-[0.3em]"
                  />
                  <button
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollCode.length !== 6 || enrollMutation.isPending}
                    className="px-5 py-2 rounded-full bg-teal text-navy text-sm font-semibold hover:bg-teal-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrollMutation.isPending ? 'Verifying…' : 'Verify & Enable'}
                  </button>
                  <button
                    onClick={cancelMfaEnroll}
                    className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {enrollMutation.isError && (
                  <p className="text-xs text-red-400">
                    {(enrollMutation.error as { message?: string })?.message ?? 'Invalid code. Please try again.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </section>

      <section className="panel-card p-5 sm:p-6">
        <SectionHeading icon={<AccountIcon />}>Account</SectionHeading>
        <div className="flex flex-col divide-y divide-white/10">

        {/* Change email */}
        <div className="flex flex-col gap-2 py-5">
          <span className="text-base text-gray-light">Change Email</span>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email address"
              autoComplete="email"
              className="input-base flex-1 min-w-[200px]"
            />
          </div>
          <div className="max-w-xs">
            <ReauthField hasMfa={hasMfa} value={emailReauth} onChange={setEmailReauth} />
          </div>
          <div>
            <button
              onClick={handleUpdateEmail}
              disabled={!newEmail.trim() || !emailReauth || emailMutation.isPending}
              className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailMutation.isPending ? 'Updating…' : 'Update Email'}
            </button>
          </div>
          {emailMutation.isSuccess && (
            <p className="text-xs text-teal">Confirmation link sent to your new email — check your inbox to finish the change.</p>
          )}
          {emailMutation.isError && (
            <p className="text-xs text-red-400">
              {(emailMutation.error as { message?: string })?.message ?? 'Failed to update email. Please try again.'}
            </p>
          )}
        </div>

        {/* Change password */}
        <div className="flex flex-col gap-2 py-5">
          <span className="text-base text-gray-light">Change Password</span>
          <div className="flex flex-wrap gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordMismatch(false); setPasswordPolicyError(null) }}
              placeholder="New password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              className="input-base flex-1 min-w-[160px]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMismatch(false) }}
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="input-base flex-1 min-w-[160px]"
            />
          </div>
          <p className="text-xs text-gray-muted">{PASSWORD_HINT}</p>
          <div className="max-w-xs">
            {/* Always the real password here — GoTrue validates current_password server-side
                regardless of MFA, so a TOTP code wouldn't satisfy it. */}
            <ReauthField hasMfa={false} value={passwordReauth} onChange={setPasswordReauth} />
          </div>
          <div>
            <button
              onClick={handleUpdatePassword}
              disabled={!newPassword || !confirmPassword || !passwordReauth || passwordMutation.isPending}
              className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordMutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </div>
          {passwordPolicyError && <p className="text-xs text-red-400">{passwordPolicyError}</p>}
          {passwordMismatch && <p className="text-xs text-red-400">Passwords don't match.</p>}
          {passwordMutation.isSuccess && <p className="text-xs text-teal">Password updated successfully.</p>}
          {passwordMutation.isError && (
            <p className="text-xs text-red-400">
              {(passwordMutation.error as { message?: string })?.message ?? 'Failed to update password. Please try again.'}
            </p>
          )}
        </div>

        {/* Logout */}
        <div className="flex items-center py-5">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="text-base text-gray-light hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
        </div>
      </section>

      <div className="flex justify-center">
        <Link to="/about" className="text-sm text-gray-muted hover:text-gray-lighter transition-colors">
          About GoodViews &amp; TMDB attribution
        </Link>
      </div>

      <section className="panel-card border-red-500/20 p-5 sm:p-6">
        <SectionHeading icon={<DangerIcon />} tone="red">Danger Zone</SectionHeading>
        <div className="flex items-center">
          <button
            onClick={() => { setDeleteConfirmInput(''); setDeleteReauth(''); setShowDeleteConfirm(true) }}
            className="text-base text-red-400 hover:text-red-300 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </section>

      </div>

      {/* Sign-out confirmation dialog */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-dark/60 backdrop-blur-sm px-4"
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            className="panel-card dialog-scale-in flex max-w-sm w-full flex-col gap-5 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-gray-lighter">Sign out of GoodViews?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-5 py-2 rounded-full bg-pink-brand hover:bg-pink-brand/80 text-sm text-white font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-dark/60 backdrop-blur-sm px-4"
          onClick={() => { if (!deleteAccountMutation.isPending) setShowDeleteConfirm(false) }}
        >
          <div
            className="panel-card dialog-scale-in flex max-w-sm w-full flex-col gap-5 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-red-400">Delete Account</p>
              <p className="text-sm text-gray-muted">
                This will permanently delete your account, all your reviews, watchlist, friends, and every other piece of data. This cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
                Type your username <span className="normal-case text-gray-lighter font-semibold">({profile?.username})</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={profile?.username ?? ''}
                autoComplete="off"
                className="input-base"
                disabled={deleteAccountMutation.isPending}
              />
            </div>
            <ReauthField hasMfa={hasMfa} value={deleteReauth} onChange={setDeleteReauth} />
            {deleteAccountMutation.isError && (
              <p className="text-xs text-red-400">
                {(deleteAccountMutation.error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error
                  ?? (deleteAccountMutation.error as { message?: string })?.message
                  ?? 'Something went wrong. Please try again.'}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteAccountMutation.isPending}
                className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteConfirmInput !== profile?.username || !deleteReauth || deleteAccountMutation.isPending}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-sm text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteAccountMutation.isPending ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA confirmation dialog */}
      {showDisableMfaConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-dark/60 backdrop-blur-sm px-4"
          onClick={() => { if (!disableMfaMutation.isPending) setShowDisableMfaConfirm(false) }}
        >
          <div
            className="panel-card dialog-scale-in flex max-w-sm w-full flex-col gap-5 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-red-400">Disable Two-Factor Authentication?</p>
              <p className="text-sm text-gray-muted">
                Your account will only be protected by your password. You can re-enable it any time.
              </p>
            </div>
            {disableMfaMutation.isError && (
              <p className="text-xs text-red-400">
                {(disableMfaMutation.error as { message?: string })?.message ?? 'Something went wrong. Please try again.'}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDisableMfaConfirm(false)}
                disabled={disableMfaMutation.isPending}
                className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => disableMfaMutation.mutate()}
                disabled={disableMfaMutation.isPending}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-sm text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {disableMfaMutation.isPending ? 'Disabling…' : 'Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}