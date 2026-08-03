export const PASSWORD_HINT = '10–20 characters, with a number and a special character'
export const PASSWORD_MAX_LENGTH = 20

// Kept in sync with GOTRUE_PASSWORD_REQUIRED_CHARACTERS — note ':' is deliberately
// excluded since it's the class separator in that env var (a literal ':' there needs
// escaping, so it's simplest to just leave it out of the accepted special characters).
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;,.<>?]/

/** Mirrors the GOTRUE_PASSWORD_MIN_LENGTH / GOTRUE_PASSWORD_REQUIRED_CHARACTERS policy
 * enforced server-side by Supabase Auth — this is fail-fast UX, not the real enforcement. */
export function validatePassword(password: string): string | null {
  if (password.length < 10) return 'Password must be at least 10 characters.'
  if (password.length > PASSWORD_MAX_LENGTH) return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`
  if (!/\d/.test(password)) return 'Password must include at least one number.'
  if (!SPECIAL_CHAR_REGEX.test(password)) return 'Password must include at least one special character.'
  return null
}
