// Moves the home page "edits" and "shop by vibe" cards that used to be hardcoded in the frontend
// into the DB as collections, uploads their images from frontend/public, and fills each with
// matching products (by style code, see seed-products.js). Existing collections are skipped.
//
// Usage: npm run seed-collections
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import prisma from '../lib/prisma.js'
import * as collectionService from '../services/collection.service.js'
import { createCollectionSchema } from '../validations/collection.validation.js'

const publicDir = new URL('../../frontend/public/', import.meta.url)

const COLLECTIONS = [
    // Edits: the three tall cards
    { type: 'EDIT', name: 'The Bomber Edit', slug: 'bomber', description: 'Layers that mean business', image: 'edits/bomber.jpg',
      products: ['SH-EMB-006', 'TS-BOX-002', 'JN-CRP-009', 'SN-CHK-011'] },
    { type: 'EDIT', name: 'Formal Shirts', slug: 'formal', description: 'Sharp, never stiff', image: 'edits/formal.jpg',
      products: ['SH-STR-005', 'SH-CUB-004', 'JN-STR-008', 'SN-CRT-010'] },
    { type: 'EDIT', name: 'Hand Embroidered', slug: 'embroidered', description: 'Stitched to stand out', image: 'edits/embroidered.jpg',
      products: ['SH-EMB-006', 'TS-OVR-001', 'JN-BAG-007'] },

    // Vibes: the six "Shop by vibe" tiles
    { type: 'VIBE', name: 'Weekend Plans', slug: 'weekend', description: 'Easy fits for slow Saturdays and long brunches.', image: 'vibes/weekend.jpg',
      products: ['TS-WSH-003', 'TS-BOX-002', 'JN-BAG-007', 'SN-SKT-012'] },
    { type: 'VIBE', name: 'Date Night', slug: 'date-night', description: 'Dressed up, without trying too hard.', image: 'vibes/date-night.jpg',
      products: ['SH-CUB-004', 'SH-STR-005', 'JN-STR-008', 'SN-CRT-010'] },
    { type: 'VIBE', name: 'Concert Fits', slug: 'concert', description: 'Loud graphics and layers built for the crowd.', image: 'vibes/concert.jpg',
      products: ['TS-OVR-001', 'SH-EMB-006', 'JN-BAG-007', 'SN-CHK-011'] },
    { type: 'VIBE', name: 'Office Hours', slug: 'office', description: 'Smart enough for the meeting, easy enough for the commute.', image: 'vibes/office.jpg',
      products: ['SH-STR-005', 'JN-STR-008', 'SN-CRT-010'] },
    { type: 'VIBE', name: 'Vacation Mode', slug: 'vacation', description: 'Linen, light layers and shoes that walk all day.', image: 'vibes/vacation.jpg',
      products: ['SH-CUB-004', 'TS-WSH-003', 'SN-CRT-010'] },
    { type: 'VIBE', name: 'Street Ready', slug: 'street', description: 'Boxy tees, baggy denim, chunky soles.', image: 'vibes/street.jpg',
      products: ['TS-BOX-002', 'TS-OVR-001', 'JN-CRP-009', 'SN-SKT-012', 'SN-CHK-011'] },
]

const products = await prisma.product.findMany({ where: { styleCode: { not: null } }, select: { id: true, styleCode: true } })
const byStyle = new Map(products.map((p) => [p.styleCode, p.id]))
if (!products.length) console.warn('No seeded products found; collections will be created empty. Run `npm run seed-products` first.')

const order = { EDIT: 0, VIBE: 0 }
let created = 0
for (const { image, products: styles, ...fields } of COLLECTIONS) {
    const sortOrder = order[fields.type]++
    if (await prisma.collection.findUnique({ where: { slug: fields.slug }, select: { id: true } })) {
        console.log(`  ${fields.type.padEnd(4)} ${fields.name}: exists, skipped`)
        continue
    }
    const productIds = styles.map((s) => byStyle.get(s)).filter(Boolean)
    const data = createCollectionSchema.body.parse({ ...fields, sortOrder, isActive: true, productIds })
    const file = { buffer: await readFile(fileURLToPath(new URL(image, publicDir))) }
    await collectionService.createCollection(data, file)
    console.log(`  ${fields.type.padEnd(4)} ${fields.name}: created with ${productIds.length} products`)
    created++
}

console.log(`\nDone: ${created} collection(s) created.`)
await prisma.$disconnect()
