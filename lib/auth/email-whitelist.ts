/**
 * Checks if a given email is whitelisted for the platform.
 * Case-insensitive comparison is used.
 * Uses NEXT_PUBLIC_ prefix so it can be called on both client and server.
 */
export function isEmailAllowed(email: string): boolean {
  if (!email) return false

  const cleanEmail = email.trim().toLowerCase()

  // 1. Check specific allowed email addresses
  const allowedEmailsStr = process.env.NEXT_PUBLIC_ALLOWED_EMAILS || ''
  const allowedEmails = allowedEmailsStr
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowedEmails.includes(cleanEmail)) {
    return true
  }

  // 2. Check allowed domains
  const allowedDomainsStr = process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || ''
  const allowedDomains = allowedDomainsStr
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  const domain = cleanEmail.split('@')[1]
  if (domain && allowedDomains.includes(domain)) {
    return true
  }

  return false
}
