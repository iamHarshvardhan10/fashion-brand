import { z } from 'zod'

export const email = z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email('Enter a valid email address'))

// For new passwords only. Login accepts any string so old/weak passwords can still sign in.
export const newPassword = z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number')

export const personName = z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be at most 80 characters')

// Indian mobile numbers; accepts "+91 98765 43210", "09876543210" etc. and stores the 10 digits
export const phone = z
    .string({ error: 'Phone number is required' })
    .transform((v) => v.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, ''))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'))

export const loginSchema = {
    body: z.object({
        email,
        password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(200),
        // "dashboard" rejects customer accounts; "store" is for the storefront login
        portal: z.enum(['dashboard', 'store']).default('store'),
    }),
}

export const registerSchema = {
    body: z.object({
        name: personName,
        email,
        password: newPassword,
        phone: phone.optional(),
    }),
}

export const changePasswordSchema = {
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword,
    }),
}
