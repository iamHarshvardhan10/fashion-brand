import prisma from '../lib/prisma.js'
import { DASHBOARD_ROLES } from '../config/auth.js'
import ApiError from '../utils/ApiError.js'
import { fakeVerify, hashPassword, verifyPassword } from '../utils/password.js'
import { publicUser } from '../utils/serializers.js'

// Same message for unknown email and wrong password so accounts can't be enumerated
const INVALID_CREDENTIALS = 'Incorrect email or password'

export async function login({ email, password, portal }) {
    const user = await prisma.user.findUnique({ where: { email } })

    const valid = user ? await verifyPassword(password, user.passwordHash) : await fakeVerify(password)
    if (!valid) throw new ApiError(401, INVALID_CREDENTIALS)

    if (user.status !== 'ACTIVE') throw new ApiError(403, 'This account has been suspended. Please contact support.')
    if (portal === 'dashboard' && !DASHBOARD_ROLES.includes(user.role)) {
        throw new ApiError(403, "This account doesn't have dashboard access")
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    return updated // full record: the controller signs the session, then strips private fields
}

export async function registerCustomer({ name, email, password, phone }) {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (exists) throw ApiError.conflict('An account with this email already exists')

    return prisma.user.create({
        data: { name, email, phone, passwordHash: await hashPassword(password), role: 'USER' },
    })
}

export async function getMe(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw ApiError.notFound('Account not found')
    return publicUser(user)
}

export async function changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
        throw ApiError.badRequest('Current password is incorrect', [
            { field: 'currentPassword', message: 'Current password is incorrect' },
        ])
    }
    // Bumping the version signs out every other device
    return prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(newPassword), tokenVersion: { increment: 1 } },
    })
}

export async function logoutEverywhere(userId) {
    await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })
}
