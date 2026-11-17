import { z } from 'zod'
import { boolish, description, idParams, name, slug, sortOrder } from './common.validation.js'

export const createCategorySchema = {
    body: z.object({
        name,
        slug: slug.optional(), // generated from name when omitted
        description: description.optional(),
        isActive: boolish.optional(),
        sortOrder: sortOrder.optional(),
    }),
}

export const updateCategorySchema = {
    params: idParams,
    body: z.object({
        name: name.optional(),
        slug: slug.optional(),
        description: description.optional(),
        isActive: boolish.optional(),
        sortOrder: sortOrder.optional(),
        removeImage: boolish.optional(), // send true to clear the current image
    }),
}

export const listCategoriesSchema = {
    query: z.object({
        includeInactive: boolish.optional(),
        withSubCategories: boolish.optional(),
        search: z.string().trim().max(60).optional(),
    }),
}

export const categoryIdSchema = { params: idParams }
