import { productEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

const { PRODUCTS_API, PRODUCT_DETAILS_API, PRODUCT_IMAGES_API, PRODUCT_IMAGE_API, PRODUCT_IMAGE_ORDER_API } = productEndpoints;

// All money values are integers in paise (₹1 = 100), matching the backend.

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ProductTag = "NEW" | "BESTSELLER" | "FEW_LEFT";

export type ProductImage = {
    id: string;
    url: string;
    publicId: string;
    alt: string | null;
    color: string | null;
    sortOrder: number;
};

export type ProductVariant = {
    id: string;
    sku: string;
    barcode: string | null;
    size: string;
    color: string | null;
    colorHex: string | null;
    price: number | null;
    mrp: number | null;
    stock: number;
    lowStockThreshold: number;
    isActive: boolean;
    sortOrder: number;
};

export type ProductAttribute = { id: string; label: string; values: string[]; sortOrder: number };

type Ref = { id: string; name: string; slug?: string };

export type Product = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    highlights: string[];
    brand: string | null;
    styleCode: string | null;
    season: string | null;
    modelInfo: string | null;
    videoUrl: string | null;
    price: number;
    mrp: number;
    costPrice: number | null;
    gstRate: number | null;
    hsnCode: string | null;
    countryOfOrigin: string;
    manufacturerDetails: string | null;
    packerDetails: string | null;
    importerDetails: string | null;
    netQuantity: string | null;
    weightGrams: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    isReturnable: boolean;
    isExchangeable: boolean;
    returnWindowDays: number;
    codAvailable: boolean;
    maxPerOrder: number | null;
    status: ProductStatus;
    tag: ProductTag | null;
    isFeatured: boolean;
    totalStock: number;
    categoryId: string;
    subCategoryId: string | null;
    sizeChartId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    searchKeywords: string[];
    ratingAverage: number;
    ratingCount: number;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    category: Ref;
    subCategory: Ref | null;
    industries: Ref[]; // Men / Women / ...
    images: ProductImage[];
    variants: ProductVariant[];
    attributes: ProductAttribute[];
};

export type ProductListItem = Omit<Product, "images" | "variants" | "attributes"> & {
    image: ProductImage | null;
    variantCount: number;
    lowStockCount: number;
    outOfStockCount: number;
};

export type ProductList = {
    items: ProductListItem[];
    total: number;
    page: number;
    pageSize: number;
    counts?: Partial<Record<ProductStatus, number>>;
};

export type ProductListQuery = {
    search?: string;
    status?: ProductStatus;
    categoryId?: string;
    industryId?: string;
    stock?: "in" | "low" | "sizes-out" | "out";
    sort?: "newest" | "oldest" | "name" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc";
    page?: number;
    pageSize?: number;
};

export type VariantInput = {
    id?: string;
    sku: string;
    barcode: string | null;
    size: string;
    color: string | null;
    colorHex: string | null;
    price: number | null;
    mrp: number | null;
    stock: number;
    lowStockThreshold: number;
    isActive: boolean;
};

// Body for create/update: the editable columns plus attributes and variants
export type ProductInput = Omit<
    Product,
    | "id"
    | "slug"
    | "totalStock"
    | "ratingAverage"
    | "ratingCount"
    | "publishedAt"
    | "createdAt"
    | "updatedAt"
    | "category"
    | "subCategory"
    | "industries"
    | "images"
    | "variants"
    | "attributes"
> & {
    slug?: string;
    industryIds: string[];
    attributes: { label: string; values: string[] }[];
    variants: VariantInput[];
};

export async function fetchProducts(query: ProductListQuery = {}) {
    const response = await apiConnector<ProductList>("GET", PRODUCTS_API, undefined, undefined, {
        ...query,
        includeAll: true,
    });
    return response.data.data;
}

export async function fetchProduct(id: string) {
    const response = await apiConnector<Product>("GET", PRODUCT_DETAILS_API(id));
    return response.data.data;
}

export async function createProduct(input: ProductInput) {
    const response = await apiConnector<Product>("POST", PRODUCTS_API, input);
    return response.data.data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
    const response = await apiConnector<Product>("PATCH", PRODUCT_DETAILS_API(id), input);
    return response.data.data;
}

export async function deleteProduct(id: string) {
    const response = await apiConnector<{ id: string }>("DELETE", PRODUCT_DETAILS_API(id));
    return response.data.data;
}

// ---------- Images ----------

export async function uploadProductImages(id: string, files: { file: File; alt?: string; color?: string | null }[]) {
    const fd = new FormData();
    for (const { file } of files) fd.append("images", file);
    fd.append("meta", JSON.stringify(files.map(({ alt, color }) => ({ alt: alt || undefined, color: color || null }))));
    const response = await apiConnector<ProductImage[]>("POST", PRODUCT_IMAGES_API(id), fd);
    return response.data.data;
}

export async function updateProductImage(id: string, imageId: string, data: { alt?: string | null; color?: string | null }) {
    const response = await apiConnector<ProductImage[]>("PATCH", PRODUCT_IMAGE_API(id, imageId), data);
    return response.data.data;
}

export async function reorderProductImages(id: string, ids: string[]) {
    const response = await apiConnector<ProductImage[]>("PUT", PRODUCT_IMAGE_ORDER_API(id), { ids });
    return response.data.data;
}

export async function deleteProductImage(id: string, imageId: string) {
    const response = await apiConnector<ProductImage[]>("DELETE", PRODUCT_IMAGE_API(id, imageId));
    return response.data.data;
}
