import { z } from 'zod'
import { boolish, idParams, sortOrder } from './common.validation.js'

// How each placement uses the fields:
//   HERO        subtitle = label above headline, title = headline, ctaLabel + linkUrl = button
//   BESTSELLERS title = left headline, subtitle + highlight = offer ("Up to" "30% off"), ctaLabel = link text
//   SHOP_IT     title = headline (first line small), subtitle = badge, highlight = price
//   PRICE_DROP  title = headline, items = price cards
// HERO shows every live banner as a carousel; the other placements show the first live one.

export const PLACEMENTS = ['HERO', 'PRICE_DROP', 'BESTSELLERS', 'SHOP_IT', 'PROMO_STRIP']
export const MAX_ITEMS = 4

const emptyToNull = (value) => (value === '' ? null : value)
const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value)

const optionalText = (max, label) =>
    z.preprocess(emptyToNull, z.string().trim().max(max, `${label} must be at most ${max} characters`).nullable())

// Newlines are kept: they decide where the headline breaks
const title = z
    .string({ error: 'Headline is required' })
    .transform((value) => value.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim())
    .pipe(
        z
            .string()
            .min(2, 'Headline must be at least 2 characters')
            .max(80, 'Headline must be at most 80 characters')
            .refine((value) => value.split('\n').length <= 4, 'Headline can have at most 4 lines'),
    )

// Internal paths ("/new-in") or absolute http(s) URLs only — never javascript: etc.
const link = z
    .string()
    .trim()
    .max(300, 'Link must be at most 300 characters')
    .regex(/^(\/(?!\/)|https?:\/\/)/i, 'Link must start with / or http(s)://')
const linkUrl = z.preprocess(emptyToNull, link.nullable())

const backgroundColor = z.preprocess(
    emptyToNull,
    z.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Use a hex colour like #e8e9eb').toLowerCase().nullable(),
)

const date = z.preprocess(emptyToNull, z.coerce.date({ error: 'Invalid date' }).nullable())

const placement = z.preprocess(emptyToUndefined, z.enum(PLACEMENTS, { error: 'Invalid placement' }))

// Price cards. `id` refers to an existing card so its image is kept; images for card i
// arrive as the multipart file `itemImage<i>`.
const item = z.object({
    id: z.string().trim().max(40).optional(),
    label: z.string().trim().min(1, 'Card label is required').max(30, 'Card label must be at most 30 characters'),
    value: z.string().trim().min(1, 'Card value is required').max(20, 'Card value must be at most 20 characters'),
    linkUrl: link,
    removeImage: z.boolean().optional(),
})

// Multipart sends the array as a JSON string
const items = z.preprocess(
    (value) => {
        if (value === '' || value === null) return null
        if (typeof value !== 'string') return value
        try {
            return JSON.parse(value)
        } catch {
            return {} // fails the array check below with "Cards must be a list"
        }
    },
    z.array(item, { error: 'Cards must be a list' }).max(MAX_ITEMS, `At most ${MAX_ITEMS} cards`).nullable(),
)

const fields = {
    title,
    subtitle: optionalText(60, 'Label'),
    highlight: optionalText(30, 'Offer'),
    ctaLabel: optionalText(30, 'Button text'),
    linkUrl,
    backgroundColor,
    items,
    placement,
    isActive: boolish,
    sortOrder,
    startsAt: date,
    endsAt: date,
}

const optional = (shape) => Object.fromEntries(Object.entries(shape).map(([key, schema]) => [key, schema.optional()]))

// Shared cross-field rules; the service re-checks them against the stored row on update
export function checkBannerRules(data, ctx) {
    if (data.ctaLabel && !data.linkUrl) {
        ctx.addIssue({ code: 'custom', path: ['linkUrl'], message: 'Add a link for the button' })
    }
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
        ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must be after the start' })
    }
}

export const createBannerSchema = {
    body: z.object({ ...optional(fields), title }).superRefine(checkBannerRules),
}

export const updateBannerSchema = {
    params: idParams,
    body: z.object({
        ...optional(fields),
        removeMobileImage: boolish.optional(), // send true to clear the mobile image
    }),
}

export const listBannersSchema = {
    query: z.object({
        placement: placement.optional(),
        includeInactive: boolish.optional(), // staff only: hidden + out-of-schedule banners
    }),
}

export const bannerIdSchema = { params: idParams }
