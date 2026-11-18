// One-off: moves the home-page banners that used to be hardcoded in the frontend into the DB.
// Uploads the images from frontend/public to Cloudinary. Each placement is skipped if it
// already has banners, so it's safe to run again.
// Usage: npm run seed-home-banners
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import prisma from '../lib/prisma.js'
import { uploadImage } from '../config/cloudinary.js'

const publicDir = new URL('../../frontend/public/', import.meta.url)
const upload = async (path) => uploadImage(await readFile(fileURLToPath(new URL(path, publicDir))), 'banners')

const banners = {
    HERO: [
        { image: 'hero/banner-1.jpg', subtitle: 'Dress the unconventional', title: 'Wear The Hype “Raw”', ctaLabel: 'Shop the drop', linkUrl: '/new-in' },
        { image: 'hero/banner-2.jpg', subtitle: 'New season, new rules', title: 'Drop 01 Out Now', ctaLabel: 'Shop new in', linkUrl: '/new-in' },
        { image: 'hero/banner-3.jpg', subtitle: 'Up to 40% off', title: 'Sneaker Week', ctaLabel: 'Shop sneakers', linkUrl: '/sneakers' },
    ],
    BESTSELLERS: [
        {
            image: 'banners/bestsellers.jpg',
            title: 'Last few\nbestsellers\nleft',
            subtitle: 'Up to',
            highlight: '30% off',
            ctaLabel: 'Shop bestsellers',
            linkUrl: '/bestsellers',
            backgroundColor: '#e8e9eb',
        },
    ],
    SHOP_IT: [
        { image: 'banners/shop-it-save-it.jpg', title: 'Shop it\nSave it', subtitle: 'Collection under', highlight: '₹999/-', linkUrl: '/under-999' },
    ],
    PRICE_DROP: [
        {
            image: 'banners/price-drop.jpg',
            title: 'Never\nbefore\nprices',
            backgroundColor: '#dfe4e5',
            items: [
                { label: 'Tees from', value: '₹699', linkUrl: '/tshirts', image: 'products/p2.jpg' },
                { label: 'Shirts from', value: '₹1,299', linkUrl: '/shirts', image: 'products/p5.jpg' },
                { label: 'Jeans from', value: '₹1,799', linkUrl: '/jeans', image: 'products/p8.jpg' },
                { label: 'Sneakers', value: '50% off', linkUrl: '/sneakers', image: 'products/p10.jpg' },
            ],
        },
    ],
}

for (const [placement, list] of Object.entries(banners)) {
    const existing = await prisma.banner.count({ where: { placement } })
    if (existing) {
        console.log(`${placement}: ${existing} banner(s) already exist, skipped.`)
        continue
    }

    for (const [index, { image, items, ...fields }] of list.entries()) {
        const main = await upload(image)
        const cards = items
            ? await Promise.all(
                  items.map(async ({ image: cardImage, ...card }) => {
                      const uploaded = await upload(cardImage)
                      return { id: randomUUID(), ...card, imageUrl: uploaded.url, imagePublicId: uploaded.publicId }
                  }),
              )
            : undefined

        await prisma.banner.create({
            data: {
                ...fields,
                ...(cards && { items: cards }),
                placement,
                sortOrder: index,
                imageUrl: main.url,
                imagePublicId: main.publicId,
            },
        })
        console.log(`${placement}: created "${fields.title.replace(/\n/g, ' ')}"`)
    }
}

await prisma.$disconnect()
