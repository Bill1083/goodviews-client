import axios from 'axios'
import { supabase } from './supabaseClient'
import type {
  CreateReviewPayload,
  MovieSearchResult,
  Movie,
  PaginatedReviews,
  Category,
  FriendGroup,
  FriendProfile,
  UserSearchResult,
  FriendRequest,
  WatchlistItem,
  MovieReviewsData,
} from '../types'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: 15_000,
})

// Attach the Supabase JWT to every backend request
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Movies (proxied via Flask → TMDB) ───────────────────────────────────────

export async function searchMovies(
  query: string,
  page = 1,
): Promise<MovieSearchResult> {
  const { data } = await apiClient.get<MovieSearchResult>('/api/movies/search', {
    params: { q: query, page },
  })
  return data
}

export async function getMovieDetails(movieId: number): Promise<Movie> {
  const { data } = await apiClient.get<Movie>(`/api/movies/${movieId}`)
  return data
}

export async function getMovieReviews(movieId: number): Promise<MovieReviewsData> {
  const { data } = await apiClient.get<MovieReviewsData>(`/api/reviews/movie/${movieId}`)
  return data
}

export async function recommendMovie(payload: {
  movie_id: number
  title: string
  poster_path: string | null
  release_date: string | null
  friend_ids: string[]
  group_ids: string[]
}): Promise<void> {
  await apiClient.post('/api/movies/recommend', payload)
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function createReview(payload: CreateReviewPayload): Promise<void> {
  await apiClient.post('/api/reviews/', payload)
}

export async function getMyReviews(page = 1): Promise<PaginatedReviews> {
  const { data } = await apiClient.get<PaginatedReviews>('/api/reviews/me', {
    params: { page },
  })
  return data
}

export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete(`/api/reviews/${reviewId}`)
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getMyCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/api/categories/')
  return data
}

export async function createCategory(payload: {
  name: string
  outline_color: string | null
  fill_color: string | null
  description: string | null
}): Promise<Category> {
  const { data } = await apiClient.post<Category>('/api/categories/', payload)
  return data
}

export async function updateCategory(
  id: string,
  payload: Partial<{ name: string; outline_color: string | null; fill_color: string | null; description: string | null }>,
): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/api/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`)
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await apiClient.get<WatchlistItem[]>('/api/watchlist/')
  return data
}

export async function addToWatchlist(payload: {
  movie_id: number
  title: string
  poster_path: string | null
  release_date: string | null
}): Promise<void> {
  await apiClient.post('/api/watchlist/', payload)
}

export async function removeFromWatchlist(movieId: number): Promise<void> {
  await apiClient.delete(`/api/watchlist/${movieId}`)
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export async function getMyFriends(): Promise<FriendProfile[]> {
  const { data } = await apiClient.get<FriendProfile[]>('/api/friends/')
  return data
}

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const { data } = await apiClient.get<UserSearchResult[]>('/api/friends/search', {
    params: { q },
  })
  return data
}

export async function addFriend(friendId: string): Promise<void> {
  await apiClient.post('/api/friends/', { friend_id: friendId })
}

export async function removeFriend(friendId: string): Promise<void> {
  await apiClient.delete(`/api/friends/${friendId}`)
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const { data } = await apiClient.get<FriendRequest[]>('/api/friends/requests')
  return data
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await apiClient.post(`/api/friends/requests/${requestId}/accept`)
}

export async function denyFriendRequest(requestId: string): Promise<void> {
  await apiClient.delete(`/api/friends/requests/${requestId}`)
}

// ─── Friend Groups ────────────────────────────────────────────────────────────

export async function getMyFriendGroups(): Promise<FriendGroup[]> {
  const { data } = await apiClient.get<FriendGroup[]>('/api/groups/')
  return data
}

export async function createFriendGroup(payload: {
  name: string
  outline_color: string | null
  fill_color: string | null
  description: string | null
}): Promise<FriendGroup> {
  const { data } = await apiClient.post<FriendGroup>('/api/groups/', payload)
  return data
}

export async function updateFriendGroup(
  id: string,
  payload: Partial<{ name: string; outline_color: string | null; fill_color: string | null; description: string | null }>,
): Promise<FriendGroup> {
  const { data } = await apiClient.put<FriendGroup>(`/api/groups/${id}`, payload)
  return data
}

export async function deleteFriendGroup(id: string): Promise<void> {
  await apiClient.delete(`/api/groups/${id}`)
}

export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  await apiClient.post(`/api/groups/${groupId}/members`, { user_id: userId })
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/api/groups/${groupId}/members/${userId}`)
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileData {
  id: string
  username: string
  bio: string | null
  avatar_color: string | null
  profile_visibility: 'no_one' | 'friends_only' | 'everyone'
}

export async function getProfile(): Promise<ProfileData> {
  const { data } = await apiClient.get<ProfileData>('/api/profile/')
  return data
}

export async function updateProfile(payload: Partial<{
  username: string
  bio: string | null
  avatar_color: string | null
  profile_visibility: 'no_one' | 'friends_only' | 'everyone'
}>): Promise<ProfileData> {
  const { data } = await apiClient.put<ProfileData>('/api/profile/', payload)
  return data
}
