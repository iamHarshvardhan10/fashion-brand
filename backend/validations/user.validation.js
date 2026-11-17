import { z } from 'zod'
import { email, newPassword, personName } from './auth.validation.js'
import { uuidParams as idParams } from './common.validation.js'

const staffRole = z.enum(['SUPER_ADMIN', 'ADMIN'], { error: 'Role must be Super admin or Admin' })

export const listUsersSchema = {
    query: z.object({
        role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']).optional(),
        staffOnly: z.stringbool().optional(),
        search: z.string().trim().max(80).optional(),
    }),
}

export const createStaffSchema = {
    body: z.object({
        name: personName,
        email,
        password: newPassword,
        role: staffRole,
    }),
}

export const updateUserSchema = {
    params: idParams,
    body: z
        .object({
            role: staffRole.optional(), // customers aren't promoted here
            status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
        })
        .refine((b) => b.role || b.status, { message: 'Nothing to update' }),
}
