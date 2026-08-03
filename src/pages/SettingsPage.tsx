import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../index.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { getProfile, updateProfile, deleteAccount } from '../services/apiClient'
import type { ProfileData } from '../services/apiClient'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export default function SettingsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMismatch, setPasswordMismatch] = useState(false)

  useBodyScrollLock(showSignOutConfirm || showDeleteConfirm)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

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
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
    },
    onSuccess: () => setNewEmail(''),
  })

  const passwordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: () => {
      setNewPassword('')
      setConfirmPassword('')
    },
  })

  const handleUpdateEmail = () => {
    if (!newEmail.trim()) return
    emailMutation.mutate(newEmail.trim())
  }

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    if (!newPassword) return
    passwordMutation.mutate(newPassword)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteAccount(deleteConfirmInput),
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
      <div className="flex flex-col divide-y divide-white/10">

        <p className="pt-1 text-xs font-medium text-gray-muted uppercase tracking-wide">Privacy</p>

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

        <p className="pt-1 text-xs font-medium text-gray-muted uppercase tracking-wide">Notifications</p>

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

        <p className="pt-1 text-xs font-medium text-gray-muted uppercase tracking-wide">Account</p>

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
            <button
              onClick={handleUpdateEmail}
              disabled={!newEmail.trim() || emailMutation.isPending}
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
              onChange={(e) => { setNewPassword(e.target.value); setPasswordMismatch(false) }}
              placeholder="New password"
              autoComplete="new-password"
              className="input-base flex-1 min-w-[160px]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMismatch(false) }}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="input-base flex-1 min-w-[160px]"
            />
            <button
              onClick={handleUpdatePassword}
              disabled={!newPassword || !confirmPassword || passwordMutation.isPending}
              className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordMutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </div>
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

        {/* Delete Account */}
        <div className="flex items-center py-5">
          <button
            onClick={() => { setDeleteConfirmInput(''); setShowDeleteConfirm(true) }}
            className="text-base text-red-400 hover:text-red-300 transition-colors"
          >
            Delete Account
          </button>
        </div>
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
            {deleteAccountMutation.isError && (
              <p className="text-xs text-red-400">
                {(deleteAccountMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong. Please try again.'}
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
                disabled={deleteConfirmInput !== profile?.username || deleteAccountMutation.isPending}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-sm text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteAccountMutation.isPending ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}