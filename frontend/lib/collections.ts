import { cacheLife, cacheTag } from "next/cache";
import type { Collection, CollectionType } from "@/services/operations/collectionAPI";

// Server-side only: talks to Express directly rather than through the /api rewrite.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000";

export const collectionCacheTag = (type: CollectionType) => `collections:${type}`;

// Storefront URL for a collection card
export const collectionHref = (c: Pick<Collection, "type" | "slug">) =>
    c.type === "VIBE" ? `/vibes/${c.slug}` : `/collections/${c.slug}`;

// Live collections of one type, in display order. Cached like banners: the dashboard expires
// the tag after each change, and cacheLife picks up end dates passing.
export async function getCollections(type: CollectionType): Promise<Collection[]> {
    "use cache";
    cacheLife("minutes");
    cacheTag(collectionCacheTag(type));

    try {
        const res = await fetch(`${BACKEND_URL}/api/collections?type=${type}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body: { data: Collection[] } = await res.json();
        return body.data;
    } catch (error) {
        // An unreachable API shouldn't take the home page down with it
        console.error(`Could not load ${type} collections:`, error instanceof Error ? error.message : error);
        return [];
    }
}
