import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import ColorPicker from '../../components/ColorPicker'
import type { Category, FriendGroup, UserSearchResult } from '../../types'
import {
  getMyCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMyFriendGroups,
  createFriendGroup,
  updateFriendGroup,
  deleteFriendGroup,
  addGroupMember,
  removeGroupMember,
  getMyFriends,
  addFriend,
  removeFriend,
  searchUsers,
  getProfile,
  updateProfile,
} from '../../services/apiClient'

// ─── Pill preview ─────────────────────────────────────────────────────────────
function Pill({
  name,
  outlineColor,
  fillColor,
  onClick,
}: {
  name: string
  outlineColor: string | null
  fillColor: string | null
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:brightness-110"
      style={{
        border: `2px solid ${outlineColor ?? 'rgba(255,255,255,0.3)'}`,
        backgroundColor: fillColor ?? 'transparent',
        color: '#e9e9e9',
      }}
    >
      {name}
    </button>
  )
}

// ─── Color swatch button ──────────────────────────────────────────────────────
function ColorSwatch({
  label,
  color,
  onClick,
}: {
  label: string
  color: string | null
  onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs text-gray-muted">{label}</span>
      <button
        type="button"
        onClick={onClick}
        className="w-9 h-9 rounded-lg border-2 border-white/20 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal/50"
        style={{ backgroundColor: color ?? 'rgba(255,255,255,0.08)' }}
        title={color ?? 'None'}
      />
    </div>
  )
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
type ProfileView = 'default' | 'add-friend' | 'edit-category' | 'edit-group'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const username =
    (user?.user_metadata?.['username'] as string | undefined) ??
    user?.email?.split('@')[0] ??
    'User'

  // ── Profile data ──────────────────────────────────────────────────────────
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  // ── Profile editing state ─────────────────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatarColor, setEditAvatarColor] = useState<string | null>(null)
  const [showAvatarColorPicker, setShowAvatarColorPicker] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null)

  function openProfileEdit() {
    setEditUsername(profileData?.username ?? username)
    setEditBio(profileData?.bio ?? '')
    setEditAvatarColor(profileData?.avatar_color ?? null)
    setProfileSaveError(null)
    setIsEditingProfile(true)
  }

  const profileSaveMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        username: editUsername.trim(),
        bio: editBio.trim() || null,
        avatar_color: editAvatarColor,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setIsEditingProfile(false)
      setProfileSaveError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to save profile'
      setProfileSaveError(msg)
    },
  })

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getMyCategories,
  })
  const { data: groups = [], isLoading: grpsLoading } = useQuery({
    queryKey: ['friend-groups'],
    queryFn: getMyFriendGroups,
  })
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: getMyFriends,
  })

  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView] = useState<ProfileView>('default')
  const [catsOpen, setCatsOpen] = useState(false)
  const [grpsOpen, setGrpsOpen] = useState(false)

  // ── Category editor state ─────────────────────────────────────────────────
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [catOutline, setCatOutline] = useState<string | null>(null)
  const [catFill, setCatFill] = useState<string | null>(null)
  const [catDesc, setCatDesc] = useState('')
  const [showCatOutlinePicker, setShowCatOutlinePicker] = useState(false)
  const [showCatFillPicker, setShowCatFillPicker] = useState(false)

  // ── Group editor state ────────────────────────────────────────────────────
  const [editingGrp, setEditingGrp] = useState<FriendGroup | null>(null)
  const [grpName, setGrpName] = useState('')
  const [grpOutline, setGrpOutline] = useState<string | null>(null)
  const [grpFill, setGrpFill] = useState<string | null>(null)
  const [grpDesc, setGrpDesc] = useState('')
  const [showGrpOutlinePicker, setShowGrpOutlinePicker] = useState(false)
  const [showGrpFillPicker, setShowGrpFillPicker] = useState(false)
  const [grpMembersView, setGrpMembersView] = useState(false)
  const [friendsFilter, setFriendsFilter] = useState('')

  // ── Friend search state ───────────────────────────────────────────────────
  const [friendSearchQ, setFriendSearchQ] = useState('')
  const [friendSearchResults, setFriendSearchResults] = useState<UserSearchResult[]>([])
  const [friendSearchLoading, setFriendSearchLoading] = useState(false)
  const [friendsListFilter, setFriendsListFilter] = useState('')

  // ── Mutations ─────────────────────────────────────────────────────────────
  const catSaveMutation = useMutation({
    mutationFn: () =>
      editingCat
        ? updateCategory(editingCat.id, { name: catName, outline_color: catOutline, fill_color: catFill, description: catDesc || null })
        : createCategory({ name: catName, outline_color: catOutline, fill_color: catFill, description: catDesc || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      openDefaultView()
    },
  })

  const catDeleteMutation = useMutation({
    mutationFn: () => deleteCategory(editingCat!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      openDefaultView()
    },
  })

  const grpSaveMutation = useMutation({
    mutationFn: () =>
      editingGrp
        ? updateFriendGroup(editingGrp.id, { name: grpName, outline_color: grpOutline, fill_color: grpFill, description: grpDesc || null })
        : createFriendGroup({ name: grpName, outline_color: grpOutline, fill_color: grpFill, description: grpDesc || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friend-groups'] })
      openDefaultView()
    },
  })

  const grpDeleteMutation = useMutation({
    mutationFn: () => deleteFriendGroup(editingGrp!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friend-groups'] })
      openDefaultView()
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) => addGroupMember(editingGrp!.id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friend-groups'] }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeGroupMember(editingGrp!.id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friend-groups'] }),
  })

  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => addFriend(friendId),
    onSuccess: (_data, friendId) => {
      qc.invalidateQueries({ queryKey: ['friends'] })
      setFriendSearchResults((prev) =>
        prev.map((r) => (r.id === friendId ? { ...r, is_friend: true } : r)),
      )
    },
  })

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => removeFriend(friendId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openDefaultView() {
    setView('default')
    setEditingCat(null)
    setEditingGrp(null)
    setGrpMembersView(false)
  }

  function openCatEditor(cat?: Category) {
    setEditingCat(cat ?? null)
    setCatName(cat?.name ?? '')
    setCatOutline(cat?.outline_color ?? null)
    setCatFill(cat?.fill_color ?? null)
    setCatDesc(cat?.description ?? '')
    setShowCatOutlinePicker(false)
    setShowCatFillPicker(false)
    setView('edit-category')
  }

  function openGrpEditor(grp?: FriendGroup) {
    setEditingGrp(grp ?? null)
    setGrpName(grp?.name ?? '')
    setGrpOutline(grp?.outline_color ?? null)
    setGrpFill(grp?.fill_color ?? null)
    setGrpDesc(grp?.description ?? '')
    setShowGrpOutlinePicker(false)
    setShowGrpFillPicker(false)
    setGrpMembersView(false)
    setFriendsFilter('')
    setView('edit-group')
  }

  async function handleFriendSearch() {
    if (friendSearchQ.trim().length < 2) return
    setFriendSearchLoading(true)
    try {
      const results = await searchUsers(friendSearchQ.trim())
      setFriendSearchResults(results)
    } finally {
      setFriendSearchLoading(false)
    }
  }

  // ── Current group members (live from query cache) ─────────────────────────
  const liveEditingGrp = editingGrp
    ? groups.find((g) => g.id === editingGrp.id) ?? editingGrp
    : null

  const memberIds = new Set(liveEditingGrp?.members.map((m) => m.id) ?? [])

  // ── Filtered friends ──────────────────────────────────────────────────────
  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(friendsListFilter.toLowerCase()),
  )
  const filteredFriendsForGroup = friends.filter((f) =>
    f.username.toLowerCase().includes(friendsFilter.toLowerCase()),
  )

  // ── Render ────────────────────────────────────────────────────────────────
  const displayUsername = profileData?.username ?? username
  const displayBio = profileData?.bio ?? null
  const avatarColor = profileData?.avatar_color ?? '#c5c491'
  const displayInitials = displayUsername.slice(0, 2).toUpperCase()

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      {/* ── Profile Header ─────────────────────────────────────────────────── */}
      {isEditingProfile ? (
        /* ── Edit mode ── */
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-navy"
            style={{ backgroundColor: editAvatarColor ?? avatarColor }}
          >
            {displayInitials}
          </div>

          {/* Name + bio inputs */}
          <div className="flex flex-1 flex-col gap-3">
            {/* Username row */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={50}
                className="flex-1 bg-transparent text-2xl font-bold text-gray-lighter focus:outline-none"
                placeholder="Username"
              />
              <svg width="33" height="31" viewBox="1804 5722 33 31" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 opacity-60">
                <g>
                  <path d="M1833.2596435546875,5730.2666015625L1820.1424560546875,5742.5888671875C1818.8359375,5743.81640625,1814.958740234375,5744.384765625,1814.09228515625,5743.5712890625C1813.2261962890625,5742.7568359375,1813.8173828125,5739.1142578125,1815.12353515625,5737.88818359375L1828.2548828125,5725.5517578125C1828.5787353515625,5725.22021484375,1828.9705810546875,5724.95361328125,1829.4073486328125,5724.76806640625C1829.843994140625,5724.58203125,1830.3160400390625,5724.48193359375,1830.79541015625,5724.47265625C1831.2744140625,5724.462890625,1831.750732421875,5724.544921875,1832.1951904296875,5724.71240234375C1832.6396484375,5724.88134765625,1833.04345703125,5725.1318359375,1833.3818359375,5725.45068359375C1833.72021484375,5725.76953125,1833.9864501953125,5726.1494140625,1834.1640625,5726.5673828125C1834.342041015625,5726.9853515625,1834.4278564453125,5727.43359375,1834.41650390625,5727.8828125C1834.405029296875,5728.33349609375,1834.296630859375,5728.77685546875,1834.097900390625,5729.18603515625C1833.899169921875,5729.59619140625,1833.6141357421875,5729.9638671875,1833.2596435546875,5730.2666015625Z" stroke="#e1e1e1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1819.125,5727.1669921875L1812.25,5727.1669921875C1810.7913818359375,5727.1669921875,1809.392578125,5727.7109375,1808.3609619140625,5728.6806640625C1807.3294677734375,5729.6494140625,1806.75,5730.962890625,1806.75,5732.3330078125L1806.75,5745.25C1806.75,5746.62060546875,1807.3294677734375,5747.9345703125,1808.3609619140625,5748.9033203125C1809.392578125,5749.8720703125,1810.7913818359375,5750.4169921875,1812.25,5750.4169921875L1827.375,5750.4169921875C1830.4136962890625,5750.4169921875,1831.5,5748.091796875,1831.5,5745.25L1831.5,5738.7919921875" stroke="#e1e1e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              </svg>
            </div>

            {/* Bio area */}
            <div
              className="relative rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <p className="mb-1 text-sm font-semibold text-gray-lighter">About:</p>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full bg-transparent text-sm text-gray-light/80 focus:outline-none resize-none"
                placeholder="Write something about yourself…"
              />
              <div className="flex justify-end">
                <svg width="33" height="31" viewBox="1804 5722 33 31" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
                  <g>
                    <path d="M1833.2596435546875,5730.2666015625L1820.1424560546875,5742.5888671875C1818.8359375,5743.81640625,1814.958740234375,5744.384765625,1814.09228515625,5743.5712890625C1813.2261962890625,5742.7568359375,1813.8173828125,5739.1142578125,1815.12353515625,5737.88818359375L1828.2548828125,5725.5517578125C1828.5787353515625,5725.22021484375,1828.9705810546875,5724.95361328125,1829.4073486328125,5724.76806640625C1829.843994140625,5724.58203125,1830.3160400390625,5724.48193359375,1830.79541015625,5724.47265625C1831.2744140625,5724.462890625,1831.750732421875,5724.544921875,1832.1951904296875,5724.71240234375C1832.6396484375,5724.88134765625,1833.04345703125,5725.1318359375,1833.3818359375,5725.45068359375C1833.72021484375,5725.76953125,1833.9864501953125,5726.1494140625,1834.1640625,5726.5673828125C1834.342041015625,5726.9853515625,1834.4278564453125,5727.43359375,1834.41650390625,5727.8828125C1834.405029296875,5728.33349609375,1834.296630859375,5728.77685546875,1834.097900390625,5729.18603515625C1833.899169921875,5729.59619140625,1833.6141357421875,5729.9638671875,1833.2596435546875,5730.2666015625Z" stroke="#e1e1e1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1819.125,5727.1669921875L1812.25,5727.1669921875C1810.7913818359375,5727.1669921875,1809.392578125,5727.7109375,1808.3609619140625,5728.6806640625C1807.3294677734375,5729.6494140625,1806.75,5730.962890625,1806.75,5732.3330078125L1806.75,5745.25C1806.75,5746.62060546875,1807.3294677734375,5747.9345703125,1808.3609619140625,5748.9033203125C1809.392578125,5749.8720703125,1810.7913818359375,5750.4169921875,1812.25,5750.4169921875L1827.375,5750.4169921875C1830.4136962890625,5750.4169921875,1831.5,5748.091796875,1831.5,5745.25L1831.5,5738.7919921875" stroke="#e1e1e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
              </div>
            </div>

            {profileSaveError && (
              <p className="text-xs text-pink-brand">{profileSaveError}</p>
            )}
          </div>

          {/* Colour picker + Save */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <span className="text-sm text-gray-muted">Colour</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAvatarColorPicker((p) => !p)}
                className="h-14 w-14 rounded-xl border-2 border-white/20 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal/50"
                style={{ backgroundColor: editAvatarColor ?? avatarColor }}
                title="Pick avatar colour"
              />
              {showAvatarColorPicker && (
                <div className="absolute top-full right-0 mt-1 z-50">
                  <ColorPicker
                    value={editAvatarColor}
                    onChange={setEditAvatarColor}
                    onClose={() => setShowAvatarColorPicker(false)}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => profileSaveMutation.mutate()}
              disabled={!editUsername.trim() || profileSaveMutation.isPending}
              className="mt-1 px-5 py-2 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#6b6bbb' }}
            >
              {profileSaveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        /* ── View mode ── */
        <div className="flex items-center gap-5">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-navy"
            style={{ backgroundColor: avatarColor }}
          >
            {displayInitials}
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-3xl font-bold text-gray-lighter">{displayUsername}</h1>
            <p className="text-sm text-gray-muted">{user?.email}</p>
            {displayBio ? (
              <p className="mt-1 text-sm text-gray-light/60 italic">{displayBio}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-light/40 italic">No bio set yet.</p>
            )}
          </div>
          <button
            onClick={openProfileEdit}
            className="ml-auto self-start rounded-full p-2 text-gray-muted hover:bg-white/5 hover:text-gray-lighter transition-colors"
            title="Edit profile"
          >
            <svg width="33" height="31" viewBox="1804 5722 33 31" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1833.2596435546875,5730.2666015625L1820.1424560546875,5742.5888671875C1818.8359375,5743.81640625,1814.958740234375,5744.384765625,1814.09228515625,5743.5712890625C1813.2261962890625,5742.7568359375,1813.8173828125,5739.1142578125,1815.12353515625,5737.88818359375L1828.2548828125,5725.5517578125C1828.5787353515625,5725.22021484375,1828.9705810546875,5724.95361328125,1829.4073486328125,5724.76806640625C1829.843994140625,5724.58203125,1830.3160400390625,5724.48193359375,1830.79541015625,5724.47265625C1831.2744140625,5724.462890625,1831.750732421875,5724.544921875,1832.1951904296875,5724.71240234375C1832.6396484375,5724.88134765625,1833.04345703125,5725.1318359375,1833.3818359375,5725.45068359375C1833.72021484375,5725.76953125,1833.9864501953125,5726.1494140625,1834.1640625,5726.5673828125C1834.342041015625,5726.9853515625,1834.4278564453125,5727.43359375,1834.41650390625,5727.8828125C1834.405029296875,5728.33349609375,1834.296630859375,5728.77685546875,1834.097900390625,5729.18603515625C1833.899169921875,5729.59619140625,1833.6141357421875,5729.9638671875,1833.2596435546875,5730.2666015625Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1819.125,5727.1669921875L1812.25,5727.1669921875C1810.7913818359375,5727.1669921875,1809.392578125,5727.7109375,1808.3609619140625,5728.6806640625C1807.3294677734375,5729.6494140625,1806.75,5730.962890625,1806.75,5732.3330078125L1806.75,5745.25C1806.75,5746.62060546875,1807.3294677734375,5747.9345703125,1808.3609619140625,5748.9033203125C1809.392578125,5749.8720703125,1810.7913818359375,5750.4169921875,1812.25,5750.4169921875L1827.375,5750.4169921875C1830.4136962890625,5750.4169921875,1831.5,5748.091796875,1831.5,5745.25L1831.5,5738.7919921875" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Add Friend view ─────────────────────────────────────────────────── */}
      {view === 'add-friend' && (
        <div className="flex gap-6">
          {/* Friends List */}
          <div className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-navy-card/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-lighter">Friends List</h2>
              <button
                onClick={() => openDefaultView()}
                className="text-gray-muted hover:text-gray-lighter transition-colors"
                title="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Search…"
              className="input-base text-xs py-1.5"
              value={friendsListFilter}
              onChange={(e) => setFriendsListFilter(e.target.value)}
            />
            <ul className="flex flex-col divide-y divide-white/5 overflow-y-auto max-h-64">
              {friendsLoading ? (
                <li className="py-2 text-xs text-gray-muted italic">Loading…</li>
              ) : filteredFriends.length === 0 ? (
                <li className="py-2 text-xs text-gray-muted italic">No friends yet.</li>
              ) : filteredFriends.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-light truncate max-w-[120px]">{f.username}</span>
                  <button
                    onClick={() => removeFriendMutation.mutate(f.id)}
                    className="text-gray-muted hover:text-red-400 transition-colors ml-2"
                    title="Remove friend"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Friend Search */}
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-lighter">Search for a Friend to add</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Username…"
                className="input-base"
                value={friendSearchQ}
                onChange={(e) => setFriendSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFriendSearch()}
              />
              <button
                onClick={handleFriendSearch}
                disabled={friendSearchLoading}
                className="shrink-0 p-2.5 rounded-lg border border-white/10 bg-navy-card/60 text-gray-muted hover:text-gray-lighter transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </button>
            </div>
            <ul className="flex flex-col divide-y divide-white/5">
              {friendSearchResults.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-light truncate max-w-[260px]">{r.username}</span>
                  {r.is_friend ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <button
                      onClick={() => addFriendMutation.mutate(r.id)}
                      disabled={addFriendMutation.isPending}
                      className="text-gray-muted hover:text-teal transition-colors"
                      title="Add friend"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
              {friendSearchResults.length === 0 && friendSearchQ.length >= 2 && !friendSearchLoading && (
                <li className="py-3 text-sm text-gray-muted italic">No results found.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ── Category Editor view ────────────────────────────────────────────── */}
      {view === 'edit-category' && (
        <div className="flex gap-6">
          {/* Editor form */}
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-lighter uppercase tracking-wide">
              {editingCat ? 'Edit Movie Category' : 'New Movie Category'}
            </h2>

            <input
              type="text"
              placeholder="Name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              maxLength={100}
              className="input-base"
            />

            {/* Color pickers */}
            <div className="flex items-start gap-6">
              <div className="relative">
                <ColorSwatch
                  label="Outline"
                  color={catOutline}
                  onClick={() => {
                    setShowCatFillPicker(false)
                    setShowCatOutlinePicker((p) => !p)
                  }}
                />
                {showCatOutlinePicker && (
                  <div className="absolute top-full left-0 mt-1 z-50">
                    <ColorPicker
                      value={catOutline}
                      onChange={setCatOutline}
                      onClose={() => setShowCatOutlinePicker(false)}
                    />
                  </div>
                )}
              </div>
              <div className="relative">
                <ColorSwatch
                  label="Fill"
                  color={catFill}
                  onClick={() => {
                    setShowCatOutlinePicker(false)
                    setShowCatFillPicker((p) => !p)
                  }}
                />
                {showCatFillPicker && (
                  <div className="absolute top-full left-0 mt-1 z-50">
                    <ColorPicker
                      value={catFill}
                      onChange={setCatFill}
                      onClose={() => setShowCatFillPicker(false)}
                    />
                  </div>
                )}
              </div>
              {/* Live previews */}
              <div className="flex flex-col gap-2 ml-4">
                <Pill name={catName || 'Preview'} outlineColor={catOutline} fillColor={null} />
                <Pill name={catName || 'Preview'} outlineColor={catOutline} fillColor={catFill} />
              </div>
            </div>

            <textarea
              placeholder="Description (Optional)"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              rows={3}
              maxLength={500}
              className="input-base resize-none"
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={openDefaultView}
                className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => catSaveMutation.mutate()}
                disabled={!catName.trim() || catSaveMutation.isPending}
                className="px-5 py-2 rounded-full bg-blue-brand/80 hover:bg-blue-brand text-sm text-white font-semibold transition-colors disabled:opacity-40"
              >
                {catSaveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              {editingCat && (
                <button
                  type="button"
                  onClick={() => catDeleteMutation.mutate()}
                  disabled={catDeleteMutation.isPending}
                  className="ml-auto px-4 py-2 rounded-full border border-red-500/40 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            {catSaveMutation.isError && (
              <p className="text-xs text-pink-brand">Failed to save. Please try again.</p>
            )}
          </div>

          {/* Right: categories list */}
          <div className="w-56 shrink-0 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-lighter">My Movie Categories</h3>
            <div className="flex flex-col gap-2">
              {catsLoading ? (
                <p className="text-xs text-gray-muted italic">Loading…</p>
              ) : categories.length === 0 ? (
                <p className="text-xs text-gray-muted italic">No categories yet.</p>
              ) : categories.map((cat) => (
                <Pill
                  key={cat.id}
                  name={cat.name}
                  outlineColor={cat.outline_color}
                  fillColor={cat.fill_color}
                  onClick={() => openCatEditor(cat)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Group Editor view ───────────────────────────────────────────────── */}
      {view === 'edit-group' && (
        <div className="flex gap-6">
          <div className="flex flex-1 flex-col gap-4">
            {grpMembersView ? (
              /* Members management */
              <>
                <button
                  type="button"
                  onClick={() => setGrpMembersView(false)}
                  className="flex items-center gap-1.5 text-sm text-teal hover:text-teal/80 transition-colors w-fit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Edit Group
                </button>

                <div className="flex gap-4">
                  {/* Friends picker */}
                  <div className="flex flex-col gap-2 w-44">
                    <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">Friends List</p>
                    <input
                      type="text"
                      placeholder="Search…"
                      className="input-base text-xs py-1.5"
                      value={friendsFilter}
                      onChange={(e) => setFriendsFilter(e.target.value)}
                    />
                    <ul className="flex flex-col divide-y divide-white/5 max-h-52 overflow-y-auto">
                      {filteredFriendsForGroup.map((f) => (
                        <li key={f.id} className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-gray-light truncate max-w-[100px]">{f.username}</span>
                          <button
                            disabled={memberIds.has(f.id) || addMemberMutation.isPending}
                            onClick={() => addMemberMutation.mutate(f.id)}
                            className="text-gray-muted hover:text-teal transition-colors disabled:opacity-30 ml-1"
                            title="Add to group"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </li>
                      ))}
                      {filteredFriendsForGroup.length === 0 && (
                        <li className="py-2 text-xs text-gray-muted italic">No friends.</li>
                      )}
                    </ul>
                  </div>

                  {/* Current members */}
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-xs font-medium text-gray-muted uppercase tracking-wide">In this group</p>
                    <ul className="flex flex-col divide-y divide-white/5">
                      {(liveEditingGrp?.members ?? []).length === 0 ? (
                        <li className="py-2 text-xs text-gray-muted italic">No members yet.</li>
                      ) : (liveEditingGrp?.members ?? []).map((m) => (
                        <li key={m.id} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-light truncate max-w-[140px]">{m.username}</span>
                          <button
                            onClick={() => removeMemberMutation.mutate(m.id)}
                            disabled={removeMemberMutation.isPending}
                            className="text-gray-muted hover:text-red-400 transition-colors ml-2"
                            title="Remove from group"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              /* Normal edit form */
              <>
                <h2 className="text-sm font-semibold text-gray-lighter uppercase tracking-wide">
                  {editingGrp ? 'Edit Friend Group' : 'New Friend Group'}
                </h2>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={grpName}
                    onChange={(e) => setGrpName(e.target.value)}
                    maxLength={100}
                    className="input-base flex-1"
                  />
                  {editingGrp && (
                    <button
                      type="button"
                      onClick={() => setGrpMembersView(true)}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border border-teal/40 text-sm text-teal hover:bg-teal/10 transition-colors whitespace-nowrap"
                    >
                      {(liveEditingGrp?.members.length ?? 0) > 0 ? 'See Friends' : 'Add Friends'}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Color pickers */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <ColorSwatch
                      label="Outline"
                      color={grpOutline}
                      onClick={() => {
                        setShowGrpFillPicker(false)
                        setShowGrpOutlinePicker((p) => !p)
                      }}
                    />
                    {showGrpOutlinePicker && (
                      <div className="absolute top-full left-0 mt-1 z-50">
                        <ColorPicker
                          value={grpOutline}
                          onChange={setGrpOutline}
                          onClose={() => setShowGrpOutlinePicker(false)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <ColorSwatch
                      label="Fill"
                      color={grpFill}
                      onClick={() => {
                        setShowGrpOutlinePicker(false)
                        setShowGrpFillPicker((p) => !p)
                      }}
                    />
                    {showGrpFillPicker && (
                      <div className="absolute top-full left-0 mt-1 z-50">
                        <ColorPicker
                          value={grpFill}
                          onChange={setGrpFill}
                          onClose={() => setShowGrpFillPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                  {/* Live previews */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Pill name={grpName || 'Preview'} outlineColor={grpOutline} fillColor={null} />
                    <Pill name={grpName || 'Preview'} outlineColor={grpOutline} fillColor={grpFill} />
                  </div>
                </div>

                <textarea
                  placeholder="Description (Optional)"
                  value={grpDesc}
                  onChange={(e) => setGrpDesc(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="input-base resize-none"
                />

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={openDefaultView}
                    className="px-5 py-2 rounded-full border border-white/15 text-sm text-gray-light hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => grpSaveMutation.mutate()}
                    disabled={!grpName.trim() || grpSaveMutation.isPending}
                    className="px-5 py-2 rounded-full bg-blue-brand/80 hover:bg-blue-brand text-sm text-white font-semibold transition-colors disabled:opacity-40"
                  >
                    {grpSaveMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  {editingGrp && (
                    <button
                      type="button"
                      onClick={() => grpDeleteMutation.mutate()}
                      disabled={grpDeleteMutation.isPending}
                      className="ml-auto px-4 py-2 rounded-full border border-red-500/40 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {grpSaveMutation.isError && (
                  <p className="text-xs text-pink-brand">Failed to save. Please try again.</p>
                )}
              </>
            )}
          </div>

          {/* Right: groups + categories list */}
          <div className="w-56 shrink-0 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-gray-lighter">My Movie Categories</h3>
              {categories.map((cat) => (
                <Pill key={cat.id} name={cat.name} outlineColor={cat.outline_color} fillColor={cat.fill_color} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-gray-lighter">My Friend Groups</h3>
              {grpsLoading ? (
                <p className="text-xs text-gray-muted italic">Loading…</p>
              ) : groups.length === 0 ? (
                <p className="text-xs text-gray-muted italic">No groups yet.</p>
              ) : groups.map((grp) => (
                <Pill
                  key={grp.id}
                  name={grp.name}
                  outlineColor={grp.outline_color}
                  fillColor={grp.fill_color}
                  onClick={() => openGrpEditor(grp)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Default view ────────────────────────────────────────────────────── */}
      {view === 'default' && (
        <div className="flex gap-6">
          {/* Friends list panel */}
          <div className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-navy-card/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-lighter">Friends List</h2>
              <button
                onClick={() => { setFriendSearchQ(''); setFriendSearchResults([]); setFriendsListFilter(''); setView('add-friend') }}
                className="text-gray-muted hover:text-teal transition-colors"
                title="Add friend"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Search friends…"
              className="input-base text-xs py-1.5"
              value={friendsListFilter}
              onChange={(e) => setFriendsListFilter(e.target.value)}
            />
            <ul className="flex flex-col divide-y divide-white/5 overflow-y-auto max-h-64">
              {friendsLoading ? (
                <li className="py-2 text-xs text-gray-muted italic">Loading…</li>
              ) : filteredFriends.length === 0 ? (
                <li className="py-2 text-xs text-gray-muted italic">No friends yet.</li>
              ) : filteredFriends.map((f) => (
                <li key={f.id} className="flex items-center py-2">
                  <span className="text-sm text-gray-light truncate">{f.username}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: accordions */}
          <div className="flex flex-1 flex-col gap-3">
            {/* My Movie Categories */}
            <div className="rounded-xl border border-white/10 bg-navy-card/60 overflow-hidden">
              <button
                onClick={() => setCatsOpen((p) => !p)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-lighter hover:bg-white/5 transition-colors"
              >
                My Movie Categories
                <span
                  className="text-gray-muted text-lg leading-none"
                  style={{
                    display: 'inline-block',
                    transform: catsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >›</span>
              </button>
              <div className={`accordion-body${catsOpen ? ' open' : ''}`}>
                <div>
                  <div className="flex flex-wrap gap-2 px-5 pb-4">
                    {catsLoading ? (
                      <p className="text-xs text-gray-muted italic">Loading…</p>
                    ) : categories.length === 0 ? (
                      <p className="text-xs text-gray-muted italic">No categories yet.</p>
                    ) : categories.map((cat) => (
                      <Pill
                        key={cat.id}
                        name={cat.name}
                        outlineColor={cat.outline_color}
                        fillColor={cat.fill_color}
                        onClick={() => openCatEditor(cat)}
                      />
                    ))}
                    <button
                      onClick={() => openCatEditor()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-xs text-gray-muted hover:text-gray-lighter hover:border-white/40 transition-colors"
                    >
                      Add More
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* My Friend Groups */}
            <div className="rounded-xl border border-white/10 bg-navy-card/60 overflow-hidden">
              <button
                onClick={() => setGrpsOpen((p) => !p)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-lighter hover:bg-white/5 transition-colors"
              >
                My Friend Groups
                <span
                  className="text-gray-muted text-lg leading-none"
                  style={{
                    display: 'inline-block',
                    transform: grpsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >›</span>
              </button>
              <div className={`accordion-body${grpsOpen ? ' open' : ''}`}>
                <div>
                  <div className="flex flex-wrap gap-2 px-5 pb-4">
                    {grpsLoading ? (
                      <p className="text-xs text-gray-muted italic">Loading…</p>
                    ) : groups.length === 0 ? (
                      <p className="text-xs text-gray-muted italic">No groups yet.</p>
                    ) : groups.map((grp) => (
                      <Pill
                        key={grp.id}
                        name={grp.name}
                        outlineColor={grp.outline_color}
                        fillColor={grp.fill_color}
                        onClick={() => openGrpEditor(grp)}
                      />
                    ))}
                    <button
                      onClick={() => openGrpEditor()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-xs text-gray-muted hover:text-gray-lighter hover:border-white/40 transition-colors"
                    >
                      Add More
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings cog ────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/settings')}
          className="rounded-full p-2 text-gray-muted hover:bg-white/5 hover:text-gray-lighter transition-colors"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </main>
  )
}
