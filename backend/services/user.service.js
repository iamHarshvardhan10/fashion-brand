import prisma from '../lib/prisma.js'
import { STAFF_ROLES } from '../config/auth.js'
import ApiError from '../utils/ApiError.js'
import { hashPassword } from '../utils/password.js'

const listSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    lastLoginAt: true,
    createdAt: true,
}

export async function listUsers({ role, staffOnly, search } = {}) {
    return prisma.user.findMany({
        where: {
            ...(role ? { role } : staffOnly && { role: { in: STAFF_ROLES } }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        select: listSelect,
    })
}

export async function createStaff({ name, email, password, role }) {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (exists) {
        throw ApiError.badRequest('An account with this email already exists', [
            { field: 'email', message: 'An account with this email already exists' },
        ])
    }
    const user = await prisma.user.create({
        data: { name, email, role, passwordHash: await hashPassword(password) },
        select: listSelect,
    })
    return user
}

async function countActiveSuperAdmins() {
    return prisma.user.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE' } })
}

export async function updateUser(id, { role, status }, actor) {
    if (id === actor.id) throw ApiError.badRequest("You can't change your own role or status")

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw ApiError.notFound('User not found')

    if (role && !STAFF_ROLES.includes(user.role)) {
        throw ApiError.badRequest('Only staff roles can be changed here')
    }

    // Never leave the store without an active super admin
    const losesSuperAdmin =
        user.role === 'SUPER_ADMIN' && user.status === 'ACTIVE' && ((role && role !== 'SUPER_ADMIN') || status === 'SUSPENDED')
    if (losesSuperAdmin && (await countActiveSuperAdmins()) <= 1) {
        throw ApiError.badRequest('There must always be at least one active super admin')
    }

    const roleChanged = role && role !== user.role
    const suspended = status === 'SUSPENDED' && user.status !== 'SUSPENDED'

    return prisma.user.update({
        where: { id },
        data: {
            role,
            status,
            // Sign them out everywhere so the change applies immediately
            ...((roleChanged || suspended) && { tokenVersion: { increment: 1 } }),
        },
        select: listSelect,
    })
}
