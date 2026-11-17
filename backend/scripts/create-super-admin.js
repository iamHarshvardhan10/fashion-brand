// Creates (or promotes) a super admin. Dashboard staff can't sign up publicly, so this is
// how the first account is made; after that, super admins add the team from /dashboard/team.
//
//   npm run create-super-admin -- --email you@brand.com --name "Your Name" --password "S3cure-pass"
//
import 'dotenv/config'
import { parseArgs } from 'node:util'
import prisma from '../lib/prisma.js'
import { hashPassword } from '../utils/password.js'
import { email as emailSchema, newPassword, personName } from '../validations/auth.validation.js'

const { values } = parseArgs({
    options: {
        email: { type: 'string' },
        name: { type: 'string' },
        password: { type: 'string' },
    },
})

function fail(message) {
    console.error(`\n✖ ${message}\n`)
    console.error('Usage: npm run create-super-admin -- --email you@brand.com --name "Your Name" --password "S3cure-pass"\n')
    process.exit(1)
}

const email = emailSchema.safeParse(values.email ?? '')
const name = personName.safeParse(values.name ?? '')
const password = newPassword.safeParse(values.password ?? '')
if (!email.success) fail(email.error.issues[0].message)
if (!name.success) fail(name.error.issues[0].message)
if (!password.success) fail(password.error.issues[0].message)

try {
    const passwordHash = await hashPassword(password.data)
    const user = await prisma.user.upsert({
        where: { email: email.data },
        create: { email: email.data, name: name.data, passwordHash, role: 'SUPER_ADMIN' },
        // Existing account: promote, reactivate, reset password and sign out other sessions
        update: { name: name.data, passwordHash, role: 'SUPER_ADMIN', status: 'ACTIVE', tokenVersion: { increment: 1 } },
    })
    console.log(`\n✔ Super admin ready: ${user.email}\n  Sign in at /dashboard/login\n`)
} catch (error) {
    fail(error.message)
} finally {
    await prisma.$disconnect()
}
