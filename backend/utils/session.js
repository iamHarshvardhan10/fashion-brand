import jwt from 'jsonwebtoken'
import { JWT_EXPIRES_IN, JWT_SECRET, SESSION_COOKIE, cookieOptions } from '../config/auth.js'

// Payload is intentionally small: id, role and the token version used for revocation.
// The role is only a routing hint for the frontend; the backend always re-reads the user.
export function signSession(user) {
    return jwt.sign({ role: user.role, v: user.tokenVersion }, JWT_SECRET, {
        subject: user.id,
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256',
    })
}

export function verifySession(token) {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
}

export function setSessionCookie(res, user) {
    res.cookie(SESSION_COOKIE, signSession(user), cookieOptions)
}

export function clearSessionCookie(res) {
    const { maxAge, ...options } = cookieOptions // eslint-disable-line no-unused-vars
    res.clearCookie(SESSION_COOKIE, options)
}

export function readSessionToken(req) {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) return header.slice(7)
    return req.cookies?.[SESSION_COOKIE]
}
