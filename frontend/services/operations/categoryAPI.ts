import { categoryEndpoints, subCategoryEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

const { CATEGORIES_API, CATEGORY_DETAILS_API } = categoryEndpoints;
const { SUB_CATEGORIES_API, SUB_CATEGORY_DETAILS_API } = subCategoryEndpoints;

export type SubCategory = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    imagePublicId: string | null;
    isActive: boolean;
    sortOrder: number;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
};

export type Category = Omit<SubCategory, "categoryId"> & {
    _count: { subCategories: number };
    subCategories?: SubCategory[];
};

// Shared by the category and sub-category forms
export type CategoryFormValues = {
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    image: File | null;
    removeImage: boolean;
};

// Multipart so an image can travel with the fields
function toFormData(values: CategoryFormValues, extra: Record<string, string> = {}) {
    const fd = new FormData();
    fd.append("name", values.name.trim());
    if (values.slug.trim()) fd.append("slug", values.slug.trim());
    fd.append("description", values.description.trim());
    fd.append("isActive", String(values.isActive));
    fd.append("sortOrder", String(values.sortOrder));
    if (values.image) fd.append("image", values.image);
    else if (values.removeImage) fd.append("removeImage", "true");
    for (const [key, value] of Object.entries(extra)) fd.append(key, value);
    return fd;
}

// ---------- Categories ----------

// Staff see hidden categories too; the backend ignores includeInactive for everyone else
export async function fetchCategories({ includeInactive = true, withSubCategories = true } = {}) {
    const response = await apiConnector<Category[]>("GET", CATEGORIES_API, undefined, undefined, {
        includeInactive,
        withSubCategories,
    });
    return response.data.data;
}

export async function createCategory(values: CategoryFormValues) {
    const response = await apiConnector<Category>("POST", CATEGORIES_API, toFormData(values));
    return response.data.data;
}

export async function updateCategory(id: string, values: CategoryFormValues) {
    const response = await apiConnector<Category>("PATCH", CATEGORY_DETAILS_API(id), toFormData(values));
    return response.data.data;
}

export async function toggleCategory(id: string, isActive: boolean) {
    const response = await apiConnector<Category>("PATCH", CATEGORY_DETAILS_API(id), { isActive });
    return response.data.data;
}

export async function deleteCategory(id: string) {
    const response = await apiConnector<{ id: string; deletedSubCategories: number }>("DELETE", CATEGORY_DETAILS_API(id));
    return response.data.data;
}

// ---------- Sub-categories ----------

export async function createSubCategory(categoryId: string, values: CategoryFormValues) {
    const response = await apiConnector<SubCategory>("POST", SUB_CATEGORIES_API, toFormData(values, { categoryId }));
    return response.data.data;
}

export async function updateSubCategory(id: string, values: CategoryFormValues) {
    const response = await apiConnector<SubCategory>("PATCH", SUB_CATEGORY_DETAILS_API(id), toFormData(values));
    return response.data.data;
}

export async function toggleSubCategory(id: string, isActive: boolean) {
    const response = await apiConnector<SubCategory>("PATCH", SUB_CATEGORY_DETAILS_API(id), { isActive });
    return response.data.data;
}

export async function deleteSubCategory(id: string) {
    const response = await apiConnector<{ id: string }>("DELETE", SUB_CATEGORY_DETAILS_API(id));
    return response.data.data;
}
