// Seeds the catalogue with the 12 sample products the storefront was designed around, with every
// product field filled in: variants (size × colour, SKU, stock), specs, pricing & tax, shipping,
// returns, legal details, SEO and 3 images each (uploaded to Cloudinary from frontend/public).
//
// Goes through the same services as the API, so validation, SKU checks, inventory logs and the
// publish rules all apply. Safe to re-run: existing categories/sub-categories/products are skipped.
//
// Usage: npm run seed-products
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import prisma from '../lib/prisma.js'
import slugify from '../utils/slugify.js'
import * as categoryService from '../services/category.service.js'
import * as productService from '../services/product.service.js'
import { createProductSchema } from '../validations/product.validation.js'

const publicDir = new URL('../../frontend/public/', import.meta.url)
const readPublic = async (path) => ({ buffer: await readFile(fileURLToPath(new URL(path, publicDir))) })

// TODO: these mirror the placeholders in frontend/lib/site.ts; replace both with the real company details
const BRAND = 'Your Brand'
const LEGAL = {
    countryOfOrigin: 'India',
    netQuantity: '1 N',
    manufacturerDetails: 'Your Brand Pvt. Ltd., Building Name, Street Address, Area / Locality, City – 000000, India',
    packerDetails: 'Your Brand Pvt. Ltd., Building Name, Street Address, Area / Locality, City – 000000, India',
}

// ---------- Categories ----------

const CATEGORIES = [
    {
        name: 'T-Shirts',
        slug: 'tshirts',
        image: 'categories/tshirts.jpg',
        description: 'Oversized, boxy and everyday tees in heavyweight cotton.',
        sortOrder: 0,
        subs: ['Graphic Tees', 'Oversized Tees', 'Basic Tees'],
    },
    {
        name: 'Shirts',
        slug: 'shirts',
        image: 'categories/shirts.jpg',
        description: 'Linen, striped and embroidered shirts for every plan.',
        sortOrder: 1,
        subs: ['Casual Shirts', 'Linen Shirts', 'Overshirts'],
    },
    {
        name: 'Jeans',
        slug: 'jeans',
        image: 'categories/jeans.jpg',
        description: 'Baggy, straight and carpenter fits in rigid and stretch denim.',
        sortOrder: 2,
        subs: ['Baggy Jeans', 'Straight Jeans', 'Carpenter Jeans'],
    },
    {
        name: 'Sneakers',
        slug: 'sneakers',
        image: 'categories/sneakers.jpg',
        description: 'Court classics, chunky runners and skate shoes.',
        sortOrder: 3,
        subs: ['Low Tops', 'Chunky Sneakers', 'Skate Shoes'],
    },
]

async function ensureCategories() {
    const ids = {} // "tshirts" -> { id, subs: { "Graphic Tees": id } }
    for (const def of CATEGORIES) {
        let category = await prisma.category.findFirst({
            where: { OR: [{ slug: def.slug }, { name: { equals: def.name, mode: 'insensitive' } }] },
        })
        if (category) {
            console.log(`  category  ${def.name}: exists`)
        } else {
            category = await categoryService.createCategory(
                { name: def.name, slug: def.slug, description: def.description, isActive: true, sortOrder: def.sortOrder },
                await readPublic(def.image),
            )
            console.log(`  category  ${def.name}: created`)
        }

        const subs = {}
        for (const [i, name] of def.subs.entries()) {
            const slug = slugify(name)
            const sub =
                (await prisma.subCategory.findFirst({ where: { categoryId: category.id, OR: [{ slug }, { name }] } })) ??
                (await prisma.subCategory.create({ data: { name, slug, categoryId: category.id, sortOrder: i } }))
            subs[name] = sub.id
        }
        ids[def.slug] = { id: category.id, subs }
    }
    return ids
}

// ---------- Shared product building blocks ----------

const rupees = (value) => value * 100

