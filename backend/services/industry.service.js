import prisma from '../lib/prisma.js'
import { deleteImage, uploadImage } from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'
import slugify from '../utils/slugify.js'

const IMAGE_FOLDER = 'industries'
const ORDER_BY = [{ sortOrder: 'asc' }, { name: 'asc' }]

// Categories (and their sub-categories) in this industry's order. Storefront sees active ones only.
const categoriesInclude = (staff) => ({
    where: staff ? undefined : { category: { isActive: true } },
    orderBy: { sortOrder: 'asc' },
    select: {
        category: {
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                imageUrl: true,
                subCategories: {
                    where: staff ? undefined : { isActive: true },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                    select: { id: true, name: true, slug: true, isActive: true },
                },
            },
        },
    },
})

const include = (staff) => ({
    categories: categoriesInclude(staff),
    _count: { select: { products: true } },
})

// Join rows -> categories: [{ id, name, slug, subCategories }]
const shape = (industry) => industry && { ...industry, categories: industry.categories.map((row) => row.category) }

async function assertUnique({ name, slug }, excludeId) {
    const or = [...(name ? [{ name: { equals: name, mode: 'insensitive' } }] : []), ...(slug ? [{ slug }] : [])]
    if (!or.length) return
    const clash = await prisma.industry.findFirst({
        where: { OR: or, ...(excludeId && { NOT: { id: excludeId } }) },
        select: { name: true, slug: true },
    })
    if (!clash) return
    if (name && clash.name.toLowerCase() === name.toLowerCase()) throw ApiError.conflict(`An industry named "${clash.name}" already exists`)
    throw ApiError.conflict(`The URL /${slug} is already used by "${clash.name}"`)
}

async function assertCategories(categoryIds) {
    if (!categoryIds?.length) return
    const found = await prisma.category.count({ where: { id: { in: categoryIds } } })
    if (found !== categoryIds.length) {
        throw ApiError.badRequest('Validation failed', [{ field: 'categoryIds', message: 'Some categories no longer exist' }])
    }
}

const categoryRows = (categoryIds) => categoryIds.map((categoryId, sortOrder) => ({ categoryId, sortOrder }))

export async function listIndustries({ nav = false, includeInactive = false } = {}, staff = false) {
    const industries = await prisma.industry.findMany({
        where: { ...(!includeInactive && { isActive: true }), ...(nav && { showInNav: true }) },
        orderBy: ORDER_BY,
        include: include(staff && includeInactive),
    })
    return industries.map(shape)
}

export async function getIndustry(ref, staff) {
    const industry = await prisma.industry.findFirst({
        where: { AND: [{ OR: [{ id: ref }, { slug: ref }] }, ...(staff ? [] : [{ isActive: true }])] },
        include: include(staff),
    })
    if (!industry) throw ApiError.notFound('Industry not found')
    return shape(industry)
}

export async function createIndustry(data, file) {
    const slug = data.slug ?? slugify(data.name)
    if (!slug) throw ApiError.badRequest('Could not generate a URL from this name, please provide one')
    await assertUnique({ name: data.name, slug })
    await assertCategories(data.categoryIds)

    const image = file ? await uploadImage(file.buffer, IMAGE_FOLDER) : null
    try {
        const created = await prisma.industry.create({
            data: {
                name: data.name,
                slug,
                description: data.description ?? null,
                isActive: data.isActive,
                showInNav: data.showInNav,
                sortOrder: data.sortOrder,
                imageUrl: image?.url,
                imagePublicId: image?.publicId,
                ...(data.categoryIds?.length && { categories: { create: categoryRows(data.categoryIds) } }),
            },
        })
        return getIndustry(created.id, true)
    } catch (error) {
        await deleteImage(image?.publicId)
        throw error
    }
}

export async function updateIndustry(id, data, file) {
    const existing = await prisma.industry.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Industry not found')

    await assertUnique(
        {
            name: data.name && data.name !== existing.name ? data.name : undefined,
            slug: data.slug && data.slug !== existing.slug ? data.slug : undefined,
        },
        id,
    )
    await assertCategories(data.categoryIds)

    const image = file ? await uploadImage(file.buffer, IMAGE_FOLDER) : null
    const clearImage = !image && data.removeImage === true

    try {
        await prisma.$transaction(async (tx) => {
            await tx.industry.update({
                where: { id },
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    isActive: data.isActive,
                    showInNav: data.showInNav,
                    sortOrder: data.sortOrder,
                    ...(image && { imageUrl: image.url, imagePublicId: image.publicId }),
                    ...(clearImage && { imageUrl: null, imagePublicId: null }),
                },
            })
            // The list replaces the current categories and their order
            if (data.categoryIds) {
                await tx.industryCategory.deleteMany({ where: { industryId: id } })
                if (data.categoryIds.length) {
                    await tx.industryCategory.createMany({ data: categoryRows(data.categoryIds).map((row) => ({ ...row, industryId: id })) })
                }
            }
        })
    } catch (error) {
        await deleteImage(image?.publicId)
        throw error
    }

    if (image || clearImage) await deleteImage(existing.imagePublicId)
    return getIndustry(id, true)
}

export async function deleteIndustry(id) {
    const existing = await prisma.industry.findUnique({ where: { id }, include: { _count: { select: { products: true } } } })
    if (!existing) throw ApiError.notFound('Industry not found')
    // Category and product links go with it (onDelete: Cascade); categories and products stay
    await prisma.industry.delete({ where: { id } })
    await deleteImage(existing.imagePublicId)
    return { id, unlinkedProducts: existing._count.products }
}
