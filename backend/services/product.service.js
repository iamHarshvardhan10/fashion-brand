import prisma from '../lib/prisma.js'
import { deleteImage, uploadImage } from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'
import slugify from '../utils/slugify.js'
import { MAX_IMAGES } from '../validations/product.validation.js'

const IMAGE_FOLDER = 'products'
// Remote DB round trips add up when syncing many variants
const TX_OPTIONS = { timeout: 30_000, maxWait: 10_000 }

const ORDER = {
    newest: [{ createdAt: 'desc' }],
    oldest: [{ createdAt: 'asc' }],
    name: [{ name: 'asc' }],
    'price-asc': [{ price: 'asc' }],
    'price-desc': [{ price: 'desc' }],
    'stock-asc': [{ totalStock: 'asc' }],
    'stock-desc': [{ totalStock: 'desc' }],
}

const INDUSTRIES_INCLUDE = { select: { industry: { select: { id: true, name: true, slug: true } } } }

const DETAIL_INCLUDE = {
    category: { select: { id: true, name: true, slug: true } },
    industries: INDUSTRIES_INCLUDE,
    subCategory: { select: { id: true, name: true, slug: true } },
    sizeChart: true,
    images: { orderBy: { sortOrder: 'asc' } },
    variants: { orderBy: { sortOrder: 'asc' } },
    attributes: { orderBy: { sortOrder: 'asc' } },
}

// ---------- Serializers ----------

// Join rows -> plain list: industries: [{ id, name, slug }]
function flattenIndustries(product) {
    if (!product?.industries) return product
    return { ...product, industries: product.industries.map((row) => row.industry) }
}

// Cost price and internal stock thresholds never leave the dashboard
function toPublic(product) {
    if (!product) return product
    const { costPrice, ...rest } = product // eslint-disable-line no-unused-vars
    if (rest.variants) {
        rest.variants = rest.variants
            .filter((v) => v.isActive)
            .map(({ lowStockThreshold, ...v }) => v) // eslint-disable-line no-unused-vars
    }
    return rest
}

function toListItem(product) {
    const { variants, images, ...rest } = flattenIndustries(product)
    const active = variants.filter((v) => v.isActive)
    return {
        ...rest,
        image: images[0] ?? null,
        variantCount: active.length,
        lowStockCount: active.filter((v) => v.stock > 0 && v.stock <= v.lowStockThreshold).length,
        outOfStockCount: active.filter((v) => v.stock === 0).length,
    }
}

// ---------- Checks ----------

async function assertCategory(categoryId, subCategoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })
    if (!category) throw ApiError.badRequest('Validation failed', [{ field: 'categoryId', message: 'Category not found' }])
    if (!subCategoryId) return
    const sub = await prisma.subCategory.findUnique({ where: { id: subCategoryId }, select: { categoryId: true } })
    if (!sub || sub.categoryId !== categoryId) {
        throw ApiError.badRequest('Validation failed', [
            { field: 'subCategoryId', message: 'Sub-category does not belong to this category' },
        ])
    }
}

async function assertIndustries(industryIds) {
    if (!industryIds?.length) return
    const found = await prisma.industry.count({ where: { id: { in: industryIds } } })
    if (found !== industryIds.length) {
        throw ApiError.badRequest('Validation failed', [{ field: 'industryIds', message: 'Some industries no longer exist' }])
    }
}

async function assertStyleCodeFree(styleCode, excludeId) {
    if (!styleCode) return
    const clash = await prisma.product.findFirst({
        where: { styleCode, ...(excludeId && { NOT: { id: excludeId } }) },
        select: { name: true },
    })
    if (clash) throw ApiError.conflict(`Style code ${styleCode} is already used by "${clash.name}"`)
}

// SKUs and barcodes are unique across the whole catalogue
async function assertVariantCodesFree(variants, productId) {
    const skus = variants.map((v) => v.sku)
    const barcodes = variants.map((v) => v.barcode).filter(Boolean)
    if (!skus.length) return
    const clashes = await prisma.productVariant.findMany({
        where: {
            OR: [{ sku: { in: skus } }, ...(barcodes.length ? [{ barcode: { in: barcodes } }] : [])],
            ...(productId && { NOT: { productId } }),
        },
        select: { sku: true, barcode: true, product: { select: { name: true } } },
    })
    if (!clashes.length) return
    const errors = []
    variants.forEach((v, i) => {
        const sku = clashes.find((c) => c.sku === v.sku)
        if (sku) errors.push({ field: `variants.${i}.sku`, message: `Already used by "${sku.product.name}"` })
        const barcode = v.barcode && clashes.find((c) => c.barcode === v.barcode)
        if (barcode) errors.push({ field: `variants.${i}.barcode`, message: `Already used by "${barcode.product.name}"` })
    })
    throw new ApiError(409, 'Some SKUs or barcodes are already in use', errors)
}