const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const WAIST_SIZES = ['28', '30', '32', '34', '36']
const SHOE_SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']

const TEE_CARE = ['Machine wash cold, inside out', 'Do not bleach', 'Dry in shade', 'Iron on reverse']
const SHIRT_CARE = ['Machine wash cold with similar colours', 'Do not bleach', 'Line dry', 'Warm iron']
const DENIM_CARE = ['Wash inside out in cold water', 'Wash separately for the first few washes', 'Do not tumble dry', 'Dry in shade']
const SHOE_CARE = ['Wipe clean with a damp cloth', 'Air dry away from direct heat', 'Use a suede brush for suede panels']

const SHIPPING = {
    tee: { weightGrams: 300, lengthCm: 30, widthCm: 25, heightCm: 3 },
    shirt: { weightGrams: 380, lengthCm: 32, widthCm: 26, heightCm: 4 },
    jeans: { weightGrams: 750, lengthCm: 35, widthCm: 28, heightCm: 6 },
    shoe: { weightGrams: 1200, lengthCm: 34, widthCm: 22, heightCm: 13 },
}

const codePart = (text) => text.toUpperCase().replace(/[^A-Z0-9]+/g, '')

// Deterministic "random" stock so re-runs and screenshots are stable. Mostly healthy stock,
// with the odd low or sold-out size so the low-stock and out-of-stock views have something to show.
function stockFor(sku, { scarce = false } = {}) {
    let h = 0
    for (const ch of sku) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    const roll = h % 100
    if (roll < (scarce ? 25 : 8)) return 0
    if (roll < (scarce ? 70 : 20)) return 1 + (h % 4) // 1–4: low
    return scarce ? 5 + (h % 6) : 8 + (h % 33)
}

function variants(styleCode, sizes, colours, opts = {}) {
    return colours.flatMap((colour) =>
        sizes.map((size) => {
            const sku = [styleCode, codePart(colour.name).slice(0, 3), codePart(size)].join('-')
            return {
                sku,
                size,
                color: colour.name,
                colorHex: colour.hex,
                stock: stockFor(sku, opts),
                lowStockThreshold: 5,
                isActive: true,
            }
        }),
    )
}

const specs = (entries) => Object.entries(entries).map(([label, values]) => ({ label, values: [].concat(values) }))

const C = {
    black: { name: 'Black', hex: '#111111' },
    offWhite: { name: 'Off White', hex: '#f2efe6' },
    white: { name: 'White', hex: '#ffffff' },
    grey: { name: 'Grey Melange', hex: '#9a9a9a' },
    olive: { name: 'Olive', hex: '#6b6b3a' },
    charcoal: { name: 'Charcoal', hex: '#36454f' },
    beige: { name: 'Beige', hex: '#d9c7a7' },
    skyBlue: { name: 'Sky Blue', hex: '#9cc7e8' },
    blue: { name: 'Blue', hex: '#2f5aa8' },
    navy: { name: 'Navy', hex: '#1f2a44' },
    brown: { name: 'Brown', hex: '#6b4226' },
    lightWash: { name: 'Light Wash', hex: '#a9c4dc' },
    midWash: { name: 'Mid Wash', hex: '#5b7fa6' },
}

// ---------- The 12 products ----------

