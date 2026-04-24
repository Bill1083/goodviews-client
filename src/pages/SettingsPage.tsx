import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../index.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { getProfile, updateProfile } from '../services/apiClient'
import type { ProfileData } from '../services/apiClient'

export default function SettingsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const visibilityMutation = useMutation({
    mutationFn: (vis: ProfileData['profile_visibility']) =>
      updateProfile({ profile_visibility: vis }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const currentVisibility = profile?.profile_visibility ?? 'friends_only'

  return (
    <main className="mx-auto flex max-w-4xl flex-col px-6 py-10 gap-8">
      {/* Header */}
      <div className="flex items-center gap-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-20 w-20 text-gray-lighter shrink-0"
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
        <h1 className="text-4xl font-bold text-gray-lighter flex-1">Settings</h1>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
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
        

        {/* Settings Option 1 */}
        <div className="flex items-center py-5">
          <span className="text-base text-gray-light">Settings Option 1</span>
        </div>

        {/* Profile visibility */}
        <div className="flex items-center justify-between py-5">
          <span className="text-base text-gray-light">Decide Who sees your Profile</span>
          <div className="relative">
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

        {/* Settings Option 2 */}
        <div className="flex items-center py-5">
          <span className="text-base text-gray-light">Settings Option 2</span>
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
    </main>
  )
}