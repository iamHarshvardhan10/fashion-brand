import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma.js'
import { deleteImage, uploadImage } from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'

const IMAGE_FOLDER = 'banners'

const ORDER_BY = [{ sortOrder: 'asc' }, { createdAt: 'asc' }]

// Live = switched on and inside its optional start/end window
function liveWhere(now = new Date()) {
    return {
        isActive: true,
        AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
    }
}

// Same rules as checkBannerRules, applied to the row as it will look after an update
function assertConsistent({ ctaLabel, linkUrl, startsAt, endsAt }) {
    const errors = []
    if (ctaLabel && !linkUrl) errors.push({ field: 'linkUrl', message: 'Add a link for the button' })
    if (startsAt && endsAt && endsAt <= startsAt) errors.push({ field: 'endsAt', message: 'End must be after the start' })
    if (errors.length) throw ApiError.badRequest('Validation failed', errors)
}

const fileAt = (files, name) => files?.[name]?.[0]
const upload = (file) => (file ? uploadImage(file.buffer, IMAGE_FOLDER) : null)

// Builds the stored card list. Cards are matched to existing ones by id, so an image is only ever
// kept from this banner's own cards (never a client-supplied URL), and replaced/removed images
// are returned for deletion once the row is saved.
async function resolveItems(incoming, existing, files) {
    if (incoming === undefined) return { items: undefined, uploaded: [], obsolete: [] }

    const previous = new Map((Array.isArray(existing) ? existing : []).map((item) => [item.id, item]))
    const uploaded = []
    const obsolete = []
    const items = []

    try {
        for (const [index, card] of (incoming ?? []).entries()) {
            const prev = card.id ? previous.get(card.id) : undefined
            previous.delete(card.id)

            const image = await upload(fileAt(files, `itemImage${index}`))
            if (image) uploaded.push(image.publicId)

            let imageUrl = null
            let imagePublicId = null
            if (image) {
                ;({ url: imageUrl, publicId: imagePublicId } = image)
                if (prev?.imagePublicId) obsolete.push(prev.imagePublicId)
            } else if (prev && !card.removeImage) {
                ;({ imageUrl, imagePublicId } = prev)
            } else if (prev?.imagePublicId) {
                obsolete.push(prev.imagePublicId)
            }

            items.push({
                id: prev?.id ?? randomUUID(),
                label: card.label,
                value: card.value,
                linkUrl: card.linkUrl,
                imageUrl,
                imagePublicId,
            })
        }
    } catch (error) {
        await Promise.all(uploaded.map(deleteImage))
        throw error
    }

    // Cards that were dropped from the list
    for (const removed of previous.values()) if (removed.imagePublicId) obsolete.push(removed.imagePublicId)

    return { items: incoming === null || !items.length ? Prisma.DbNull : items, uploaded, obsolete }
}

export async function listBanners({ placement, includeInactive = false } = {}) {
    return prisma.banner.findMany({
        where: {
            ...(placement && { placement }),
            ...(!includeInactive && liveWhere()),
        },
        orderBy: ORDER_BY,
    })
}

export async function getBannerById(id) {
    const banner = await prisma.banner.findUnique({ where: { id } })
    if (!banner) throw ApiError.notFound('Banner not found')
    return banner
}

export async function createBanner(data, files) {
    if (!fileAt(files, 'image')) {
        throw ApiError.badRequest('Validation failed', [{ field: 'image', message: 'A banner image is required' }])
    }

    const [image, mobileImage] = await Promise.all([upload(fileAt(files, 'image')), upload(fileAt(files, 'mobileImage'))])
    const uploaded = [image.publicId, mobileImage?.publicId]

    try {
        const { items, uploaded: itemUploads } = await resolveItems(data.items, [], files)
        uploaded.push(...itemUploads)

        return await prisma.banner.create({
            data: {
                title: data.title,
                subtitle: data.subtitle ?? null,
                highlight: data.highlight ?? null,
                ctaLabel: data.ctaLabel ?? null,
                linkUrl: data.linkUrl ?? null,
                backgroundColor: data.backgroundColor ?? null,
                items: items ?? Prisma.DbNull,
                placement: data.placement ?? 'HERO',
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                startsAt: data.startsAt ?? null,
                endsAt: data.endsAt ?? null,
                imageUrl: image.url,
                imagePublicId: image.publicId,
                mobileImageUrl: mobileImage?.url,
                mobileImagePublicId: mobileImage?.publicId,
            },
        })
    } catch (error) {
        await Promise.all(uploaded.map(deleteImage)) // don't leave orphaned uploads
        throw error
    }
}

export async function updateBanner(id, data, files) {
    const existing = await prisma.banner.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Banner not found')

    // `undefined` = field not sent, keep the stored value; `null` = cleared
    const pick = (key) => (data[key] === undefined ? existing[key] : data[key])
    assertConsistent({
        ctaLabel: pick('ctaLabel'),
        linkUrl: pick('linkUrl'),
        startsAt: pick('startsAt'),
        endsAt: pick('endsAt'),
    })

    const [image, mobileImage] = await Promise.all([upload(fileAt(files, 'image')), upload(fileAt(files, 'mobileImage'))])
    const uploaded = [image?.publicId, mobileImage?.publicId]
    const clearMobile = !mobileImage && data.removeMobileImage === true

    try {
        const { items, uploaded: itemUploads, obsolete } = await resolveItems(data.items, existing.items, files)
        uploaded.push(...itemUploads)

        const updated = await prisma.banner.update({
            where: { id },
            data: {
                title: data.title,
                subtitle: data.subtitle,
                highlight: data.highlight,
                ctaLabel: data.ctaLabel,
                linkUrl: data.linkUrl,
                backgroundColor: data.backgroundColor,
                items,
                placement: data.placement,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                startsAt: data.startsAt,
                endsAt: data.endsAt,
                ...(image && { imageUrl: image.url, imagePublicId: image.publicId }),
                ...(mobileImage && { mobileImageUrl: mobileImage.url, mobileImagePublicId: mobileImage.publicId }),
                ...(clearMobile && { mobileImageUrl: null, mobileImagePublicId: null }),
            },
        })

        await Promise.all([
            image && deleteImage(existing.imagePublicId),
            (mobileImage || clearMobile) && deleteImage(existing.mobileImagePublicId),
            ...obsolete.map(deleteImage),
        ])
        return updated
    } catch (error) {
        await Promise.all(uploaded.map(deleteImage))
        throw error
    }
}

export async function deleteBanner(id) {
    const existing = await prisma.banner.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Banner not found')

    await prisma.banner.delete({ where: { id } })
    const itemImages = Array.isArray(existing.items) ? existing.items.map((item) => item.imagePublicId) : []
    await Promise.all([existing.imagePublicId, existing.mobileImagePublicId, ...itemImages].map(deleteImage))

    return { id }
}
