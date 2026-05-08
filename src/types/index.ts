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

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
}

export interface MovieDetails extends Movie {
  credits?: {
    cast: CastMember[]
    crew: CrewMember[]
  }
  genres?: Array<{ id: number; name: string }>
  runtime?: number
  tagline?: string
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
  category_ids: string[]
  rating: number
  review_text: string
  rewatch_count: number
  created_at: string
  movies?: Pick<Movie, 'id' | 'title' | 'poster_path' | 'release_date' | 'vote_average' | 'genre_ids'>
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
  has_pending_request: boolean
}

export interface FriendRequest {
  id: string
  sender_id: string
  sender_username: string
  created_at: string
}

export interface CreateReviewPayload {
  movie_id: number
  title: string
  poster_path: string | null
  release_date: string | null
  genre_ids?: number[]
  vote_average?: number
  rating: number
  review_text: string
  category_ids?: string[]
  group_ids?: string[]
  friend_ids?: string[]
}

export interface PaginatedReviews {
  reviews: Review[]
  page: number
  page_size: number
}

export interface WatchlistItem {
  movie_id: number
  added_at: string
  movies: Pick<Movie, 'id' | 'title' | 'poster_path' | 'release_date' | 'vote_average' | 'genre_ids'>
}

export interface FriendReview {
  id: string
  rating: number
  review_text: string
  rewatch_count: number
  created_at: string
  user_id: string
  profiles: {
    id: string
    username: string
  }
}

export interface MovieReviewsData {
  my_review: Review | null
  friend_reviews: FriendReview[]
  avg_friend_rating: number | null
}

export interface Recommendation {
  id: string
  movie_id: number
  is_read: boolean
  dismissed: boolean
  created_at: string
  sender_id: string
  sender: { id: string; username: string } | null
  sender_review: {
    id: string
    rating: number
    review_text: string
    created_at: string
  } | null
  movies: Pick<Movie, 'id' | 'title' | 'poster_path' | 'release_date' | 'vote_average' | 'genre_ids'>
}

export interface FriendActivityReview {
  id: string
  user_id: string
  movie_id: number
  rating: number
  review_text: string
  rewatch_count: number
  created_at: string
  movies: Pick<Movie, 'id' | 'title' | 'poster_path' | 'release_date'>
}

export interface FriendActivityItem {
  friend_id: string
  username: string
  reviews: FriendActivityReview[]
}

// ─── People & Favourites ──────────────────────────────────────────────────────

export interface PersonSearchResult {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
  known_for: Array<{ id: number; title: string; poster_path: string | null }>
}

export interface FilmographyEntry {
  id: number
  title: string
  poster_path: string | null
  release_date: string | null
  character?: string
  job?: string
  vote_average?: number
  genre_ids?: number[]
  popularity?: number
}

export interface PersonDetails {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  profile_path: string | null
  known_for_department: string
  place_of_birth: string | null
  movie_credits: {
    cast: FilmographyEntry[]
    crew: FilmographyEntry[]
  }
}

export interface FavouriteActor {
  actor_id: number
  actor_name: string
  profile_path: string | null
}

export interface FavouriteDirector {
  director_id: number
  director_name: string
  profile_path: string | null
}

