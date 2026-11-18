import prisma from '../lib/prisma.js'
import { deleteImage, uploadImage } from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'
import slugify from '../utils/slugify.js'

const IMAGE_FOLDER = 'collections'
const ORDER_BY = [{ sortOrder: 'asc' }, { createdAt: 'asc' }]

// Public = switched on and not past its end date
const liveWhere = (now = new Date()) => ({ isActive: true, OR: [{ endsAt: null }, { endsAt: { gt: now } }] })

// Products as shown on cards: live only, main image, in the collection's order
const productInclude = (staff) => ({
    where: staff ? undefined : { product: { status: 'ACTIVE' } },
    orderBy: { sortOrder: 'asc' },
    include: {
        product: {
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                mrp: true,
                tag: true,
                status: true,
                totalStock: true,
                category: { select: { id: true, name: true, slug: true } },
                images: { orderBy: { sortOrder: 'asc' }, take: 2, select: { url: true, alt: true } },
            },
        },
    },
})

// Flatten the join rows into a plain product list
function shape(collection) {
    if (!collection) return collection
    const { products, ...rest } = collection
    return products ? { ...rest, products: products.map((row) => row.product) } : rest
}

async function resolveSlug(requested, name, excludeId) {
    const notSelf = excludeId ? { NOT: { id: excludeId } } : {}
    const value = requested ?? slugify(name)
    if (!value) throw ApiError.badRequest('Could not generate a URL from this name, please provide one')
    const clash = await prisma.collection.findFirst({ where: { slug: value, ...notSelf }, select: { name: true } })
    if (clash) throw ApiError.conflict(`The URL "${value}" is already used by "${clash.name}"`)
    return value
}

async function assertProductsExist(productIds) {
    if (!productIds?.length) return
    const found = await prisma.product.count({ where: { id: { in: productIds } } })
    if (found !== productIds.length) {
        throw ApiError.badRequest('Validation failed', [{ field: 'productIds', message: 'Some products no longer exist' }])
    }
}

const productRows = (productIds) => productIds.map((productId, sortOrder) => ({ productId, sortOrder }))

export async function listCollections({ type, includeInactive = false } = {}) {
    const collections = await prisma.collection.findMany({
        where: { ...(type && { type }), ...(!includeInactive && liveWhere()) },
        orderBy: ORDER_BY,
        include: { _count: { select: { products: true } } },
    })
    return collections
}

export async function getCollection(ref, staff) {
    const collection = await prisma.collection.findFirst({
        // AND, not spread: liveWhere() has its own OR, which would replace this one
        where: { AND: [{ OR: [{ id: ref }, { slug: ref }] }, ...(staff ? [] : [liveWhere()])] },
        include: { _count: { select: { products: true } }, products: productInclude(staff) },
    })
    if (!collection) throw ApiError.notFound('Collection not found')
    return shape(collection)
}

export async function createCollection(data, file) {
    if (!file) throw ApiError.badRequest('Validation failed', [{ field: 'image', message: 'An image is required' }])
    const slug = await resolveSlug(data.slug, data.name)
    await assertProductsExist(data.productIds)

    const image = await uploadImage(file.buffer, IMAGE_FOLDER)
    try {
        const created = await prisma.collection.create({
            data: {
                name: data.name,
                slug,
                type: data.type ?? 'EDIT',
                description: data.description ?? null,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                launchAt: data.launchAt ?? null,
                endsAt: data.endsAt ?? null,
                imageUrl: image.url,
                imagePublicId: image.publicId,
                ...(data.productIds?.length && { products: { create: productRows(data.productIds) } }),
            },
        })
        return getCollection(created.id, true)
    } catch (error) {
        await deleteImage(image.publicId) // don't leave orphaned uploads
        throw error
    }
}

export async function updateCollection(id, data, file) {
    const existing = await prisma.collection.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Collection not found')

    const launchAt = data.launchAt === undefined ? existing.launchAt : data.launchAt
    const endsAt = data.endsAt === undefined ? existing.endsAt : data.endsAt
    if (launchAt && endsAt && endsAt <= launchAt) {
        throw ApiError.badRequest('Validation failed', [{ field: 'endsAt', message: 'End must be after the launch' }])
    }

    const slug = data.slug && data.slug !== existing.slug ? await resolveSlug(data.slug, existing.name, id) : undefined
    await assertProductsExist(data.productIds)

    const image = file ? await uploadImage(file.buffer, IMAGE_FOLDER) : null
    try {
        await prisma.$transaction(async (tx) => {
            await tx.collection.update({
                where: { id },
                data: {
                    name: data.name,
                    slug,
                    description: data.description,
                    isActive: data.isActive,
                    sortOrder: data.sortOrder,
                    launchAt: data.launchAt,
                    endsAt: data.endsAt,
                    ...(image && { imageUrl: image.url, imagePublicId: image.publicId }),
                },
            })
            // The list replaces the current products and their order
            if (data.productIds) {
                await tx.collectionProduct.deleteMany({ where: { collectionId: id } })
                if (data.productIds.length) {
                    await tx.collectionProduct.createMany({
                        data: productRows(data.productIds).map((row) => ({ ...row, collectionId: id })),
                    })
                }
            }
        })
    } catch (error) {
        await deleteImage(image?.publicId)
        throw error
    }

    if (image) await deleteImage(existing.imagePublicId)
    return getCollection(id, true)
}

export async function deleteCollection(id) {
    const existing = await prisma.collection.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Collection not found')
    // Product links go with it (onDelete: Cascade); the products themselves stay
    await prisma.collection.delete({ where: { id } })
    await deleteImage(existing.imagePublicId)
    return { id }
}
