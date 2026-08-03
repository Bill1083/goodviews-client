export const PASSWORD_HINT = 'At least 10 characters, with a number and a special character'

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/

/** Mirrors the GOTRUE_PASSWORD_MIN_LENGTH / GOTRUE_PASSWORD_REQUIRED_CHARACTERS policy
 * enforced server-side by Supabase Auth — this is fail-fast UX, not the real enforcement. */
export function validatePassword(password: string): string | null {
  if (password.length < 10) return 'Password must be at least 10 characters.'
  if (!/\d/.test(password)) return 'Password must include at least one number.'
  if (!SPECIAL_CHAR_REGEX.test(password)) return 'Password must include at least one special character.'
  return null
}
