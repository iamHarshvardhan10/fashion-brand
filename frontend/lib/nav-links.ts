// Client-safe navbar types and URL helpers (lib/navigation.ts holds the cached server fetch,
// which client components must not import).

export type NavIndustry = {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    description: string | null;
    categories: { id: string; name: string; slug: string; subCategories: { id: string; name: string; slug: string }[] }[];
};

// Storefront URLs: /men, /men/tshirts, /men/tshirts/oversized-tees
export const industryHref = (industry: string, category?: string, sub?: string) =>
    ["", industry, category, sub].filter(Boolean).join("/") || "/";
