import { z } from 'zod'
import { boolish, description, id, idParams, name, slug, sortOrder } from './common.validation.js'

export const createSubCategorySchema = {
    body: z.object({
        categoryId: id,
        name,
        slug: slug.optional(),
        description: description.optional(),
        isActive: boolish.optional(),
        sortOrder: sortOrder.optional(),
    }),
}

export const updateSubCategorySchema = {
    params: idParams,
    body: z.object({
        categoryId: id.optional(), // move to another category
        name: name.optional(),
        slug: slug.optional(),
        description: description.optional(),
        isActive: boolish.optional(),
        sortOrder: sortOrder.optional(),
        removeImage: boolish.optional(),
    }),
}

export const listSubCategoriesSchema = {
    query: z.object({
        categoryId: id.optional(),
        includeInactive: boolish.optional(),
        search: z.string().trim().max(60).optional(),
    }),
}

export const subCategoryIdSchema = { params: idParams }
