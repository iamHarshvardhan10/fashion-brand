import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { canAccess, DASHBOARD_ROLES, LOGIN_PATH, SESSION_COOKIE, type Role } from "@/lib/access";

// Optimistic gate for /dashboard: reads the role hint from the session cookie and redirects
// before any page renders. It doesn't verify the signature — the dashboard immediately calls
// /api/auth/me, and the API verifies the token on every request, so a forged cookie gets no data.
function readSession(request: NextRequest): { role: Role } | null {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    try {
        const payload = decodeJwt(token);
        if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;
        const role = payload.role as Role;
        return DASHBOARD_ROLES.includes(role) ? { role } : null;
    } catch {
        return null;
    }
}

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const session = readSession(request);

    if (pathname === LOGIN_PATH) {
        // Already signed in: skip the login form
        if (session) return NextResponse.redirect(new URL("/dashboard", request.url));
        return NextResponse.next();
    }

    if (!session) {
        const url = new URL(LOGIN_PATH, request.url);
        url.searchParams.set("next", pathname + search);
        return NextResponse.redirect(url);
    }

    // Signed in but this section isn't for their role (e.g. an admin opening /dashboard/team)
    if (!canAccess(session.role, pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard", "/dashboard/:path*"],
};
