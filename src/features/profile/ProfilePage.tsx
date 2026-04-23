import { useAuthStore } from '../../store/authStore'

export default function ProfilePage() {
  const { user } = useAuthStore()

  const username =
    (user?.user_metadata?.['username'] as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User'

  const initials = username.slice(0, 2).toUpperCase()

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
      {/* Profile header */}
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-avatar text-2xl font-bold text-navy">
          {initials}
        </div>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-3xl font-bold text-gray-lighter">{username}</h1>
          <p className="text-sm text-gray-muted">{user?.email}</p>
          <p className="mt-1 text-sm text-gray-light/60 italic">About: No bio set yet.</p>
        </div>
        {/* Edit icon */}
        <button className="ml-auto self-start rounded-full p-2 text-gray-muted hover:bg-white/5 hover:text-gray-lighter transition-colors" title="Edit profile">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.364-6.364a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z" />
          </svg>
        </button>
      </div>

      {/* Content row */}
      <div className="flex gap-6">
        {/* Friends list */}
        <div className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-navy-card/60 p-5">
          <h2 className="text-sm font-semibold text-gray-lighter">Friends List</h2>
          {/* Search friends */}
          <input
            type="text"
            placeholder="Search friends…"
            className="input-base text-sm"
          />
          {/* Empty state */}
          <p className="text-xs text-gray-muted/60 italic">No friends added yet.</p>
        </div>

        {/* Right column */}
        <div className="flex flex-1 flex-col gap-3">
          <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-navy-card/60 px-5 py-4 text-left text-sm font-medium text-gray-lighter hover:bg-white/5 transition-colors">
            My Movie Categories
            <span className="text-gray-muted">›</span>
          </button>
          <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-navy-card/60 px-5 py-4 text-left text-sm font-medium text-gray-lighter hover:bg-white/5 transition-colors">
            My Friend Groups
            <span className="text-gray-muted">›</span>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="flex justify-end">
        <button className="rounded-full p-2 text-gray-muted hover:bg-white/5 hover:text-gray-lighter transition-colors" title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </main>
  )
}