async function resolveSlug(requested, name, excludeId) {
    const notSelf = excludeId ? { NOT: { id: excludeId } } : {}
    if (requested) {
        const clash = await prisma.product.findFirst({ where: { slug: requested, ...notSelf }, select: { id: true } })
        if (clash) throw ApiError.conflict(`The URL /product/${requested} is already used by another product`)
        return requested
    }
    // Generated slugs get a numeric suffix instead of failing: "graphic-tee-2"
    const base = slugify(name)
    if (!base) throw ApiError.badRequest('Could not generate a URL from this name, please provide one')
    const taken = new Set(
        (await prisma.product.findMany({ where: { slug: { startsWith: base }, ...notSelf }, select: { slug: true } })).map((p) => p.slug),
    )
    if (!taken.has(base)) return base
    let n = 2
    while (taken.has(`${base}-${n}`)) n++
    return `${base}-${n}`
}

async function assertPublishable(tx, productId) {
    const [images, variants] = await Promise.all([
        tx.productImage.count({ where: { productId } }),
        tx.productVariant.count({ where: { productId, isActive: true } }),
    ])
    const errors = []
    if (!images) errors.push({ field: 'images', message: 'Add at least one image before publishing' })
    if (!variants) errors.push({ field: 'variants', message: 'Add at least one active variant before publishing' })
    if (errors.length) throw ApiError.badRequest('This product is not ready to publish', errors)
}

async function recomputeStock(tx, productId) {
    const { _sum } = await tx.productVariant.aggregate({ where: { productId, isActive: true }, _sum: { stock: true } })
    await tx.product.update({ where: { id: productId }, data: { totalStock: _sum.stock ?? 0 } })
}

// Scalar product columns (everything except relations handled separately)
function productColumns(data) {
    const { attributes, variants, industryIds, ...columns } = data // eslint-disable-line no-unused-vars
    return columns
}

const variantColumns = (v, index) => ({
    sku: v.sku,
    barcode: v.barcode ?? null,
    size: v.size,
    color: v.color ?? null,
    colorHex: v.colorHex ?? null,
    price: v.price ?? null,
    mrp: v.mrp ?? null,
    stock: v.stock,
    lowStockThreshold: v.lowStockThreshold ?? 5,
    isActive: v.isActive ?? true,
    sortOrder: index,
})

const attributeRows = (productId, attributes) =>
    attributes.map((a, i) => ({ productId, label: a.label, values: a.values, sortOrder: i }))

// ---------- Queries ----------

export async function listProducts({ search, status, categoryId, subCategoryId, industryId, stock, sort = 'newest', page = 1, pageSize = 20 }, staff) {
    const base = {
        ...(categoryId && { categoryId }),
        ...(subCategoryId && { subCategoryId }),
        ...(industryId && { industries: { some: { industryId } } }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { styleCode: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { searchKeywords: { has: search.toLowerCase() } },
                { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
            ],
        }),
        ...(stock === 'out' && { totalStock: 0 }),
        ...(stock === 'in' && { totalStock: { gt: 0 } }),
        // Variant-level: some size is running low (1..threshold) / some size is sold out
        ...(stock === 'low' && {
            variants: { some: { isActive: true, stock: { gt: 0, lte: prisma.productVariant.fields.lowStockThreshold } } },
        }),
        ...(stock === 'sizes-out' && { variants: { some: { isActive: true, stock: 0 } } }),
    }
    const where = { ...base, status: staff ? status : 'ACTIVE' }

    const [items, total, byStatus] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy: ORDER[sort],
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                category: { select: { id: true, name: true } },
                subCategory: { select: { id: true, name: true } },
                industries: INDUSTRIES_INCLUDE,
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                variants: { select: { stock: true, lowStockThreshold: true, isActive: true } },
            },
        }),
        prisma.product.count({ where }),
        staff ? prisma.product.groupBy({ by: ['status'], where: base, _count: true }) : [],
    ])

    const counts = Object.fromEntries(byStatus.map((row) => [row.status, row._count]))
    return {
        items: items.map((p) => (staff ? toListItem(p) : toPublic(toListItem(p)))),
        total,
        page,
        pageSize,
        ...(staff && { counts }),
    }
}

// `ref` is an id or a slug
export async function getProduct(ref, staff) {
    const product = await prisma.product.findFirst({
        where: { OR: [{ id: ref }, { slug: ref }], ...(!staff && { status: 'ACTIVE' }) },
        include: DETAIL_INCLUDE,
    })
    if (!product) throw ApiError.notFound('Product not found')
    const flat = flattenIndustries(product)
    return staff ? flat : toPublic(flat)
}

// ---------- Mutations ----------

