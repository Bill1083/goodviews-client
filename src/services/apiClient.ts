import axios from 'axios'
import { supabase } from './supabaseClient'
import type { CreateReviewPayload, MovieSearchResult, Movie, PaginatedReviews } from '../types'

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
