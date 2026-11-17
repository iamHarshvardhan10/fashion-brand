"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { canAccess } from "@/lib/access";
import { clearUser } from "@/redux/slices/authSlice";
import { currentPath, loginUrl, setUnauthorizedHandler } from "@/services/authSession";
import { loadSession, logout, type AuthUser } from "@/services/operations/authAPI";

// Inside <AuthProvider> the user is always loaded, so consumers get a non-null user
export function useAuth() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const user = useAppSelector((state) => state.auth.user);
    if (!user) throw new Error("useAuth must be used inside <AuthProvider>");

    const refresh = useCallback(async () => {
        await dispatch(loadSession({ silent: true }));
    }, [dispatch]);

    const signOut = useCallback(async () => {
        router.replace(loginUrl()); // navigate first so the gate doesn't add ?next=
        await dispatch(logout());
        router.refresh();
    }, [dispatch, router]);

    return { user, refresh, signOut };
}

// Confirms the session with the API (proxy.ts only does an optimistic cookie check),
// keeps the user in Redux, and sends the browser to login whenever the session ends.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { user, status, error } = useAppSelector((state) => state.auth);

    // Any API call that comes back 401 (expired, revoked, suspended) ends the session here
    useEffect(
        () =>
            setUnauthorizedHandler(() => {
                dispatch(clearUser());
            }),
        [dispatch],
    );

    useEffect(() => {
        if (status === "idle") dispatch(loadSession());
    }, [status, dispatch]);

    useEffect(() => {
        if (status === "unauthenticated") router.replace(loginUrl(currentPath()));
    }, [status, router]);

    // Role changed while signed in (e.g. demoted): leave pages they can no longer see
    useEffect(() => {
        if (user && !canAccess(user.role, pathname)) router.replace("/dashboard");
    }, [user, pathname, router]);

    if (status === "error") {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="font-display text-3xl font-black tracking-tight uppercase font-stretch-75%">
                    Something went wrong
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <button
                    type="button"
                    onClick={() => dispatch(loadSession())}
                    className="font-mono text-xs tracking-[0.2em] uppercase underline underline-offset-8"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-svh items-center justify-center" role="status">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading dashboard…</span>
            </div>
        );
    }

    return children;
}

// Render children only for certain roles (pages are already gated by proxy.ts)
export function RoleGate({
    roles,
    children,
    fallback = null,
}: {
    roles: AuthUser["role"][];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const { user } = useAuth();
    return roles.includes(user.role) ? children : fallback;
}