export async function createProduct(data, userId) {
    if (data.status === 'ACTIVE') {
        throw ApiError.badRequest('Save the product as a draft, add images, then publish it')
    }
    await assertCategory(data.categoryId, data.subCategoryId)
    await assertIndustries(data.industryIds)
    await assertStyleCodeFree(data.styleCode)
    await assertVariantCodesFree(data.variants)
    const slug = await resolveSlug(data.slug, data.name)

    const id = await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
            data: {
                ...productColumns(data),
                slug,
                totalStock: data.variants.filter((v) => v.isActive !== false).reduce((sum, v) => sum + v.stock, 0),
                variants: { create: data.variants.map(variantColumns) },
                attributes: { create: data.attributes.map((a, i) => ({ label: a.label, values: a.values, sortOrder: i })) },
                industries: { create: data.industryIds.map((industryId) => ({ industryId })) },
            },
            include: { variants: { select: { id: true, stock: true } } },
        })
        const opening = product.variants.filter((v) => v.stock > 0)
        if (opening.length) {
            await tx.inventoryLog.createMany({
                data: opening.map((v) => ({
                    variantId: v.id,
                    change: v.stock,
                    stockAfter: v.stock,
                    reason: 'RESTOCK',
                    note: 'Opening stock',
                    userId,
                })),
            })
        }
        return product.id
    }, TX_OPTIONS)

    return getProduct(id, true)
}

export async function updateProduct(id, data, userId) {
    const existing = await prisma.product.findUnique({
        where: { id },
        include: { variants: { include: { _count: { select: { orderItems: true } } } } },
    })
    if (!existing) throw ApiError.notFound('Product not found')

    // Fields not sent keep their stored values
    const price = data.price ?? existing.price
    const mrp = data.mrp ?? existing.mrp
    if (price > mrp) throw ApiError.badRequest('Validation failed', [{ field: 'price', message: 'Selling price cannot be above MRP' }])

    const categoryId = data.categoryId ?? existing.categoryId
    const categoryChanged = categoryId !== existing.categoryId
    const subCategoryId =
        data.subCategoryId !== undefined ? data.subCategoryId : categoryChanged ? null : existing.subCategoryId
    if (data.categoryId !== undefined || data.subCategoryId !== undefined) await assertCategory(categoryId, subCategoryId)

    if (data.styleCode && data.styleCode !== existing.styleCode) await assertStyleCodeFree(data.styleCode, id)
    await assertIndustries(data.industryIds)
    const slug = data.slug && data.slug !== existing.slug ? await resolveSlug(data.slug, existing.name, id) : undefined

    // ---- Variant plan ----
    let plan = null
    if (data.variants) {
        const byId = new Map(existing.variants.map((v) => [v.id, v]))
        const unknown = data.variants.find((v) => v.id && !byId.has(v.id))
        if (unknown) throw ApiError.badRequest('A variant does not belong to this product')
        await assertVariantCodesFree(data.variants, id)

        const keptIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id))
        let removed = existing.variants.filter((v) => !keptIds.has(v.id))
        // A "new" row matching a removed variant (same SKU or size + colour) revives that variant,
        // which avoids unique-constraint clashes and keeps its order history attached.
        const incoming = data.variants.map((v) => {
            if (v.id) return v
            const match = removed.find(
                (r) => r.sku === v.sku || (r.size.toLowerCase() === v.size.toLowerCase() && (r.color ?? '').toLowerCase() === (v.color ?? '').toLowerCase()),
            )
            if (!match) return v
            removed = removed.filter((r) => r !== match)
            return { ...v, id: match.id }
        })

        plan = {
            incoming,
            toDelete: removed.filter((v) => v._count.orderItems === 0).map((v) => v.id),
            // Sold variants are kept (inactive) so past orders still resolve
            toDeactivate: removed.filter((v) => v._count.orderItems > 0 && v.isActive).map((v) => v.id),
            byId,
        }
    }

    const nextStatus = data.status ?? existing.status

    await prisma.$transaction(async (tx) => {
        if (plan) {
            if (plan.toDelete.length) await tx.productVariant.deleteMany({ where: { id: { in: plan.toDelete } } })
            if (plan.toDeactivate.length) {
                await tx.productVariant.updateMany({ where: { id: { in: plan.toDeactivate } }, data: { isActive: false } })
            }

            const logs = []
            for (const [index, v] of plan.incoming.entries()) {
                const columns = variantColumns(v, index)
                const prev = v.id ? plan.byId.get(v.id) : null
                if (prev) {
                    const changed = Object.entries(columns).some(([key, value]) => prev[key] !== value)
                    if (changed) await tx.productVariant.update({ where: { id: prev.id }, data: columns })
                    if (prev.stock !== columns.stock) {
                        logs.push({ variantId: prev.id, change: columns.stock - prev.stock, stockAfter: columns.stock, reason: 'ADJUSTMENT', note: 'Edited in product form', userId })
                    }
                } else {
                    const created = await tx.productVariant.create({ data: { ...columns, productId: id }, select: { id: true } })
                    if (columns.stock > 0) {
                        logs.push({ variantId: created.id, change: columns.stock, stockAfter: columns.stock, reason: 'RESTOCK', note: 'Opening stock', userId })
                    }
                }
            }
            if (logs.length) await tx.inventoryLog.createMany({ data: logs })
        }

        if (data.industryIds) {
            await tx.productIndustry.deleteMany({ where: { productId: id } })
            if (data.industryIds.length) {
                await tx.productIndustry.createMany({ data: data.industryIds.map((industryId) => ({ productId: id, industryId })) })
            }
        }

        if (data.attributes) {
            await tx.productAttribute.deleteMany({ where: { productId: id } })
            if (data.attributes.length) await tx.productAttribute.createMany({ data: attributeRows(id, data.attributes) })
        }

        await tx.product.update({
            where: { id },
            data: {
                ...productColumns(data),
                slug,
                subCategoryId,
                ...(nextStatus === 'ACTIVE' && !existing.publishedAt && { publishedAt: new Date() }),
            },
        })

        if (plan) await recomputeStock(tx, id)
        if (nextStatus === 'ACTIVE') await assertPublishable(tx, id)
    }, TX_OPTIONS)

    return getProduct(id, true)
}

