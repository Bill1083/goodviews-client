interface Props {
  hasMfa: boolean
  value: string
  onChange: (value: string) => void
}

/** Inline re-verification input shown before a sensitive account change — an authenticator
 * code for users with MFA enrolled, or their current password otherwise. */
export default function ReauthField({ hasMfa, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-muted uppercase tracking-wide">
        {hasMfa ? 'Authenticator Code' : 'Current Password'}
      </label>
      <input
        type={hasMfa ? 'text' : 'password'}
        inputMode={hasMfa ? 'numeric' : undefined}
        maxLength={hasMfa ? 6 : undefined}
        autoComplete={hasMfa ? 'one-time-code' : 'current-password'}
        value={value}
        onChange={(e) => onChange(hasMfa ? e.target.value.replace(/\D/g, '') : e.target.value)}
        placeholder={hasMfa ? '6-digit code' : 'Required to confirm this change'}
        className={hasMfa ? 'input-base text-center tracking-[0.3em]' : 'input-base'}
      />
    </div>
  )
}
