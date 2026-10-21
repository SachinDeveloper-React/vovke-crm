import { NextResponse, type NextRequest } from 'next/server'

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const IS_PROD = process.env.NODE_ENV === 'production'

const csv = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const CANONICAL_HOST = process.env.CANONICAL_HOST // e.g. "example.com"
const ALLOWED_HOSTS = csv(process.env.ALLOWED_HOSTS) // e.g. "example.com,www.example.com"
const ALLOWED_ORIGINS = csv(process.env.ALLOWED_ORIGINS) // CORS allowlist

const ALLOWED_METHODS = new Set([
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
])
const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const MAX_API_BODY_BYTES = 1_000_000 // 1 MB (Content-Length check)
const MAX_URL_LENGTH = 2048

// Common scanner / exploit probe paths
const BLOCKED_PATH_PATTERNS = [
  /^\/\.(env|git|svn|hg|ds_store|aws|ssh)/i,
  /^\/(wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php)/i,
  /^\/(phpmyadmin|pma|adminer|cgi-bin|vendor\/phpunit)/i,
  /\.(php|asp|aspx|jsp|cgi|sql|bak|old|swp|ini|log)$/i,
]

// Known attack tools (basic filter; real bot protection WAF/CDN par karo)
const BLOCKED_UA = /(sqlmap|nikto|nmap|masscan|acunetix|nessus|havij|dirbuster|wpscan)/i

/* -------------------------------------------------------------------------- */
/*                         Rate limiting (in-memory only)                     */
/* -------------------------------------------------------------------------- */

// NOTE: Counters sirf is process ki memory me rehte hain. Isliye ye
// single server / single container (VPS, Docker, `next start`) par sahi chalta hai.
// Serverless ya multi-instance setup me har instance ka apna alag counter hoga.

const WINDOW_MS = 60_000
const MAX_TRACKED_KEYS = 10_000 // memory cap (attacker ke bahut saare IPs bhejne par bhi memory na bhare)

const LIMITS = {
  api: 100, // per IP per minute
  sensitive: 10, // login, otp, reset...
  page: 300,
} as const

const SENSITIVE_PREFIXES = ['/api/auth', '/api/login', '/api/otp', '/api/password']

type Entry = { windowStart: number; count: number; prevCount: number }
const store = new Map<string, Entry>()

function evictIfNeeded(now: number) {
  if (store.size < MAX_TRACKED_KEYS) return

  // Pehle expire ho chuke entries hatao
  for (const [k, v] of store) {
    if (v.windowStart < now - 2 * WINDOW_MS) store.delete(k)
  }
  // Phir bhi bhara ho to sabse purane entries hatao (Map insertion order)
  while (store.size >= MAX_TRACKED_KEYS) {
    const oldest = store.keys().next().value
    if (oldest === undefined) break
    store.delete(oldest)
  }
}

// Sliding window counter: pichli window ka weighted count + current window ka count
function checkLimit(key: string, max: number) {
  const now = Date.now()
  const windowStart = now - (now % WINDOW_MS)
  let entry = store.get(key)

  if (!entry) {
    evictIfNeeded(now)
    entry = { windowStart, count: 0, prevCount: 0 }
  } else if (entry.windowStart !== windowStart) {
    entry.prevCount = entry.windowStart === windowStart - WINDOW_MS ? entry.count : 0
    entry.count = 0
    entry.windowStart = windowStart
  }

  // Recently-used entry ko Map ke end me le jao (eviction me last me hatega)
  store.delete(key)
  store.set(key, entry)

  const elapsed = (now - windowStart) / WINDOW_MS
  const estimated = entry.prevCount * (1 - elapsed) + entry.count
  const reset = windowStart + WINDOW_MS

  if (estimated >= max) {
    return { success: false, remaining: 0, reset, max }
  }

  entry.count++
  return {
    success: true,
    remaining: Math.max(0, Math.floor(max - estimated - 1)),
    reset,
    max,
  }
}

function rateLimit(ip: string, pathname: string) {
  const bucket = SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p))
    ? 'sensitive'
    : pathname.startsWith('/api')
      ? 'api'
      : 'page'
  return checkLimit(`${bucket}:${ip}`, LIMITS[bucket])
}

/* -------------------------------------------------------------------------- */
/*                        Operator gate (the admin key)                       */
/* -------------------------------------------------------------------------- */

// The panel has no accounts: it is open to whoever holds the API's admin key,
// which `lib/session.ts` puts in an httpOnly cookie at sign-in. Checking it
// here means a visitor with no key is redirected before a page is rendered or
// a single API call is made — the pages check it too, but by then the shell
// has already been streamed and the redirect has to happen in the browser.

const ADMIN_COOKIE = 'vokve_admin_key'
const OPERATOR_PATHS = ['/dashboard']