export async function deleteProduct(id) {
    const product = await prisma.product.findUnique({
        where: { id },
        include: { images: { select: { publicId: true } }, _count: { select: { orderItems: true } } },
    })
    if (!product) throw ApiError.notFound('Product not found')
    if (product._count.orderItems) {
        throw ApiError.conflict('This product has orders, so it can only be archived. Archiving hides it from the store.')
    }

    await prisma.product.delete({ where: { id } })
    await Promise.all(product.images.map((img) => deleteImage(img.publicId)))
    return { id }
}

// ---------- Images ----------

async function findProductForImages(id) {
    const product = await prisma.product.findUnique({
        where: { id },
        select: { id: true, name: true, status: true, _count: { select: { images: true } } },
    })
    if (!product) throw ApiError.notFound('Product not found')
    return product
}

const listImages = (productId) => prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } })

export async function addImages(id, files = [], meta = []) {
    if (!files.length) throw ApiError.badRequest('Choose at least one image')
    const product = await findProductForImages(id)
    if (product._count.images + files.length > MAX_IMAGES) {
        throw ApiError.badRequest(`A product can have at most ${MAX_IMAGES} images (it has ${product._count.images})`)
    }

    const results = await Promise.allSettled(files.map((file) => uploadImage(file.buffer, IMAGE_FOLDER)))
    const uploaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    if (uploaded.length !== files.length) {
        await Promise.all(uploaded.map((img) => deleteImage(img.publicId)))
        throw new ApiError(502, 'Image upload failed, please try again')
    }

    const last = await prisma.productImage.aggregate({ where: { productId: id }, _max: { sortOrder: true } })
    const start = (last._max.sortOrder ?? -1) + 1
    try {
        await prisma.productImage.createMany({
            data: uploaded.map((img, i) => ({
                productId: id,
                url: img.url,
                publicId: img.publicId,
                alt: meta[i]?.alt ?? product.name,
                color: meta[i]?.color ?? null,
                sortOrder: start + i,
            })),
        })
    } catch (error) {
        await Promise.all(uploaded.map((img) => deleteImage(img.publicId)))
        throw error
    }
    return listImages(id)
}

export async function updateImage(id, imageId, data) {
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } })
    if (!image) throw ApiError.notFound('Image not found')
    await prisma.productImage.update({ where: { id: imageId }, data: { alt: data.alt, color: data.color } })
    return listImages(id)
}

export async function reorderImages(id, ids) {
    const images = await listImages(id)
    const current = new Set(images.map((img) => img.id))
    if (ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every((x) => current.has(x))) {
        throw ApiError.badRequest('Send every image of this product exactly once')
    }
    await prisma.$transaction(ids.map((imageId, index) => prisma.productImage.update({ where: { id: imageId }, data: { sortOrder: index } })))
    return listImages(id)
}

export async function removeImage(id, imageId) {
    const product = await findProductForImages(id)
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } })
    if (!image) throw ApiError.notFound('Image not found')
    if (product.status === 'ACTIVE' && product._count.images <= 1) {
        throw ApiError.conflict('A live product needs at least one image. Upload another first, or unpublish it.')
    }
    await prisma.productImage.delete({ where: { id: imageId } })
    await deleteImage(image.publicId)
    return listImages(id)
}
