"use server";

import { updateTag } from "next/cache";
import { NAVIGATION_TAG } from "@/lib/navigation";
import { verifyStaff } from "@/lib/actions/verify-staff";

// Called by the dashboard after industries or categories change so the navbar updates straight away
export async function refreshNavigation() {
    if (await verifyStaff()) updateTag(NAVIGATION_TAG);
}
