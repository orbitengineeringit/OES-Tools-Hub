/**
 * Checks if a given email is whitelisted for the platform.
 * Case-insensitive comparison is used.
 * Supports VITE_ and NEXT_PUBLIC_ env prefixes.
 */
export function isEmailAllowed(email: string): boolean {
  if (!email) return false

  const cleanEmail = email.trim().toLowerCase()

  const allowedEmailsStr =
    import.meta.env.VITE_ALLOWED_EMAILS ||
    import.meta.env.NEXT_PUBLIC_ALLOWED_EMAILS ||
    ''

  const allowedEmails = allowedEmailsStr
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowedEmails.length > 0 && allowedEmails.includes(cleanEmail)) {
    return true
  }

  const allowedDomainsStr =
    import.meta.env.VITE_ALLOWED_DOMAINS ||
    import.meta.env.NEXT_PUBLIC_ALLOWED_DOMAINS ||
    ''

  const allowedDomains = allowedDomainsStr
    .split(',')
    .map((d: string) => d.trim().toLowerCase())
    .filter(Boolean)

  const domain = cleanEmail.split('@')[1]
  if (domain && allowedDomains.length > 0 && allowedDomains.includes(domain)) {
    return true
  }

  if (allowedEmails.length === 0 && allowedDomains.length === 0) {
    return true
  }

  return false
}
