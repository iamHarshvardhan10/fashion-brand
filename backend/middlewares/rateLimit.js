import rateLimit from 'express-rate-limit'

const message = (text) => ({ success: false, message: text })

// Slows down password guessing; successful logins don't count against the limit
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: message('Too many sign-in attempts. Please try again in 15 minutes.'),
})

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: message('Too many sign-up attempts. Please try again later.'),
})
