import { z } from 'zod'
import { boolish, description, id, idParams, slug, sortOrder } from './common.validation.js'

const name = z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(40, 'Name must be at most 40 characters')

// Multipart sends the list as a JSON string: ["catId1", "catId2"] in navbar order
const categoryIds = z.preprocess(
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
        .array(id, { error: 'Categories must be a list' })
        .max(30, 'At most 30 categories')
        .refine((ids) => new Set(ids).size === ids.length, 'A category is listed twice'),
)

export const createIndustrySchema = {
    body: z.object({
        name,
        slug: slug.optional(),
        description: description.optional(),
        isActive: boolish.optional(),
        showInNav: boolish.optional(),
        sortOrder: sortOrder.optional(),
        categoryIds: categoryIds.optional(),
    }),
}

export const updateIndustrySchema = {
    params: idParams,
    body: z.object({
        name: name.optional(),
        slug: slug.optional(),
        description: description.optional(),
        isActive: boolish.optional(),
        showInNav: boolish.optional(),
        sortOrder: sortOrder.optional(),
        categoryIds: categoryIds.optional(),
        removeImage: boolish.optional(),
    }),
}

export const listIndustriesSchema = {
    query: z.object({
        nav: boolish.optional(), // only industries marked "show in navbar"
        includeInactive: boolish.optional(), // staff only
    }),
}

export const industryRefSchema = { params: z.object({ id: z.string().trim().min(1).max(200) }) } // id or slug
export const industryIdSchema = { params: idParams }
