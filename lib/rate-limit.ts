type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

/** Returns true if the IP is allowed, false if rate limited. */
export function checkRateLimit(
  ip: string,
  opts: { limit: number; windowMs: number },
): boolean {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + opts.windowMs })
    return true
  }

  if (entry.count >= opts.limit) return false

  entry.count++
  return true
}
