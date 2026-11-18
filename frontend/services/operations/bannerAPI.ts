import { bannerEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

const { BANNERS_API, BANNER_DETAILS_API } = bannerEndpoints;

export type BannerPlacement = "HERO" | "PRICE_DROP" | "BESTSELLERS" | "SHOP_IT" | "PROMO_STRIP";

// A price card on the PRICE_DROP banner
export type BannerItem = {
    id: string;
    label: string;
    value: string;
    linkUrl: string;
    imageUrl: string | null;
    imagePublicId: string | null;
};

// What each field means per placement is described in lib/banner-slots.ts
export type Banner = {
    id: string;
    title: string; // newlines split the headline into lines
    subtitle: string | null;
    highlight: string | null;
    ctaLabel: string | null;
    linkUrl: string | null;
    backgroundColor: string | null;
    items: BannerItem[] | null;
    imageUrl: string;
    imagePublicId: string;
    mobileImageUrl: string | null;
    mobileImagePublicId: string | null;
    placement: BannerPlacement;
    isActive: boolean;
    sortOrder: number;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type BannerItemFormValues = {
    id?: string; // set for existing cards so their image is kept
    label: string;
    value: string;
    linkUrl: string;
    image: File | null;
    imageUrl: string | null; // current image, for previews
    removeImage: boolean;
};

export type BannerFormValues = {
    title: string;
    subtitle: string;
    highlight: string;
    ctaLabel: string;
    linkUrl: string;
    backgroundColor: string;
    items: BannerItemFormValues[];
    isActive: boolean;
    sortOrder: number;
    startsAt: string; // datetime-local value, "" = no start
    endsAt: string; // datetime-local value, "" = no end
    image: File | null;
    mobileImage: File | null;
    removeMobileImage: boolean;
};

// datetime-local has no timezone; send the browser's local time as an ISO instant
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

// Multipart so images can travel with the fields. Empty strings clear optional fields.
function toFormData(values: BannerFormValues, placement: BannerPlacement, withItems: boolean) {
    const fd = new FormData();
    fd.append("placement", placement);
    fd.append("title", values.title.trim());
    fd.append("subtitle", values.subtitle.trim());
    fd.append("highlight", values.highlight.trim());
    fd.append("ctaLabel", values.ctaLabel.trim());
    fd.append("linkUrl", values.linkUrl.trim());
    fd.append("backgroundColor", values.backgroundColor.trim());
    fd.append("isActive", String(values.isActive));
    fd.append("sortOrder", String(values.sortOrder));
    fd.append("startsAt", toIso(values.startsAt));
    fd.append("endsAt", toIso(values.endsAt));
    if (values.image) fd.append("image", values.image);
    if (values.mobileImage) fd.append("mobileImage", values.mobileImage);
    else if (values.removeMobileImage) fd.append("removeMobileImage", "true");

    if (withItems) {
        const items = values.items.map(({ id, label, value, linkUrl, removeImage }) => ({
            ...(id && { id }),
            label: label.trim(),
            value: value.trim(),
            linkUrl: linkUrl.trim(),
            removeImage,
        }));
        fd.append("items", JSON.stringify(items));
        values.items.forEach((item, i) => item.image && fd.append(`itemImage${i}`, item.image));
    }
    return fd;
}

// Staff get hidden and scheduled banners too; the backend ignores includeInactive for everyone else
export async function fetchBanners({ placement = "HERO" as BannerPlacement, includeInactive = true } = {}) {
    const response = await apiConnector<Banner[]>("GET", BANNERS_API, undefined, undefined, {
        placement,
        includeInactive,
    });
    return response.data.data;
}

export async function createBanner(values: BannerFormValues, placement: BannerPlacement, withItems = false) {
    const response = await apiConnector<Banner>("POST", BANNERS_API, toFormData(values, placement, withItems));
    return response.data.data;
}

export async function updateBanner(id: string, values: BannerFormValues, placement: BannerPlacement, withItems = false) {
    const response = await apiConnector<Banner>("PATCH", BANNER_DETAILS_API(id), toFormData(values, placement, withItems));
    return response.data.data;
}

export async function toggleBanner(id: string, isActive: boolean) {
    const response = await apiConnector<Banner>("PATCH", BANNER_DETAILS_API(id), { isActive });
    return response.data.data;
}

export async function deleteBanner(id: string) {
    const response = await apiConnector<{ id: string }>("DELETE", BANNER_DETAILS_API(id));
    return response.data.data;
}
