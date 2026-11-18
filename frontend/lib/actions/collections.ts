"use server";

import { updateTag } from "next/cache";
import { collectionCacheTag } from "@/lib/collections";
import { verifyStaff } from "@/lib/actions/verify-staff";
import type { CollectionType } from "@/services/operations/collectionAPI";

// Called by the dashboard after a collection changes so the home page shows it straight away
export async function refreshCollections(type: CollectionType) {
    if (await verifyStaff()) updateTag(collectionCacheTag(type));
}
