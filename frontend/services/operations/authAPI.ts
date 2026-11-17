import { DASHBOARD_ROLES, type Role } from "@/lib/access";
import { clearUser, setAuthError, setAuthLoading, setUser } from "@/redux/slices/authSlice";
import type { AppThunk } from "@/redux/store";
import { ApiError, errorMessage } from "@/utils/apiError";
import { authEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

const { LOGIN_API, LOGOUT_API, ME_API } = authEndpoints;

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    status: "ACTIVE" | "SUSPENDED";
    lastLoginAt: string | null;
    createdAt: string;
};

// Dashboard sign-in. Throws ApiError so the form can show the message.
export function login(email: string, password: string): AppThunk<AuthUser> {
    return async (dispatch) => {
        const response = await apiConnector<AuthUser>("POST", LOGIN_API, { email, password, portal: "dashboard" });
        dispatch(setUser(response.data.data));
        return response.data.data;
    };
}

// Confirms the cookie session with the backend and stores the user.
// `silent` refreshes in the background without flashing the loading state.
export function loadSession({ silent = false } = {}): AppThunk<AuthUser | null> {
    return async (dispatch) => {
        if (!silent) dispatch(setAuthLoading());
        try {
            const response = await apiConnector<AuthUser>("GET", ME_API);
            const user = response.data.data;
            if (!DASHBOARD_ROLES.includes(user.role)) {
                // Customer session: not allowed in the dashboard
                await apiConnector("POST", LOGOUT_API).catch(() => {});
                dispatch(clearUser());
                return null;
            }
            dispatch(setUser(user));
            return user;
        } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                dispatch(clearUser());
                return null;
            }
            dispatch(setAuthError(errorMessage(error, "Could not load your account")));
            return null;
        }
    };
}

export function logout(): AppThunk {
    return async (dispatch) => {
        await apiConnector("POST", LOGOUT_API).catch(() => {}); // cookie is cleared server-side
        dispatch(clearUser());
    };
}
