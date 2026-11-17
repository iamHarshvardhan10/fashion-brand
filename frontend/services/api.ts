// Every backend endpoint in one place. Same-origin by default: next.config.ts rewrites
// /api/* to the Express backend, so the session cookie is first-party.
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const authEndpoints = {
    LOGIN_API: `${BASE_URL}/auth/login`,
    REGISTER_API: `${BASE_URL}/auth/register`,
    LOGOUT_API: `${BASE_URL}/auth/logout`,
    LOGOUT_ALL_API: `${BASE_URL}/auth/logout-all`,
    ME_API: `${BASE_URL}/auth/me`,
    CHANGE_PASSWORD_API: `${BASE_URL}/auth/password`,
};

export const teamEndpoints = {
    USERS_API: `${BASE_URL}/users`,
    USER_DETAILS_API: (id: string) => `${BASE_URL}/users/${id}`,
};

export const categoryEndpoints = {
    CATEGORIES_API: `${BASE_URL}/categories`,
    CATEGORY_DETAILS_API: (id: string) => `${BASE_URL}/categories/${id}`,
};

export const subCategoryEndpoints = {
    SUB_CATEGORIES_API: `${BASE_URL}/sub-categories`,
    SUB_CATEGORY_DETAILS_API: (id: string) => `${BASE_URL}/sub-categories/${id}`,
};
