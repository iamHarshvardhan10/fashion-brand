const isProduction = process.env.NODE_ENV === 'production'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set in .env and be at least 32 characters long')
}

export const JWT_SECRET = process.env.JWT_SECRET
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
export const SESSION_COOKIE = 'fb_session'

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const cookieOptions = {
    httpOnly: true, // not readable from JS, so XSS can't steal it
    secure: isProduction, // HTTPS only in production
    // The frontend proxies /api through Next.js, so the cookie is first-party and Lax is enough.
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
}

export const ROLES = Object.freeze({
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    USER: 'USER',
})

// Who may sign in to /dashboard
export const DASHBOARD_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
// Store staff (manage catalog, customers)
export const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