const PRODUCTS = [
    {
        category: 'tshirts', sub: 'Graphic Tees', images: ['p1', 'p2', 'p3'],
        name: 'Oversized Graphic Tee', styleCode: 'TS-OVR-001', price: 899, mrp: 1499, cost: 310,
        tag: 'NEW', gender: 'UNISEX', isFeatured: true, season: 'AW26',
        description:
            'A heavyweight oversized tee with a screen-printed back graphic and a small chest hit. Dropped shoulders and a boxy body give it that easy streetwear drape, and the 240 GSM cotton keeps its shape wash after wash.',
        highlights: ['240 GSM heavyweight cotton', 'Oversized fit with dropped shoulders', 'Screen-printed graphic that won’t crack', 'Pre-shrunk and bio-washed'],
        modelInfo: 'Model is 6\'0" (183 cm) and wears size M',
        colours: [C.black, C.offWhite], sizes: APPAREL_SIZES, ship: 'tee', hsn: '6109',
        specs: { Fabric: '100% Cotton', GSM: '240', Fit: 'Oversized', Pattern: 'Graphic Print', Neck: 'Round Neck', Sleeve: ['Half Sleeve', 'Drop Shoulder'], Occasion: ['Casual', 'Streetwear'], 'Wash care': TEE_CARE },
        keywords: ['tee', 'tshirt', 't-shirt', 'oversize', 'graphic tee', 'printed tshirt'],
    },
    {
        category: 'tshirts', sub: 'Oversized Tees', images: ['p2', 'p1', 'p3'],
        name: 'Boxy Heavyweight Tee', styleCode: 'TS-BOX-002', price: 999, mrp: 1299, cost: 360,
        gender: 'UNISEX', season: 'AW26',
        description:
            'Our heaviest tee yet: 280 GSM cotton cut short and wide for a structured, boxy silhouette. A thick ribbed neckband that doesn’t stretch out, and nothing else to distract from the fit.',
        highlights: ['280 GSM extra-heavy cotton', 'Short, boxy cut', 'Thick ribbed neckband', 'Garment dyed for a soft hand-feel'],
        modelInfo: 'Model is 5\'11" (180 cm) and wears size L',
        colours: [C.black, C.grey, C.olive], sizes: APPAREL_SIZES, ship: 'tee', hsn: '6109',
        specs: { Fabric: '100% Cotton', GSM: '280', Fit: 'Boxy Fit', Pattern: 'Solid', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Length: 'Cropped', Occasion: ['Casual', 'Streetwear'], 'Wash care': TEE_CARE },
        keywords: ['tee', 'tshirt', 'boxy tee', 'heavyweight', 'plain tshirt'],
    },
    {
        category: 'tshirts', sub: 'Basic Tees', images: ['p3', 'p2', 'p1'],
        name: 'Washed Pocket Tee', styleCode: 'TS-WSH-003', price: 799, mrp: 1199, cost: 260,
        tag: 'BESTSELLER', gender: 'UNISEX', season: 'SS26',
        description:
            'An everyday regular-fit tee with a patch pocket, acid-washed for a lived-in, vintage look from the very first wear. Every piece comes out slightly different.',
        highlights: ['Acid-washed for a vintage finish', 'Chest patch pocket', 'Regular fit, true to size', '200 GSM breathable cotton'],
        modelInfo: 'Model is 6\'0" (183 cm) and wears size M',
        colours: [C.charcoal, C.beige], sizes: APPAREL_SIZES, ship: 'tee', hsn: '6109',
        specs: { Fabric: '100% Cotton', GSM: '200', Fit: 'Regular Fit', Pattern: 'Washed', Neck: 'Round Neck', Sleeve: 'Half Sleeve', Pockets: '1 chest patch pocket', Occasion: 'Casual', 'Wash care': [...TEE_CARE, 'Colour may fade slightly with washes – it’s part of the look'] },
        keywords: ['tee', 'tshirt', 'pocket tee', 'acid wash', 'vintage tshirt'],
    },
    {
        category: 'shirts', sub: 'Linen Shirts', images: ['p4', 'p5', 'p6'],
        name: 'Cuban Collar Linen Shirt', styleCode: 'SH-CUB-004', price: 1799, mrp: 2499, cost: 650,
        tag: 'NEW', gender: 'MEN', isFeatured: true, season: 'SS27',
        description:
            'A breezy cotton-linen shirt with an open Cuban collar and a straight hem made to be worn untucked. Lightweight, breathable and built for holidays, beach dinners and hot city days.',
        highlights: ['Cotton-linen blend that breathes', 'Open Cuban collar', 'Straight hem to wear untucked', 'Coconut shell buttons'],
        modelInfo: 'Model is 6\'1" (185 cm) and wears size M',
        colours: [C.skyBlue, C.offWhite], sizes: APPAREL_SIZES, ship: 'shirt', hsn: '6205',
        specs: { Fabric: '55% Linen, 45% Cotton', Fit: 'Relaxed Fit', Pattern: 'Solid', Collar: 'Cuban Collar', Sleeve: 'Half Sleeve', Closure: 'Button', Occasion: ['Vacation', 'Casual'], 'Wash care': [...SHIRT_CARE, 'Linen creases naturally'] },
        keywords: ['linen shirt', 'cuban collar', 'resort shirt', 'summer shirt', 'half sleeve shirt'],
    },
    {
        category: 'shirts', sub: 'Casual Shirts', images: ['p5', 'p4', 'p6'],
        name: 'Striped Relaxed Shirt', styleCode: 'SH-STR-005', price: 1599, mrp: 2199, cost: 560,
        gender: 'MEN', season: 'SS27',
        description:
            'A relaxed-fit cotton shirt in a crisp vertical stripe. Wear it buttoned up for work or open over a tee on the weekend; the soft poplin gets better with every wash.',
        highlights: ['Soft cotton poplin', 'Classic vertical stripe', 'Relaxed fit with a curved hem', 'Works open or buttoned'],
        modelInfo: 'Model is 6\'0" (183 cm) and wears size M',
        colours: [C.blue], sizes: APPAREL_SIZES, ship: 'shirt', hsn: '6205',
        specs: { Fabric: '100% Cotton Poplin', Fit: 'Relaxed Fit', Pattern: 'Striped', Collar: 'Spread Collar', Sleeve: 'Full Sleeve', Closure: 'Button', Occasion: ['Casual', 'Work'], 'Wash care': SHIRT_CARE },
        keywords: ['striped shirt', 'casual shirt', 'full sleeve shirt', 'office shirt'],
    },
    {
        category: 'shirts', sub: 'Overshirts', images: ['p6', 'p4', 'p5'],
        name: 'Embroidered Overshirt', styleCode: 'SH-EMB-006', price: 2299, mrp: 2999, cost: 900,
        tag: 'FEW_LEFT', gender: 'MEN', season: 'AW26', scarce: true, maxPerOrder: 2,
        description:
            'A heavyweight twill overshirt with tonal hand embroidery across the chest. Two flap pockets and a boxy cut make it the layer that finishes every fit. Small batch, so sizes go fast.',
        highlights: ['Hand-embroidered chest detail', 'Heavyweight cotton twill', 'Two flap chest pockets', 'Limited small-batch run'],
        modelInfo: 'Model is 6\'1" (185 cm) and wears size L',
        colours: [C.olive, C.black], sizes: APPAREL_SIZES, ship: 'shirt', hsn: '6205',
        specs: { Fabric: '100% Cotton Twill', Fit: 'Boxy Fit', Pattern: 'Embroidered', Collar: 'Spread Collar', Sleeve: 'Full Sleeve', Closure: 'Button', Pockets: '2 flap chest pockets', Occasion: ['Casual', 'Streetwear'], 'Wash care': ['Dry clean recommended', 'Or gentle hand wash cold, inside out', 'Do not wring the embroidery'] },
        keywords: ['overshirt', 'shacket', 'embroidered shirt', 'jacket shirt'],
    },
    {
        category: 'jeans', sub: 'Baggy Jeans', images: ['p7', 'p8', 'p9'],
        name: 'Baggy Fit Jeans', styleCode: 'JN-BAG-007', price: 2199, mrp: 2999, cost: 820,
        tag: 'BESTSELLER', gender: 'MEN', isFeatured: true, season: 'AW26',
        description:
            'Rigid 13.5 oz denim cut with a roomy seat and wide leg that stacks at the ankle. Mid rise, five pockets and a light stone wash: the baggy jean everything else in your wardrobe works with.',
        highlights: ['13.5 oz rigid cotton denim', 'Wide leg that stacks at the hem', 'Mid rise, classic 5-pocket', 'Stone washed'],
        modelInfo: 'Model is 6\'0" (183 cm), 32" waist, and wears size 32',
        colours: [C.lightWash, C.midWash], sizes: WAIST_SIZES, ship: 'jeans', hsn: '6203',
        specs: { Fabric: '100% Cotton Denim, 13.5 oz', Fit: 'Baggy', Rise: 'Mid Rise', Stretch: 'Non-stretch', Wash: 'Stone Wash', Closure: 'Zip fly with button', Pockets: '5 pockets', 'Wash care': DENIM_CARE },
        keywords: ['baggy jeans', 'wide leg jeans', 'denim', 'loose jeans'],
    },
    {
        category: 'jeans', sub: 'Straight Jeans', images: ['p8', 'p7', 'p9'],
        name: 'Straight Washed Jeans', styleCode: 'JN-STR-008', price: 1999, mrp: 2799, cost: 720,
        gender: 'MEN', season: 'SS26',
        description:
            'A straight-leg jean with just enough stretch to move in. Sits at the waist, falls straight from the thigh and comes in two washes that go with everything.',
        highlights: ['Comfort stretch denim', 'Straight leg from thigh to hem', 'Two versatile washes', 'Reinforced back pockets'],
        modelInfo: 'Model is 5\'11" (180 cm), 31" waist, and wears size 32',
        colours: [C.black, C.midWash], sizes: WAIST_SIZES, ship: 'jeans', hsn: '6203',
        specs: { Fabric: '98% Cotton, 2% Elastane', Fit: 'Straight', Rise: 'Mid Rise', Stretch: 'Slight stretch', Wash: 'Mid Wash', Closure: 'Zip fly with button', Pockets: '5 pockets', 'Wash care': DENIM_CARE },
        keywords: ['straight jeans', 'stretch jeans', 'black jeans', 'denim'],
    },
    {
        category: 'jeans', sub: 'Carpenter Jeans', images: ['p9', 'p7', 'p8'],
        name: 'Carpenter Denim', styleCode: 'JN-CRP-009', price: 2399, mrp: 3199, cost: 900,
        tag: 'NEW', gender: 'MEN', season: 'AW26',
        description:
            'Workwear-inspired carpenter jeans with a hammer loop, utility pockets and a relaxed straight leg. Heavy denim that softens and fades the more you wear it.',
        highlights: ['Hammer loop and utility pockets', 'Relaxed straight leg', 'Heavy 14 oz denim', 'Bar-tacked stress points'],
        modelInfo: 'Model is 6\'0" (183 cm) and wears size 32',
        colours: [C.midWash], sizes: WAIST_SIZES, ship: 'jeans', hsn: '6203',
        specs: { Fabric: '100% Cotton Denim, 14 oz', Fit: 'Relaxed Fit', Rise: 'Mid Rise', Stretch: 'Non-stretch', Wash: 'Mid Wash', Closure: 'Zip fly with button', Pockets: ['5 pockets', 'Utility pocket', 'Hammer loop'], 'Wash care': DENIM_CARE },
        keywords: ['carpenter jeans', 'workwear', 'utility jeans', 'denim'],
    },
    {
        category: 'sneakers', sub: 'Low Tops', images: ['p10', 'p11', 'p12'],
        name: 'Court Low Sneakers', styleCode: 'SN-CRT-010', price: 2999, mrp: 4499, cost: 1150,
        tag: 'NEW', gender: 'UNISEX', isFeatured: true, season: 'AW26', maxPerOrder: 3, shoe: true,
        description:
            'A clean, court-inspired low top in smooth leather with a cushioned insole and a grippy rubber cupsole. The everyday sneaker that goes from denim to tailoring.',
        highlights: ['Smooth leather upper', 'Cushioned memory-foam insole', 'Stitched rubber cupsole', 'True to size'],
        colours: [C.white, C.black], sizes: SHOE_SIZES, ship: 'shoe', hsn: '6403',
        specs: { 'Upper material': 'Leather', 'Sole material': 'Rubber', Closure: 'Lace-up', 'Toe shape': 'Round Toe', Insole: 'Memory foam', Care: SHOE_CARE },
        keywords: ['sneakers', 'white sneakers', 'court shoes', 'casual shoes', 'shoes'],
    },
    {
        category: 'sneakers', sub: 'Chunky Sneakers', images: ['p11', 'p10', 'p12'],
        name: 'Chunky Runner', styleCode: 'SN-CHK-011', price: 3499, mrp: 4999, cost: 1350,
        gender: 'UNISEX', season: 'AW26', maxPerOrder: 3, shoe: true,
        description:
            'A retro runner with a layered mesh-and-suede upper and a sculpted chunky midsole. Light underfoot despite the height, with a padded collar for all-day comfort.',
        highlights: ['Mesh and suede upper', 'Lightweight chunky EVA midsole', 'Padded collar and tongue', 'Reflective heel tab'],
        colours: [C.offWhite, C.grey], sizes: SHOE_SIZES, ship: 'shoe', hsn: '6404',
        specs: { 'Upper material': ['Mesh', 'Suede overlays'], 'Sole material': 'EVA midsole, rubber outsole', Closure: 'Lace-up', 'Toe shape': 'Round Toe', Insole: 'Padded', Care: SHOE_CARE },
        keywords: ['chunky sneakers', 'running shoes', 'dad shoes', 'sneakers'],
    },
    {
        category: 'sneakers', sub: 'Skate Shoes', images: ['p12', 'p10', 'p11'],
        name: 'Suede Skate Shoe', styleCode: 'SN-SKT-012', price: 2799, mrp: 3999, cost: 1050,
        tag: 'FEW_LEFT', gender: 'UNISEX', season: 'SS26', scarce: true, maxPerOrder: 2, shoe: true,
        description:
            'A low-profile skate shoe in soft suede with a vulcanised sole for board feel and grip. Padded collar, reinforced toe cap and a fit that breaks in fast.',
        highlights: ['Soft suede upper', 'Vulcanised gum sole', 'Reinforced toe cap', 'Padded collar'],
        colours: [C.brown, C.navy], sizes: SHOE_SIZES, ship: 'shoe', hsn: '6403',
        specs: { 'Upper material': 'Suede', 'Sole material': 'Vulcanised rubber', Closure: 'Lace-up', 'Toe shape': 'Round Toe', Insole: 'Padded', Care: SHOE_CARE },
        keywords: ['skate shoes', 'suede sneakers', 'vans style', 'sneakers'],
    },
]

