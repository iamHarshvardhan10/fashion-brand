// Role rules shared by proxy.ts (redirects), the sidebar (what to show) and pages.
// These are UX only — the Express API enforces the same rules on every request.

export type Role = "SUPER_ADMIN" | "ADMIN" | "USER";

export const SESSION_COOKIE = "fb_session";
export const LOGIN_PATH = "/dashboard/login";

export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];
export const DASHBOARD_ROLES: Role[] = STAFF_ROLES;

export const roleLabels: Record<Role, string> = {
    SUPER_ADMIN: "Super admin",
    ADMIN: "Admin",
    USER: "Customer",
};

// Most specific prefix first. Anything not listed is open to every dashboard role.
const routeAccess: { prefix: string; roles: Role[] }[] = [
    { prefix: "/dashboard/team", roles: ["SUPER_ADMIN"] },
];

export function canAccess(role: Role | undefined, pathname: string) {
    if (!role || !DASHBOARD_ROLES.includes(role)) return false;
    const rule = routeAccess.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
    return rule ? rule.roles.includes(role) : true;
}

export const isStaff = (role?: Role) => Boolean(role && STAFF_ROLES.includes(role));

// Only allow redirecting back to our own dashboard pages (no open redirects)
export function safeNextPath(next: string | null | undefined) {
    if (!next || !next.startsWith("/dashboard") || next.startsWith("//") || next.startsWith(LOGIN_PATH)) {
        return "/dashboard";
    }
    return next;
}
