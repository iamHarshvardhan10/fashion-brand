import { cacheLife, cacheTag } from "next/cache";
import type { NavIndustry } from "@/lib/nav-links";

// Server-side only: talks to Express directly rather than through the /api rewrite.
// Client components import types/URL helpers from lib/nav-links.ts instead of this file.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000";

export const NAVIGATION_TAG = "navigation";

// Industries shown in the navbar, with their categories. Cached in the static shell; the dashboard
// expires the tag whenever industries or categories change.
export async function getNavigation(): Promise<NavIndustry[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(NAVIGATION_TAG);

    try {
        const res = await fetch(`${BACKEND_URL}/api/industries?nav=true`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body: { data: NavIndustry[] } = await res.json();
        // Keep only what the navbar renders so the cached payload stays small
        return body.data.map(({ id, name, slug, imageUrl, description, categories }) => ({
            id,
            name,
            slug,
            imageUrl,
            description,
            categories: categories.map(({ id, name, slug, subCategories }) => ({
                id,
                name,
                slug,
                subCategories: subCategories.map(({ id, name, slug }) => ({ id, name, slug })),
            })),
        }));
    } catch (error) {
        console.error("Could not load navigation:", error instanceof Error ? error.message : error);
        return [];
    }
}
