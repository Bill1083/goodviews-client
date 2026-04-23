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
    <form onSubmit={handleSubmit} className="relative flex w-full items-center">
      <div className="relative flex-1">
        <input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder="Search..."
          className="w-full rounded-full border border-[#cdcdcd]/30 bg-[#b1b2b5]/20 px-5 py-1.5
                     text-gray-lighter placeholder-[#a3a3a1]
                     focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
          style={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 18 }}
          autoFocus
        />
      </div>
      {isLoading && (
        <span className="absolute right-4 h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      )}
    </form>
  )
}
