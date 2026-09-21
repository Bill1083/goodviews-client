/** Layout-mirroring placeholder: mirror the loaded block's size so nothing
 * shifts under the user's thumb when data lands. */
export default function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-navy-card/70 ${className}`} aria-hidden="true" />
}
