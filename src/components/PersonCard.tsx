import type { PersonSearchResult } from '../types'

const TMDB_PROFILE_IMG = 'https://image.tmdb.org/t/p/w185'

export default function PersonCard({ person, onClick }: { person: PersonSearchResult; onClick: () => void }) {
  const profileUrl = person.profile_path ? `${TMDB_PROFILE_IMG}${person.profile_path}` : null
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-navy-card/40 p-3 hover:border-magenta/40 hover:bg-navy-card/70 transition-all text-center"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/10 bg-navy-card/60 group-hover:border-magenta/40 transition-colors">
        {profileUrl ? (
          <img src={profileUrl} alt={person.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-muted text-lg font-semibold">
            {person.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 w-full">
        <p className="text-xs font-semibold text-gray-lighter leading-tight line-clamp-2 group-hover:text-magenta transition-colors">
          {person.name}
        </p>
        {person.known_for_department && (
          <p className="text-[10px] text-gray-muted">{person.known_for_department}</p>
        )}
      </div>
    </button>
  )
}
