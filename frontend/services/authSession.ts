import { LOGIN_PATH } from "@/lib/access";

// The session itself is an httpOnly cookie set by the backend, so the browser never
// touches the token. This module only decides what happens when the session ends.

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

// Registered by the dashboard (clears Redux + redirects). Returns an unsubscribe fn.
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
    onUnauthorized = handler;
    return () => {
        if (onUnauthorized === handler) onUnauthorized = null;
    };
}

// Called by apiConnector when any request comes back 401
export function handleUnauthorized() {
    onUnauthorized?.();
}

export function loginUrl(next?: string) {
    if (!next) return LOGIN_PATH;
    return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

export function currentPath() {
    return typeof window === "undefined" ? "/dashboard" : window.location.pathname + window.location.search;
}
