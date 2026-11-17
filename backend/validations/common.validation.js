import { z } from 'zod'

// Multipart form fields arrive as strings, so these helpers accept both
// JSON values and their string forms ("true", "3", "").

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value)
const emptyToNull = (value) => (value === '' ? null : value)

export const boolish = z.preprocess(emptyToUndefined, z.union([z.boolean(), z.stringbool()]))

export const sortOrder = z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: 'Sort order must be a number' }).int('Sort order must be a whole number').min(0).max(9999),
)

export const name = z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')

export const slug = z.preprocess(
    emptyToUndefined,
    z
        .string()
        .trim()
        .toLowerCase()
        .max(80, 'Slug must be at most 80 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers and single hyphens'),
)

export const description = z.preprocess(
    emptyToNull,
    z.string().trim().max(500, 'Description must be at most 500 characters').nullable(),
)

export const id = z.string().trim().min(1, 'id is required')

export const idParams = z.object({ id })

// Users use native Postgres UUID ids
export const uuid = z.string({ error: 'id is required' }).trim().pipe(z.uuid('Invalid id'))
export const uuidParams = z.object({ id: uuid })
