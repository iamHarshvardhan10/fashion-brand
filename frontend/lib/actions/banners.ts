"use server";

import { updateTag } from "next/cache";
import { bannerCacheTag } from "@/lib/banners";
import { verifyStaff } from "@/lib/actions/verify-staff";
import type { BannerPlacement } from "@/services/operations/bannerAPI";

// Called by the dashboard after a banner changes so the storefront shows it straight away
export async function refreshBanners(placement: BannerPlacement = "HERO") {
    if (await verifyStaff()) updateTag(bannerCacheTag(placement));
}
