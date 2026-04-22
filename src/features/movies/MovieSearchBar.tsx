import { useState, useRef } from 'react'

interface Props {
  onSearch: (query: string) => void
  isLoading?: boolean
}

export default function MovieSearchBar({ onSearch, isLoading = false }: Props) {
  const [value, setValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (q.trim().length >= 2) onSearch(q.trim())
    }, 400)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length >= 2) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full max-w-xl items-center gap-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted pointer-events-none">
          🔍
        </span>
        <input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder="Search for a movie..."
          className="input-base pl-10 pr-4"
          autoFocus
        />
      </div>
      {isLoading && (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      )}
    </form>
  )
}
