import { industryEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

const { INDUSTRIES_API, INDUSTRY_DETAILS_API } = industryEndpoints;

// Top-level departments in the navbar (Men, Women, Kids ...). Each lists shared categories in its own order.

export type IndustryCategory = {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    imageUrl: string | null;
    subCategories: { id: string; name: string; slug: string; isActive: boolean }[];
};

export type Industry = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    imagePublicId: string | null;
    isActive: boolean;
    showInNav: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    categories: IndustryCategory[];
    _count: { products: number };
};

export type IndustryFormValues = {
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    showInNav: boolean;
    sortOrder: number;
    image: File | null;
    removeImage: boolean;
    categoryIds: string[];
};

function toFormData(values: IndustryFormValues) {
    const fd = new FormData();
    fd.append("name", values.name.trim());
    if (values.slug.trim()) fd.append("slug", values.slug.trim());
    fd.append("description", values.description.trim());
    fd.append("isActive", String(values.isActive));
    fd.append("showInNav", String(values.showInNav));
    fd.append("sortOrder", String(values.sortOrder));
    fd.append("categoryIds", JSON.stringify(values.categoryIds));
    if (values.image) fd.append("image", values.image);
    else if (values.removeImage) fd.append("removeImage", "true");
    return fd;
}

// Staff get hidden industries (and hidden categories inside them) too
export async function fetchIndustries({ includeInactive = true } = {}) {
    const response = await apiConnector<Industry[]>("GET", INDUSTRIES_API, undefined, undefined, { includeInactive });
    return response.data.data;
}

export async function createIndustry(values: IndustryFormValues) {
    const response = await apiConnector<Industry>("POST", INDUSTRIES_API, toFormData(values));
    return response.data.data;
}

export async function updateIndustry(id: string, values: IndustryFormValues) {
    const response = await apiConnector<Industry>("PATCH", INDUSTRY_DETAILS_API(id), toFormData(values));
    return response.data.data;
}

export async function patchIndustry(id: string, data: Partial<Pick<Industry, "isActive" | "showInNav">>) {
    const response = await apiConnector<Industry>("PATCH", INDUSTRY_DETAILS_API(id), data);
    return response.data.data;
}

export async function deleteIndustry(id: string) {
    const response = await apiConnector<{ id: string; unlinkedProducts: number }>("DELETE", INDUSTRY_DETAILS_API(id));
    return response.data.data;
}
