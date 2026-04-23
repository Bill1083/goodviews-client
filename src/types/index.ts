// Strict TypeScript interfaces for GoodViews domain entities.

export interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Movie {
  id: number
  title: string
  poster_path: string | null
  release_date: string | null
  overview?: string
  vote_average?: number
  genre_ids?: number[]
}

/** TMDB search results page */
export interface MovieSearchResult {
  page: number
  results: Movie[]
  total_pages: number
  total_results: number
}

export interface Review {
  id: string
  user_id: string
  movie_id: number
  category_id: string | null
  rating: number
  review_text: string
  created_at: string
  movies?: Pick<Movie, 'id' | 'title' | 'poster_path' | 'release_date'>
}

export interface Category {
  id: string
  user_id: string
  name: string
  outline_color: string | null
  fill_color: string | null
  description: string | null
  created_at: string
}

export interface FriendProfile {
  id: string
  username: string
}

export interface FriendGroup {
  id: string
  name: string
  outline_color: string | null
  fill_color: string | null
  description: string | null
  created_at: string
  members: FriendProfile[]
}

export interface UserSearchResult {
  id: string
  username: string
  is_friend: boolean
}

export interface CreateReviewPayload {
  movie_id: number
  title: string
  poster_path: string | null
  release_date: string | null
  rating: number
  review_text: string
  category_id?: string | null
  group_ids?: string[]
}

export interface PaginatedReviews {
  reviews: Review[]
  page: number
  page_size: number
}