function needsAdminKey(request: NextRequest): boolean {
  const { pathname } = request.nextUrl
  if (!OPERATOR_PATHS.some((prefix) => pathname.startsWith(prefix))) return false
  if (request.cookies.has(ADMIN_COOKIE)) return false
  // Outside production a key in the environment stands in for the cookie, the
  // same fallback `lib/api.ts` makes, so a developer running both halves is
  // not asked to sign in on every restart.
  return IS_PROD || !process.env.VOKVE_ADMIN_API_KEY
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_PROD ? '' : " 'unsafe-eval'"}`,
    // Dev me Next.js inline styles use karta hai
    `style-src 'self' ${IS_PROD ? `'nonce-${nonce}'` : "'unsafe-inline'"}`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(IS_PROD ? [`upgrade-insecure-requests`] : []),
  ].join('; ')
}

function applySecurityHeaders(res: NextResponse, csp: string) {
  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  )
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  res.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  res.headers.delete('X-Powered-By')
  if (IS_PROD) {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }
}

function applyCors(res: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.append('Vary', 'Origin')
    res.headers.set(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    )
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-Id'
    )
    res.headers.set('Access-Control-Max-Age', '86400')
  }
}

function reject(
  status: number,
  message: string,
  requestId: string,
  extra?: Record<string, string>
) {
  const res = NextResponse.json({ error: message }, { status })
  res.headers.set('X-Request-Id', requestId)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  for (const [k, v] of Object.entries(extra ?? {})) res.headers.set(k, v)
  return res
}

/* -------------------------------------------------------------------------- */
/*                                    Proxy                                   */
/* -------------------------------------------------------------------------- */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api')
  const method = request.method.toUpperCase()
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')?.toLowerCase() ?? ''
  const userAgent = request.headers.get('user-agent') ?? ''

  // Client ki request id sirf tab lo jab safe format ho (log injection se bachav)
  const incomingId = request.headers.get('x-request-id')
  const requestId =
    incomingId && /^[\w-]{8,64}$/.test(incomingId) ? incomingId : crypto.randomUUID()

  // 1. Host header validation (Host header injection / cache poisoning)
  if (IS_PROD && ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(host)) {
    return reject(400, 'Invalid host', requestId)
  }

  // 2. HTTPS + canonical host redirect
  if (IS_PROD) {
    const proto = request.headers.get('x-forwarded-proto')
    if (proto === 'http' || (CANONICAL_HOST && host && host !== CANONICAL_HOST)) {
      const url = request.nextUrl.clone()
      url.protocol = 'https:'
      if (CANONICAL_HOST) url.host = CANONICAL_HOST
      return NextResponse.redirect(url, 308)
    }
  }

  // 3. Method allowlist (TRACE, CONNECT etc. block)
  if (!ALLOWED_METHODS.has(method)) {
    return reject(405, 'Method not allowed', requestId, {
      Allow: [...ALLOWED_METHODS].join(', '),
    })
  }

  // 4. Malformed / oversized URL, path traversal, null bytes
  const rawUrl = request.url
  if (
    rawUrl.length > MAX_URL_LENGTH ||
    /%00|\\|%5c/i.test(rawUrl) ||
    /(^|\/)\.\.(\/|$)|%2e%2e/i.test(pathname)
  ) {
    return reject(400, 'Bad request', requestId)
  }

  // 5. Scanner probe paths + attack tool user-agents
  if (BLOCKED_PATH_PATTERNS.some((re) => re.test(pathname))) {
    return reject(404, 'Not found', requestId)
  }
  if (BLOCKED_UA.test(userAgent)) {
    return reject(403, 'Forbidden', requestId)
  }

  // 6. CORS preflight
  if (isApi && method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })
    applyCors(res, origin)
    res.headers.set('X-Request-Id', requestId)
    return res
  }

  // 7. API specific checks
  if (isApi && STATE_CHANGING.has(method)) {
    // 7a. Body size limit (Content-Length based; handler me bhi limit lagao)
    const len = Number(request.headers.get('content-length') ?? 0)
    if (Number.isFinite(len) && len > MAX_API_BODY_BYTES) {
      return reject(413, 'Payload too large', requestId)
    }

    // 7b. CSRF defense: cross-origin state-changing request ko origin allowlist se check karo
    if (origin) {
      const sameOrigin = origin === request.nextUrl.origin
      if (!sameOrigin && !ALLOWED_ORIGINS.includes(origin)) {
        return reject(403, 'Cross-origin request blocked', requestId)
      }
    }
  }

  // 8. Rate limiting
  const rl = rateLimit(getClientIp(request), pathname)
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
    const res = reject(429, 'Too many requests', requestId, {
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(rl.max),
      'X-RateLimit-Remaining': '0',
    })
    if (isApi) applyCors(res, origin)
    return res
  }

  // 8b. No key, no dashboard.
  if (needsAdminKey(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    url.search = ''
    url.searchParams.set('from', 'expired')
    return NextResponse.redirect(url, 307)
  }

  // 9. Nonce + request id downstream (server components / route handlers) ko pass karo
  const nonce = btoa(crypto.randomUUID())
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-request-id', requestId)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // 10. Response headers
  applySecurityHeaders(response, csp)
  response.headers.set('X-Request-Id', requestId)
  response.headers.set('X-RateLimit-Limit', String(rl.max))
  response.headers.set('X-RateLimit-Remaining', String(rl.remaining))
  if (isApi) {
    applyCors(response, origin)
    response.headers.set('Cache-Control', 'no-store')
  }

  return response
}

/* -------------------------------------------------------------------------- */
/*                                   Matcher                                  */
/* -------------------------------------------------------------------------- */

export const config = {
  matcher: [
    {
      // Static assets / image optimizer / metadata files skip, prefetch requests bhi skip
      source:
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}