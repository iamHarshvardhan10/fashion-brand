import { z } from 'zod'
import { boolish, id, idParams, slug, sortOrder } from './common.validation.js'

// EDIT  = curated edit cards on the home page (EditGrid), linking to /collections/<slug>
// VIBE  = "Shop by vibe" tiles (VibeGrid), linking to /vibes/<slug>
// DROP  = timed releases (launchAt / endsAt drive the countdown)
export const COLLECTION_TYPES = ['EDIT', 'VIBE', 'DROP']
export const MAX_PRODUCTS = 100

const emptyToNull = (value) => (value === '' ? null : value)
const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value)

const name = z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')

const description = z.preprocess(
    emptyToNull,
    z.string().trim().max(300, 'Description must be at most 300 characters').nullable(),
)

const type = z.preprocess(emptyToUndefined, z.enum(COLLECTION_TYPES, { error: 'Invalid collection type' }))
const date = z.preprocess(emptyToNull, z.coerce.date({ error: 'Invalid date' }).nullable())

// Multipart sends the list as a JSON string: ["prodId1", "prodId2"] in display order
const productIds = z.preprocess(
    (value) => {
        if (value === undefined) return undefined
        if (value === '' || value === null) return []
        if (typeof value !== 'string') return value
        try {
            return JSON.parse(value)
        } catch {
            return {}
        }
    },
    z
        .array(id, { error: 'Products must be a list' })
        .max(MAX_PRODUCTS, `At most ${MAX_PRODUCTS} products per collection`)
        .refine((ids) => new Set(ids).size === ids.length, 'A product is listed twice'),
)

function checkDates(data, ctx) {
    if (data.launchAt && data.endsAt && data.endsAt <= data.launchAt) {
        ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must be after the launch' })
    }
}

export const createCollectionSchema = {
    body: z
        .object({
            name,
            slug: slug.optional(),
            type,
            description: description.optional(),
            isActive: boolish.optional(),
            sortOrder: sortOrder.optional(),
            launchAt: date.optional(),
            endsAt: date.optional(),
            productIds: productIds.optional(),
        })
        .superRefine(checkDates),
}

export const updateCollectionSchema = {
    params: idParams,
    body: z
        .object({
            name: name.optional(),
            slug: slug.optional(),
            description: description.optional(),
            isActive: boolish.optional(),
            sortOrder: sortOrder.optional(),
            launchAt: date.optional(),
            endsAt: date.optional(),
            productIds: productIds.optional(),
        })
        .superRefine(checkDates),
}

export const listCollectionsSchema = {
    query: z.object({
        type: type.optional(),
        includeInactive: boolish.optional(), // staff only
    }),
}

// id or slug
export const collectionRefSchema = { params: z.object({ id: z.string().trim().min(1).max(200) }) }
export const collectionIdSchema = { params: idParams }