// `gender` in the data above maps to industries: MEN -> Men, WOMEN -> Women, UNISEX -> both
const industrySlugs = (gender) => (gender === 'UNISEX' ? ['men', 'women'] : [gender.toLowerCase()])

function buildInput(p, category, industryIds = {}) {
    const price = rupees(p.price)
    return {
        name: p.name,
        description: p.description,
        highlights: p.highlights,
        brand: BRAND,
        styleCode: p.styleCode,
        season: p.season,
        modelInfo: p.modelInfo ?? null,
        price,
        mrp: rupees(p.mrp),
        costPrice: rupees(p.cost),
        // GST since 22 Sep 2025: clothing/footwear up to ₹2,500 per piece → 5%, above → 18%
        gstRate: price <= rupees(2500) ? 5 : 18,
        hsnCode: p.hsn,
        ...LEGAL,
        ...SHIPPING[p.ship],
        // Footwear: exchange only for hygiene/wear reasons is common, but keep returns on for the demo
        isReturnable: true,
        isExchangeable: true,
        returnWindowDays: p.shoe ? 7 : 15,
        codAvailable: true,
        maxPerOrder: p.maxPerOrder ?? null,
        status: 'DRAFT', // published once images exist
        tag: p.tag ?? null,
        industryIds: industrySlugs(p.gender).map((slug) => industryIds[slug]).filter(Boolean),
        isFeatured: Boolean(p.isFeatured),
        categoryId: category.id,
        subCategoryId: category.subs[p.sub] ?? null,
        metaTitle: `${p.name} | ${BRAND}`.slice(0, 70),
        metaDescription: p.description.slice(0, 157).replace(/\s+\S*$/, '') + '…',
        searchKeywords: p.keywords,
        attributes: specs(p.specs),
        variants: variants(p.styleCode, p.sizes, p.colours, { scarce: p.scarce }),
    }
}

