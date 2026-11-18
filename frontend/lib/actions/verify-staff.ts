// Server-only (next/headers can't be imported into client code)
import { cookies } from "next/headers";
import { isStaff, SESSION_COOKIE, type Role } from "@/lib/access";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000";

// Server actions are public endpoints, so cache-busting actions confirm the caller is staff
// by asking the API (which verifies the session signature) rather than trusting the cookie.
export async function verifyStaff() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return false;

    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { cookie: `${SESSION_COOKIE}=${token}` },
        cache: "no-store",
    }).catch(() => null);
    if (!res?.ok) return false;

    const body: { data?: { role?: Role } } = await res.json();
    return isStaff(body.data?.role);
}
