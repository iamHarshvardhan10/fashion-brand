import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

// scrypt parameters (N=2^15, r=8, p=1) — OWASP-recommended baseline
const N = 32768
const r = 8
const p = 1
const KEY_LENGTH = 64
const maxmem = 64 * 1024 * 1024

// Stored as: scrypt$N$r$p$saltHex$hashHex — parameters travel with the hash so they can be raised later
export async function hashPassword(password) {
    const salt = randomBytes(16)
    const hash = await scryptAsync(password, salt, KEY_LENGTH, { N, r, p, maxmem })
    return ['scrypt', N, r, p, salt.toString('hex'), hash.toString('hex')].join('$')
}

export async function verifyPassword(password, stored) {
    const [algo, n, rr, pp, saltHex, hashHex] = String(stored).split('$')
    if (algo !== 'scrypt' || !saltHex || !hashHex) return false

    const expected = Buffer.from(hashHex, 'hex')
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length, {
        N: Number(n),
        r: Number(rr),
        p: Number(pp),
        maxmem,
    })
    return timingSafeEqual(actual, expected)
}

// Used when the email doesn't exist so response time doesn't reveal which emails are registered
const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'))
export async function fakeVerify(password) {
    await verifyPassword(password, DUMMY_HASH)
    return false
}
