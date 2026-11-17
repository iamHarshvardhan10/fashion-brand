import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/redux/reducer";

// A store per browser session (created in components/providers/StoreProvider.tsx),
// never a module-level singleton, so server renders can't share state between requests.
export function makeStore() {
    return configureStore({ reducer: rootReducer });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

// Async operations in services/operations that read/update the store
export type AppThunk<R = void> = (dispatch: AppDispatch, getState: () => RootState) => Promise<R>;
