import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/services/operations/authAPI";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

type AuthState = {
    user: AuthUser | null;
    status: AuthStatus;
    error: string | null;
};

// No token in Redux: the session lives in an httpOnly cookie. This only mirrors who is signed in.
const initialState: AuthState = { user: null, status: "idle", error: null };

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthLoading(state) {
            state.status = "loading";
            state.error = null;
        },
        setUser(state, action: PayloadAction<AuthUser>) {
            state.user = action.payload;
            state.status = "authenticated";
            state.error = null;
        },
        clearUser(state) {
            state.user = null;
            state.status = "unauthenticated";
            state.error = null;
        },
        setAuthError(state, action: PayloadAction<string>) {
            state.status = "error";
            state.error = action.payload;
        },
    },
});

export const { setAuthLoading, setUser, clearUser, setAuthError } = authSlice.actions;
export default authSlice.reducer;