// ---------- Run ----------

// `npm run seed-products -- --dry-run` validates every product without touching the DB or Cloudinary
if (process.argv.includes('--dry-run')) {
    let failed = 0
    for (const p of PRODUCTS) {
        const result = createProductSchema.body.safeParse(buildInput(p, { id: 'dry-run', subs: { [p.sub]: 'dry-run' } }))
        if (result.success) {
            const v = result.data.variants
            const units = v.reduce((sum, x) => sum + x.stock, 0)
            const out = v.filter((x) => x.stock === 0).length
            const low = v.filter((x) => x.stock > 0 && x.stock <= 5).length
            console.log(`ok  ${p.styleCode}  ${v.length} variants, ${units} units (${low} low, ${out} out), GST ${result.data.gstRate}%`)
        } else {
            failed++
            console.log(`ERR ${p.styleCode}`, result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`))
        }
    }
    console.log(failed ? `\n${failed} product(s) invalid` : '\nAll products valid')
    process.exit(failed ? 1 : 0)
}

const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE' }, orderBy: { createdAt: 'asc' } })
if (!admin) {
    console.error('No active super admin found. Run `npm run create-super-admin` first (stock changes are logged against a user).')
    process.exit(1)
}

console.log('Categories')
const categories = await ensureCategories()

// Men and Women are created by the industries migration; add them here if they were deleted
const industryIds = {}
for (const [i, name] of ['Men', 'Women'].entries()) {
    const slug = name.toLowerCase()
    const industry =
        (await prisma.industry.findUnique({ where: { slug } })) ??
        (await prisma.industry.create({ data: { name, slug, sortOrder: i } }))
    industryIds[slug] = industry.id
}

console.log('Products')
let created = 0
for (const p of PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { OR: [{ styleCode: p.styleCode }, { slug: slugify(p.name) }] }, select: { id: true } })
    if (exists) {
        console.log(`  ${p.styleCode}  ${p.name}: exists, skipped`)
        continue
    }

    // Same validation the API applies (defaults, SKU format, price ≤ MRP, duplicate checks)
    const input = createProductSchema.body.parse(buildInput(p, categories[p.category], industryIds))
    const product = await productService.createProduct(input, admin.id)

    try {
        const files = await Promise.all(p.images.map((name) => readPublic(`products/${name}.jpg`)))
        await productService.addImages(
            product.id,
            files,
            p.images.map((_, i) => ({ alt: i === 0 ? p.name : `${p.name} – view ${i + 1}` })),
        )
        await productService.updateProduct(product.id, { status: 'ACTIVE' }, admin.id)
    } catch (error) {
        console.error(`  ${p.styleCode}  ${p.name}: created as draft, images/publish failed – ${error.message}`)
        continue
    }

    const stock = input.variants.reduce((sum, v) => sum + v.stock, 0)
    console.log(`  ${p.styleCode}  ${p.name}: ${input.variants.length} variants, ${stock} units, 3 images, live`)
    created++
}

console.log(`\nDone: ${created} product(s) created.`)
await prisma.$disconnect()
