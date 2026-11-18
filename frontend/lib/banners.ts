import { cacheLife, cacheTag } from "next/cache";
import type { Banner, BannerPlacement } from "@/services/operations/bannerAPI";

// Server-side only: talks to Express directly rather than through the /api rewrite.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000";

export const bannerCacheTag = (placement: BannerPlacement) => `banners:${placement}`;

// Live banners for a storefront slot. Cached so the home page stays in the static shell;
// the dashboard expires the tag after every change, and cacheLife picks up schedule changes.
export async function getBanners(placement: BannerPlacement): Promise<Banner[]> {
    "use cache";
    cacheLife("minutes");
    cacheTag(bannerCacheTag(placement));

    try {
        const res = await fetch(`${BACKEND_URL}/api/banners?placement=${placement}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body: { data: Banner[] } = await res.json();
        return body.data;
    } catch (error) {
        // An unreachable API shouldn't take the home page down with it
        console.error(`Could not load ${placement} banners:`, error instanceof Error ? error.message : error);
        return [];
    }
}

// Single-slot placements show the first live banner (lowest slide order)
export async function getBanner(placement: BannerPlacement): Promise<Banner | null> {
    return (await getBanners(placement))[0] ?? null;
}
