import prisma from '../lib/prisma.js'
import { deleteImage, uploadImage } from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'
import slugify from '../utils/slugify.js'

const IMAGE_FOLDER = 'sub-categories'

const withCategory = { category: { select: { id: true, name: true, slug: true } } }

async function assertCategoryExists(categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })
    if (!category) throw ApiError.badRequest('Selected category does not exist')
}

// Name and slug only need to be unique within the same category
async function assertUnique(categoryId, { name, slug }, excludeId) {
    const or = []
    if (name) or.push({ name: { equals: name, mode: 'insensitive' } })
    if (slug) or.push({ slug })
    if (!or.length) return

    const clash = await prisma.subCategory.findFirst({
        where: { categoryId, OR: or, ...(excludeId && { NOT: { id: excludeId } }) },
        select: { name: true, slug: true },
    })
    if (!clash) return
    if (name && clash.name.toLowerCase() === name.toLowerCase()) {
        throw ApiError.conflict(`This category already has a sub-category named "${clash.name}"`)
    }
    throw ApiError.conflict(`The slug "${slug}" is already used in this category`)
}

function resolveSlug(slug, name) {
    const value = slug ?? slugify(name)
    if (!value) throw ApiError.badRequest('Could not generate a slug from this name, please provide one')
    return value
}

export async function listSubCategories({ categoryId, includeInactive = false, search } = {}) {
    return prisma.subCategory.findMany({
        where: {
            ...(categoryId && { categoryId }),
            ...(!includeInactive && { isActive: true }),
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: withCategory,
    })
}

export async function getSubCategoryById(id) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id }, include: withCategory })
    if (!subCategory) throw ApiError.notFound('Sub-category not found')
    return subCategory
}

export async function createSubCategory(data, file) {
    await assertCategoryExists(data.categoryId)
    const slug = resolveSlug(data.slug, data.name)
    await assertUnique(data.categoryId, { name: data.name, slug })

    const image = file ? await uploadImage(file.buffer, IMAGE_FOLDER) : null

    try {
        return await prisma.subCategory.create({
            data: {
                categoryId: data.categoryId,
                name: data.name,
                slug,
                description: data.description ?? null,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                imageUrl: image?.url,
                imagePublicId: image?.publicId,
            },
            include: withCategory,
        })
    } catch (error) {
        await deleteImage(image?.publicId)
        throw error
    }
}

export async function updateSubCategory(id, data, file) {
    const existing = await prisma.subCategory.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Sub-category not found')

    const targetCategoryId = data.categoryId ?? existing.categoryId
    const movingCategory = targetCategoryId !== existing.categoryId
    if (movingCategory) await assertCategoryExists(targetCategoryId)

    // When moving, the current name/slug must also be free in the new category
    await assertUnique(
        targetCategoryId,
        {
            name: data.name ?? (movingCategory ? existing.name : undefined),
            slug: data.slug ?? (movingCategory ? existing.slug : undefined),
        },
        id,
    )

    const newImage = file ? await uploadImage(file.buffer, IMAGE_FOLDER) : null
    const clearImage = !newImage && data.removeImage === true

    try {
        const updated = await prisma.subCategory.update({
            where: { id },
            data: {
                categoryId: data.categoryId,
                name: data.name,
                slug: data.slug,
                description: data.description,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                ...(newImage && { imageUrl: newImage.url, imagePublicId: newImage.publicId }),
                ...(clearImage && { imageUrl: null, imagePublicId: null }),
            },
            include: withCategory,
        })
        if (newImage || clearImage) await deleteImage(existing.imagePublicId)
        return updated
    } catch (error) {
        await deleteImage(newImage?.publicId)
        throw error
    }
}

export async function deleteSubCategory(id) {
    const existing = await prisma.subCategory.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Sub-category not found')

    await prisma.subCategory.delete({ where: { id } })
    await deleteImage(existing.imagePublicId)

    return { id }
}
