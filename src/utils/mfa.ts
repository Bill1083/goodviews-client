import { supabase } from '../services/supabaseClient'

/** Returns the id of the account's verified TOTP factor, or null if none is enrolled. */
export async function getVerifiedTotpFactorId(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error || !data) return null
  return data.totp.find((f) => f.status === 'verified')?.id ?? null
}

async function verifyTotpCode(factorId: string, code: string): Promise<string | null> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  return error ? error.message : null
}

async function verifyCurrentPassword(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? error.message : null
}

/**
 * Re-verifies the user's identity before a sensitive account change (change email/password,
 * delete account). Uses their authenticator code if they have MFA enrolled — a stronger check
 * than password re-entry alone — and falls back to their current password otherwise.
 * Returns null on success, or an error message to display.
 */
export async function verifyReauth(hasMfa: boolean, email: string, value: string): Promise<string | null> {
  if (!value) return 'This field is required.'
  if (hasMfa) {
    const factorId = await getVerifiedTotpFactorId()
    if (!factorId) return 'No authenticator found on this account.'
    return verifyTotpCode(factorId, value)
  }
  return verifyCurrentPassword(email, value)
}
