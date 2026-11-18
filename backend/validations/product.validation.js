import { z } from 'zod'
import { boolish, id, idParams, slug } from './common.validation.js'

// Prices are integers in paise (₹1 = 100), as everywhere else in the schema.

export const STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED']
export const TAGS = ['NEW', 'BESTSELLER', 'FEW_LEFT']
// Current slabs since 22 Sep 2025 are 0/5/18/40 (3 = gold/jewellery); 12 and 28 kept for older listings
export const GST_RATES = [0, 3, 5, 12, 18, 28, 40]
export const MAX_VARIANTS = 200
export const MAX_IMAGES = 15

const emptyToNull = (value) => (value === '' ? null : value)

const text = (max, label) => z.string().trim().max(max, `${label} must be at most ${max} characters`)
const optionalText = (max, label) => z.preprocess(emptyToNull, text(max, label).nullable())

const paise = (label) =>
    z
        .number({ error: `${label} must be a number` })
        .int(`${label} must be in whole paise`)
        .min(100, `${label} must be at least ₹1`)
        .max(100_000_000, `${label} is too large`)

const whole = (label, min, max) =>
    z
        .number({ error: `${label} must be a number` })
        .int(`${label} must be a whole number`)
        .min(min, `${label} must be at least ${min}`)
        .max(max, `${label} must be at most ${max}`)

const hex = z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Use a hex colour like #000000').toLowerCase()

// Upper-case letters, digits, hyphens and underscores: "TS-OVR-001-BLK-M"
const code = (max, label) =>
    z
        .string()
        .trim()
        .toUpperCase()
        .max(max, `${label} must be at most ${max} characters`)
        .regex(/^[A-Z0-9][A-Z0-9_-]*$/, `${label} can only contain letters, numbers, - and _`)

const stringList = (maxItems, maxLength, label) =>
    z
        .array(text(maxLength, label).min(1, `${label} can't be empty`))
        .max(maxItems, `At most ${maxItems} ${label.toLowerCase()}s`)

const attribute = z.object({
    label: text(40, 'Spec name').min(1, 'Spec name is required'),
    values: stringList(10, 200, 'Spec value').min(1, 'Add at least one value'),
})

const variant = z.object({
    id: id.optional(), // present for existing variants
    sku: code(60, 'SKU').min(1, 'SKU is required'),
    barcode: z.preprocess(emptyToNull, z.string().trim().regex(/^\d{8,14}$/, 'Barcode must be 8–14 digits').nullable()).optional(),
    size: text(20, 'Size').min(1, 'Size is required'),
    color: optionalText(40, 'Colour').optional(),
    colorHex: z.preprocess(emptyToNull, hex.nullable()).optional(),
    price: paise('Price').nullable().optional(), // overrides the product price
    mrp: paise('MRP').nullable().optional(),
    stock: whole('Stock', 0, 1_000_000),
    lowStockThreshold: whole('Low stock alert', 0, 10_000).optional(),
    isActive: z.boolean().optional(),
})

const fields = {
    name: text(120, 'Name').min(2, 'Name must be at least 2 characters'),
    slug,
    description: optionalText(5000, 'Description'),
    highlights: stringList(10, 150, 'Highlight'),
    brand: optionalText(60, 'Brand'),
    styleCode: z.preprocess(emptyToNull, code(40, 'Style code').nullable()),
    season: optionalText(20, 'Season'),
    modelInfo: optionalText(200, 'Model info'),
    videoUrl: z.preprocess(emptyToNull, z.url({ protocol: /^https$/, error: 'Use an https:// video link' }).max(500).nullable()),

    price: paise('Price'),
    mrp: paise('MRP'),
    costPrice: paise('Cost price').nullable(),
    gstRate: z
        .number()
        .refine((v) => GST_RATES.includes(v), `GST rate must be one of ${GST_RATES.join(', ')}%`)
        .nullable(),
    hsnCode: z.preprocess(emptyToNull, z.string().trim().regex(/^\d{4,8}$/, 'HSN code must be 4–8 digits').nullable()),

    countryOfOrigin: text(60, 'Country of origin').min(2, 'Country of origin is required'),
    manufacturerDetails: optionalText(400, 'Manufacturer details'),
    packerDetails: optionalText(400, 'Packer details'),
    importerDetails: optionalText(400, 'Importer details'),
    netQuantity: optionalText(30, 'Net quantity'),

    weightGrams: whole('Weight', 1, 50_000).nullable(),
    lengthCm: whole('Length', 1, 300).nullable(),
    widthCm: whole('Width', 1, 300).nullable(),
    heightCm: whole('Height', 1, 300).nullable(),

    isReturnable: z.boolean(),
    isExchangeable: z.boolean(),
    returnWindowDays: whole('Return window', 0, 90),
    codAvailable: z.boolean(),
    maxPerOrder: whole('Max per order', 1, 99).nullable(),

    status: z.enum(STATUSES, { error: 'Invalid status' }),
    tag: z.enum(TAGS, { error: 'Invalid badge' }).nullable(),
    // Men / Women / ... — a product can be in several (unisex = Men + Women)
    industryIds: z
        .array(id)
        .max(10, 'At most 10 industries')
        .refine((ids) => new Set(ids).size === ids.length, 'An industry is listed twice'),
    isFeatured: z.boolean(),
    categoryId: id,
    subCategoryId: z.preprocess(emptyToNull, id.nullable()),
    sizeChartId: z.preprocess(emptyToNull, id.nullable()),

    metaTitle: optionalText(70, 'Meta title'),
    metaDescription: optionalText(160, 'Meta description'),
    // Stored lower-case and de-duplicated so search can match them exactly
    searchKeywords: stringList(20, 40, 'Keyword').transform((list) => [...new Set(list.map((k) => k.toLowerCase()))]),

    attributes: z.array(attribute).max(30, 'At most 30 specs'),
    variants: z.array(variant).max(MAX_VARIANTS, `At most ${MAX_VARIANTS} variants`),
}

