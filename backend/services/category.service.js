import prisma from '../lib/prisma.js'
import { deleteImage, uploadImage } from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'
import slugify from '../utils/slugify.js'

const IMAGE_FOLDER = 'categories'

// Name and slug must be unique across categories (name compared case-insensitively)
async function assertUnique({ name, slug }, excludeId) {
    const or = []
    if (name) or.push({ name: { equals: name, mode: 'insensitive' } })
    if (slug) or.push({ slug })
    if (!or.length) return

    const clash = await prisma.category.findFirst({
        where: { OR: or, ...(excludeId && { NOT: { id: excludeId } }) },
        select: { name: true, slug: true },
    })
    if (!clash) return
    if (name && clash.name.toLowerCase() === name.toLowerCase()) {
        throw ApiError.conflict(`A category named "${clash.name}" already exists`)
    }
    throw ApiError.conflict(`The slug "${slug}" is already used by another category`)
}

function resolveSlug(slug, name) {
    const value = slug ?? slugify(name)
    if (!value) throw ApiError.badRequest('Could not generate a slug from this name, please provide one')
    return value
}

export async function listCategories({ includeInactive = false, withSubCategories = false, search } = {}) {
    return prisma.category.findMany({
        where: {
            ...(!includeInactive && { isActive: true }),
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
            _count: { select: { subCategories: true } },
            ...(withSubCategories && {
                subCategories: {
                    where: includeInactive ? undefined : { isActive: true },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                },
            }),
        },
    })
}

export async function getCategoryById(id) {
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            _count: { select: { subCategories: true } },
            subCategories: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        },
    })
    if (!category) throw ApiError.notFound('Category not found')
    return category
}

export async function createCategory(data, file) {
    const slug = resolveSlug(data.slug, data.name)
    await assertUnique({ name: data.name, slug })

    const image = file ? await uploadImage(file.buffer, IMAGE_FOLDER) : null

    try {
        return await prisma.category.create({
            data: {
                name: data.name,
                slug,
                description: data.description ?? null,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                imageUrl: image?.url,
                imagePublicId: image?.publicId,
            },
            include: { _count: { select: { subCategories: true } } },
        })
    } catch (error) {
        await deleteImage(image?.publicId) // don't leave orphaned uploads
        throw error
    }
}

export async function updateCategory(id, data, file) {
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Category not found')

    // Renaming keeps the old slug so existing URLs don't break; send a slug to change it
    await assertUnique(
        {
            name: data.name && data.name !== existing.name ? data.name : undefined,
            slug: data.slug && data.slug !== existing.slug ? data.slug : undefined,
        },
        id,
    )

    const newImage = file ? await uploadImage(file.buffer, IMAGE_FOLDER) : null
    const clearImage = !newImage && data.removeImage === true

    try {
        const updated = await prisma.category.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                ...(newImage && { imageUrl: newImage.url, imagePublicId: newImage.publicId }),
                ...(clearImage && { imageUrl: null, imagePublicId: null }),
            },
            include: { _count: { select: { subCategories: true } } },
        })
        if (newImage || clearImage) await deleteImage(existing.imagePublicId)
        return updated
    } catch (error) {
        await deleteImage(newImage?.publicId)
        throw error
    }
}

export async function deleteCategory(id) {
    const existing = await prisma.category.findUnique({
        where: { id },
        include: { subCategories: { select: { imagePublicId: true } } },
    })
    if (!existing) throw ApiError.notFound('Category not found')

    // Sub-categories are removed by the onDelete: Cascade relation
    await prisma.category.delete({ where: { id } })

    await Promise.all([
        deleteImage(existing.imagePublicId),
        ...existing.subCategories.map((sub) => deleteImage(sub.imagePublicId)),
    ])

    return { id, deletedSubCategories: existing.subCategories.length }
}
