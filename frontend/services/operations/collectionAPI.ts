import { collectionEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

const { COLLECTIONS_API, COLLECTION_DETAILS_API } = collectionEndpoints;

// EDIT = home page edit cards (/collections/<slug>), VIBE = "Shop by vibe" tiles (/vibes/<slug>)
export type CollectionType = "EDIT" | "VIBE" | "DROP";

export type CollectionProduct = {
    id: string;
    name: string;
    slug: string;
    price: number; // paise
    mrp: number;
    tag: "NEW" | "BESTSELLER" | "FEW_LEFT" | null;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    totalStock: number;
    category: { id: string; name: string; slug: string };
    images: { url: string; alt: string | null }[];
};

export type Collection = {
    id: string;
    name: string;
    slug: string;
    type: CollectionType;
    description: string | null;
    imageUrl: string | null;
    imagePublicId: string | null;
    isActive: boolean;
    sortOrder: number;
    launchAt: string | null;
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { products: number };
    products?: CollectionProduct[]; // only on the detail endpoint
};

export type CollectionFormValues = {
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    endsAt: string; // datetime-local, "" = no end
    image: File | null;
    productIds: string[];
};

const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

function toFormData(values: CollectionFormValues, type?: CollectionType) {
    const fd = new FormData();
    if (type) fd.append("type", type);
    fd.append("name", values.name.trim());
    if (values.slug.trim()) fd.append("slug", values.slug.trim());
    fd.append("description", values.description.trim());
    fd.append("isActive", String(values.isActive));
    fd.append("sortOrder", String(values.sortOrder));
    fd.append("endsAt", toIso(values.endsAt));
    fd.append("productIds", JSON.stringify(values.productIds));
    if (values.image) fd.append("image", values.image);
    return fd;
}

// Staff see hidden collections too; the backend ignores includeInactive for everyone else
export async function fetchCollections(type: CollectionType) {
    const response = await apiConnector<Collection[]>("GET", COLLECTIONS_API, undefined, undefined, { type, includeInactive: true });
    return response.data.data;
}

export async function fetchCollection(id: string) {
    const response = await apiConnector<Collection>("GET", COLLECTION_DETAILS_API(id));
    return response.data.data;
}

export async function createCollection(type: CollectionType, values: CollectionFormValues) {
    const response = await apiConnector<Collection>("POST", COLLECTIONS_API, toFormData(values, type));
    return response.data.data;
}

export async function updateCollection(id: string, values: CollectionFormValues) {
    const response = await apiConnector<Collection>("PATCH", COLLECTION_DETAILS_API(id), toFormData(values));
    return response.data.data;
}

export async function toggleCollection(id: string, isActive: boolean) {
    const response = await apiConnector<Collection>("PATCH", COLLECTION_DETAILS_API(id), { isActive });
    return response.data.data;
}

export async function deleteCollection(id: string) {
    const response = await apiConnector<{ id: string }>("DELETE", COLLECTION_DETAILS_API(id));
    return response.data.data;
}