// Rules that span fields. `partial` = PATCH, where absent fields are checked in the service.
function crossChecks(data, ctx) {
    if (data.price != null && data.mrp != null && data.price > data.mrp) {
        ctx.addIssue({ code: 'custom', path: ['price'], message: 'Selling price cannot be above MRP' })
    }

    if (data.attributes) {
        const seen = new Set()
        data.attributes.forEach((attr, i) => {
            const key = attr.label.toLowerCase()
            if (seen.has(key)) ctx.addIssue({ code: 'custom', path: ['attributes', i, 'label'], message: 'Spec listed twice' })
            seen.add(key)
        })
    }

    if (data.variants) {
        const skus = new Set()
        const barcodes = new Set()
        const combos = new Set()
        data.variants.forEach((v, i) => {
            if (skus.has(v.sku)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'SKU used twice' })
            skus.add(v.sku)
            if (v.barcode) {
                if (barcodes.has(v.barcode)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'barcode'], message: 'Barcode used twice' })
                barcodes.add(v.barcode)
            }
            const combo = `${v.size.toLowerCase()}|${(v.color ?? '').toLowerCase()}`
            if (combos.has(combo)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'size'], message: 'Same size and colour listed twice' })
            combos.add(combo)
            if (v.price != null && v.mrp != null && v.price > v.mrp) {
                ctx.addIssue({ code: 'custom', path: ['variants', i, 'price'], message: 'Price cannot be above MRP' })
            }
        })
    }
}

const defaults = {
    slug: fields.slug.optional(),
    description: fields.description.optional(),
    highlights: fields.highlights.default([]),
    brand: fields.brand.optional(),
    styleCode: fields.styleCode.optional(),
    season: fields.season.optional(),
    modelInfo: fields.modelInfo.optional(),
    videoUrl: fields.videoUrl.optional(),
    costPrice: fields.costPrice.optional(),
    gstRate: fields.gstRate.optional(),
    hsnCode: fields.hsnCode.optional(),
    countryOfOrigin: fields.countryOfOrigin.default('India'),
    manufacturerDetails: fields.manufacturerDetails.optional(),
    packerDetails: fields.packerDetails.optional(),
    importerDetails: fields.importerDetails.optional(),
    netQuantity: fields.netQuantity.optional(),
    weightGrams: fields.weightGrams.optional(),
    lengthCm: fields.lengthCm.optional(),
    widthCm: fields.widthCm.optional(),
    heightCm: fields.heightCm.optional(),
    isReturnable: fields.isReturnable.default(true),
    isExchangeable: fields.isExchangeable.default(true),
    returnWindowDays: fields.returnWindowDays.default(15),
    codAvailable: fields.codAvailable.default(true),
    maxPerOrder: fields.maxPerOrder.optional(),
    status: fields.status.default('DRAFT'),
    tag: fields.tag.optional(),
    industryIds: fields.industryIds.default([]),
    isFeatured: fields.isFeatured.default(false),
    subCategoryId: fields.subCategoryId.optional(),
    sizeChartId: fields.sizeChartId.optional(),
    metaTitle: fields.metaTitle.optional(),
    metaDescription: fields.metaDescription.optional(),
    searchKeywords: fields.searchKeywords.default([]),
    attributes: fields.attributes.default([]),
    variants: fields.variants.default([]),
}

export const createProductSchema = {
    body: z.object({ ...fields, ...defaults }).superRefine(crossChecks),
}

export const updateProductSchema = {
    params: idParams,
    body: z
        .object(Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])))
        .superRefine(crossChecks),
}

export const listProductsSchema = {
    query: z.object({
        search: z.string().trim().max(80).optional(),
        status: z.enum(STATUSES).optional(),
        categoryId: id.optional(),
        subCategoryId: id.optional(),
        industryId: id.optional(),
        // in/out = whole product; low/sizes-out = at least one variant
        stock: z.enum(['in', 'low', 'sizes-out', 'out']).optional(),
        sort: z.enum(['newest', 'oldest', 'name', 'price-asc', 'price-desc', 'stock-asc', 'stock-desc']).optional(),
        page: z.coerce.number().int().min(1).max(10_000).optional(),
        pageSize: z.coerce.number().int().min(1).max(100).optional(),
        includeAll: boolish.optional(), // staff only: drafts and archived too
    }),
}

// Accepts an id or a slug, so storefront URLs can use slugs
export const productRefSchema = { params: z.object({ id: z.string().trim().min(1).max(200) }) }
export const productIdSchema = { params: idParams }

// ---------- Images ----------

const imageMeta = z.object({ alt: optionalText(150, 'Alt text').optional(), color: optionalText(40, 'Colour').optional() })

export const uploadImagesSchema = {
    params: idParams,
    // Multipart: one meta entry per uploaded file, same order
    body: z.object({
        meta: z
            .preprocess((value) => {
                if (value === undefined || value === '') return []
                try {
                    return typeof value === 'string' ? JSON.parse(value) : value
                } catch {
                    return {}
                }
            }, z.array(imageMeta, { error: 'meta must be a list' }))
            .optional(),
    }),
}

export const updateImageSchema = {
    params: z.object({ id, imageId: id }),
    body: imageMeta,
}

export const imageRefSchema = { params: z.object({ id, imageId: id }) }

export const reorderImagesSchema = {
    params: idParams,
    body: z.object({ ids: z.array(id).min(1).max(MAX_IMAGES) }),
}
