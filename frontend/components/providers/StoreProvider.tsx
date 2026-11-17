"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/redux/store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    // Lazily created once per mount
    const [store] = useState(makeStore);
    return <Provider store={store}>{children}</Provider>;
}
