import prisma from '../lib/prisma.js'
import ApiError from '../utils/ApiError.js'
import { clearSessionCookie, readSessionToken, verifySession } from '../utils/session.js'
import { publicUser } from '../utils/serializers.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Verifies the session and loads a fresh user from the DB on every request,
// so role changes, suspensions and revoked sessions take effect immediately.
export async function authenticate(req, res, next) {
    const token = readSessionToken(req)
    if (!token) return next(new ApiError(401, 'Please sign in to continue'))

    let payload
    try {
        payload = verifySession(token)
    } catch {
        clearSessionCookie(res)
        return next(new ApiError(401, 'Your session has expired, please sign in again'))
    }

    // Tokens issued before ids became UUIDs (or tampered ones) would make Postgres throw
    if (!UUID_PATTERN.test(String(payload.sub))) {
        clearSessionCookie(res)
        return next(new ApiError(401, 'Your session has expired, please sign in again'))
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })

    if (!user || user.tokenVersion !== payload.v) {
        clearSessionCookie(res)
        return next(new ApiError(401, 'Your session has expired, please sign in again'))
    }
    if (user.status !== 'ACTIVE') {
        clearSessionCookie(res)
        return next(new ApiError(403, 'This account has been suspended'))
    }

    req.user = publicUser(user)
    next()
}

// For public routes that behave differently for signed-in staff: never rejects, just sets req.user when valid
export async function optionalAuthenticate(req, res, next) {
    if (!readSessionToken(req)) return next()
    await authenticate(req, res, () => next())
}

export const isStaff = (user) => user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

// Usage: authorize('SUPER_ADMIN', 'ADMIN') — must run after authenticate
export function authorize(...roles) {
    const allowed = roles.flat()
    return (req, res, next) => {
        if (!req.user) return next(new ApiError(401, 'Please sign in to continue'))
        if (!allowed.includes(req.user.role)) {
            return next(new ApiError(403, "You don't have permission to do this"))
        }
        next()
    }
}
