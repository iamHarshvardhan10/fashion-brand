import type { BannerPlacement } from "@/services/operations/bannerAPI";

// How each home-page banner slot uses the shared Banner fields. Drives the dashboard form;
// the storefront components in components/home/* render the same fields.

type TextField = { label: string; placeholder: string; hint?: string; multiline?: boolean };

export type SlotConfig = {
    tab: string;
    title: string;
    description: string;
    carousel: boolean; // true: every live banner rotates; false: only the first live one shows
    image: { label: string; hint: string };
    mobileImage?: boolean;
    backgroundColor?: { default: string; hint: string };
    items?: { max: number };
    fields: Partial<Record<"title" | "subtitle" | "highlight" | "ctaLabel" | "linkUrl", TextField>>;
};

export const bannerSlots: Record<Exclude<BannerPlacement, "PROMO_STRIP">, SlotConfig> = {
    HERO: {
        tab: "Hero",
        title: "Home hero slides",
        description: "Full-screen slides at the top of the home page, auto-advancing every 5 seconds.",
        carousel: true,
        image: { label: "Desktop image", hint: "Landscape, at least 1920×1080" },
        mobileImage: true,
        fields: {
            subtitle: { label: "Label", placeholder: "e.g. Dress the unconventional", hint: "Small text above the headline" },
            title: { label: "Headline", placeholder: "e.g. Wear The Hype Raw", hint: "Words are laid out two per line" },
            ctaLabel: { label: "Button text", placeholder: "e.g. Shop the drop", hint: "Leave empty to hide the button" },
            linkUrl: { label: "Button link", placeholder: "/new-in" },
        },
    },
    BESTSELLERS: {
        tab: "Bestsellers",
        title: "Bestsellers banner",
        description: "Headline on the left, cut-out photo in the middle, offer on the right.",
        carousel: false,
        image: { label: "Photo", hint: "Portrait cut-out, about 740×960. Edges fade into the background colour" },
        backgroundColor: { default: "#e8e9eb", hint: "Match the photo's backdrop so the model blends in" },
        fields: {
            title: { label: "Left headline", placeholder: "Last few\nbestsellers\nleft", hint: "Each line breaks where you press Enter", multiline: true },
            subtitle: { label: "Offer lead-in", placeholder: "e.g. Up to" },
            highlight: { label: "Offer", placeholder: "e.g. 30% off", hint: "Shown in brand red" },
            ctaLabel: { label: "Link text", placeholder: "e.g. Shop bestsellers" },
            linkUrl: { label: "Link", placeholder: "/bestsellers", hint: "The whole banner is clickable" },
        },
    },
    SHOP_IT: {
        tab: "Shop it",
        title: "Shop it, save it banner",
        description: "Wide photo with a tilted headline on the left and a price on the right.",
        carousel: false,
        image: { label: "Desktop image", hint: "Wide, about 1800×600" },
        mobileImage: true,
        fields: {
            title: { label: "Headline", placeholder: "Shop it\nSave it", hint: "First line is small, the rest large", multiline: true },
            subtitle: { label: "Badge", placeholder: "e.g. Collection under" },
            highlight: { label: "Price", placeholder: "e.g. ₹999/-" },
            linkUrl: { label: "Link", placeholder: "/under-999", hint: "The whole banner is clickable" },
        },
    },
    PRICE_DROP: {
        tab: "Price drop",
        title: "Price drop banner",
        description: "Headline, cut-out photo and up to four price cards linking to categories.",
        carousel: false,
        image: { label: "Photo", hint: "Portrait cut-out, about 900×1100. Sides fade into the background colour" },
        backgroundColor: { default: "#dfe4e5", hint: "Match the photo's backdrop so the model blends in" },
        items: { max: 4 },
        fields: {
            title: { label: "Headline", placeholder: "Never\nbefore\nprices", hint: "Each line breaks where you press Enter", multiline: true },
        },
    },
};

export type SlotPlacement = keyof typeof bannerSlots;
export const slotPlacements = Object.keys(bannerSlots) as SlotPlacement[];
