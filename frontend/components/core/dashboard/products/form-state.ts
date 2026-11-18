import type { Product, ProductInput, ProductStatus, ProductTag } from "@/services/operations/productAPI";
import { toPaise, toRupees } from "@/lib/product-options";

// Editable form state. Numbers are kept as strings so inputs can be empty mid-edit;
// prices are in rupees here and converted to paise on save.

let keySeq = 0;
export const newKey = () => `k${++keySeq}`;

export type VariantRow = {
    key: string;
    id?: string;
    sku: string;
    barcode: string;
    size: string;
    color: string;
    colorHex: string;
    price: string;
    mrp: string;
    stock: string;
    lowStockThreshold: string;
    isActive: boolean;
};

export type SpecRow = { key: string; label: string; values: string };

export type ProductFormState = {
    name: string;
    slug: string;
    description: string;
    highlights: string[];
    brand: string;
    styleCode: string;
    season: string;
    modelInfo: string;
    videoUrl: string;
    price: string;
    mrp: string;
    costPrice: string;
    gstRate: string;
    hsnCode: string;
    countryOfOrigin: string;
    manufacturerDetails: string;
    packerDetails: string;
    importerDetails: string;
    netQuantity: string;
    weightGrams: string;
    lengthCm: string;
    widthCm: string;
    heightCm: string;
    isReturnable: boolean;
    isExchangeable: boolean;
    returnWindowDays: string;
    codAvailable: boolean;
    maxPerOrder: string;
    status: ProductStatus;
    tag: ProductTag | "";
    industryIds: string[];
    isFeatured: boolean;
    categoryId: string;
    subCategoryId: string;
    metaTitle: string;
    metaDescription: string;
    searchKeywords: string[];
    specs: SpecRow[];
    variants: VariantRow[];
};

export const emptyForm = (): ProductFormState => ({
    name: "",
    slug: "",
    description: "",
    highlights: [],
    brand: "",
    styleCode: "",
    season: "",
    modelInfo: "",
    videoUrl: "",
    price: "",
    mrp: "",
    costPrice: "",
    gstRate: "",
    hsnCode: "",
    countryOfOrigin: "India",
    manufacturerDetails: "",
    packerDetails: "",
    importerDetails: "",
    netQuantity: "1 N",
    weightGrams: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    isReturnable: true,
    isExchangeable: true,
    returnWindowDays: "15",
    codAvailable: true,
    maxPerOrder: "",
    status: "DRAFT",
    tag: "",
    industryIds: [],
    isFeatured: false,
    categoryId: "",
    subCategoryId: "",
    metaTitle: "",
    metaDescription: "",
    searchKeywords: [],
    specs: [],
    variants: [],
});

const str = (value: number | string | null | undefined) => (value == null ? "" : String(value));

export function fromProduct(p: Product): ProductFormState {
    return {
        name: p.name,
        slug: p.slug,
        description: p.description ?? "",
        highlights: p.highlights,
        brand: p.brand ?? "",
        styleCode: p.styleCode ?? "",
        season: p.season ?? "",
        modelInfo: p.modelInfo ?? "",
        videoUrl: p.videoUrl ?? "",
        price: toRupees(p.price),
        mrp: toRupees(p.mrp),
        costPrice: toRupees(p.costPrice),
        gstRate: str(p.gstRate),
        hsnCode: p.hsnCode ?? "",
        countryOfOrigin: p.countryOfOrigin,
        manufacturerDetails: p.manufacturerDetails ?? "",
        packerDetails: p.packerDetails ?? "",
        importerDetails: p.importerDetails ?? "",
        netQuantity: p.netQuantity ?? "",
        weightGrams: str(p.weightGrams),
        lengthCm: str(p.lengthCm),
        widthCm: str(p.widthCm),
        heightCm: str(p.heightCm),
        isReturnable: p.isReturnable,
        isExchangeable: p.isExchangeable,
        returnWindowDays: str(p.returnWindowDays),
        codAvailable: p.codAvailable,
        maxPerOrder: str(p.maxPerOrder),
        status: p.status,
        tag: p.tag ?? "",
        industryIds: p.industries.map((i) => i.id),
        isFeatured: p.isFeatured,
        categoryId: p.categoryId,
        subCategoryId: p.subCategoryId ?? "",
        metaTitle: p.metaTitle ?? "",
        metaDescription: p.metaDescription ?? "",
        searchKeywords: p.searchKeywords,
        specs: p.attributes.map((a) => ({ key: newKey(), label: a.label, values: a.values.join("\n") })),
        variants: p.variants.map((v) => ({
            key: newKey(),
            id: v.id,
            sku: v.sku,
            barcode: v.barcode ?? "",
            size: v.size,
            color: v.color ?? "",
            colorHex: v.colorHex ?? "",
            price: toRupees(v.price),
            mrp: toRupees(v.mrp),
            stock: String(v.stock),
            lowStockThreshold: String(v.lowStockThreshold),
            isActive: v.isActive,
        })),
    };
}

const textOrNull = (value: string) => (value.trim() ? value.trim() : null);
const intOrNull = (value: string) => {
    if (!value.trim()) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

export function toPayload(s: ProductFormState): ProductInput {
    return {
        name: s.name.trim(),
        ...(s.slug.trim() && { slug: s.slug.trim() }),
        description: textOrNull(s.description),
        highlights: s.highlights.map((h) => h.trim()).filter(Boolean),
        brand: textOrNull(s.brand),
        styleCode: textOrNull(s.styleCode),
        season: textOrNull(s.season),
        modelInfo: textOrNull(s.modelInfo),
        videoUrl: textOrNull(s.videoUrl),
        price: toPaise(s.price) ?? 0,
        mrp: toPaise(s.mrp) ?? 0,
        costPrice: toPaise(s.costPrice),
        gstRate: intOrNull(s.gstRate),
        hsnCode: textOrNull(s.hsnCode),
        countryOfOrigin: s.countryOfOrigin.trim(),
        manufacturerDetails: textOrNull(s.manufacturerDetails),
        packerDetails: textOrNull(s.packerDetails),
        importerDetails: textOrNull(s.importerDetails),
        netQuantity: textOrNull(s.netQuantity),
        weightGrams: intOrNull(s.weightGrams),
        lengthCm: intOrNull(s.lengthCm),
        widthCm: intOrNull(s.widthCm),
        heightCm: intOrNull(s.heightCm),
        isReturnable: s.isReturnable,
        isExchangeable: s.isExchangeable,
        returnWindowDays: intOrNull(s.returnWindowDays) ?? 0,
        codAvailable: s.codAvailable,
        maxPerOrder: intOrNull(s.maxPerOrder),
        status: s.status,
        tag: s.tag || null,
        industryIds: s.industryIds,
        isFeatured: s.isFeatured,
        categoryId: s.categoryId,
        subCategoryId: s.subCategoryId || null,
        sizeChartId: null,
        metaTitle: textOrNull(s.metaTitle),
        metaDescription: textOrNull(s.metaDescription),
        searchKeywords: s.searchKeywords,
        attributes: s.specs
            .map((spec) => ({
                label: spec.label.trim(),
                values: spec.values.split("\n").map((v) => v.trim()).filter(Boolean),
            }))
            .filter((spec) => spec.label || spec.values.length),
        variants: s.variants.map((v) => ({
            ...(v.id && { id: v.id }),
            sku: v.sku.trim().toUpperCase(),
            barcode: textOrNull(v.barcode),
            size: v.size.trim(),
            color: textOrNull(v.color),
            colorHex: textOrNull(v.colorHex),
            price: toPaise(v.price),
            mrp: toPaise(v.mrp),
            stock: intOrNull(v.stock) ?? 0,
            lowStockThreshold: intOrNull(v.lowStockThreshold) ?? 5,
            isActive: v.isActive,
        })),
    };
}

// Quick checks before a round trip; the API re-validates everything. Keys match API error paths.
export function validateForm(s: ProductFormState) {
    const errors: Record<string, string> = {};
    if (s.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!s.categoryId) errors.categoryId = "Choose a category";
    const price = toPaise(s.price);
    const mrp = toPaise(s.mrp);
    if (price == null || price < 100) errors.price = "Enter a selling price of at least ₹1";
    if (mrp == null || mrp < 100) errors.mrp = "Enter the MRP";
    if (price != null && mrp != null && price > mrp) errors.price = "Selling price cannot be above MRP";
    if (s.costPrice && price != null && (toPaise(s.costPrice) ?? 0) > price) {
        errors.costPrice = "Cost is above the selling price — this sells at a loss";
    }
    if (!s.countryOfOrigin.trim()) errors.countryOfOrigin = "Country of origin is required by law";
    s.variants.forEach((v, i) => {
        if (!v.size.trim()) errors[`variants.${i}.size`] = "Size required";
        if (!v.sku.trim()) errors[`variants.${i}.sku`] = "SKU required";
        if (v.stock === "" || Number(v.stock) < 0 || !Number.isInteger(Number(v.stock))) errors[`variants.${i}.stock`] = "0 or more";
    });
    s.specs.forEach((spec, i) => {
        if (!spec.label.trim() && spec.values.trim()) errors[`attributes.${i}.label`] = "Name this spec";
        if (spec.label.trim() && !spec.values.trim()) errors[`attributes.${i}.values`] = "Add a value";
    });
    return errors;
}

// Readiness checklist shown in the sidebar
export function readiness(s: ProductFormState, imageCount: number) {
    const activeVariants = s.variants.filter((v) => v.isActive);
    return [
        { label: "Name & category", done: s.name.trim().length >= 2 && Boolean(s.categoryId), required: true },
        { label: "Industry (Men, Women …)", done: s.industryIds.length > 0, required: false },
        { label: "Price & MRP", done: Boolean(toPaise(s.price)) && Boolean(toPaise(s.mrp)), required: true },
        { label: "At least one image", done: imageCount > 0, required: true },
        { label: "At least one active variant", done: activeVariants.length > 0, required: true },
        { label: "Stock added", done: activeVariants.some((v) => Number(v.stock) > 0), required: false },
        { label: "4+ images", done: imageCount >= 4, required: false },
        { label: "Description & highlights", done: Boolean(s.description.trim()) && s.highlights.some(Boolean), required: false },
        { label: "Specifications", done: s.specs.length >= 3, required: false },
        { label: "GST rate & HSN code", done: Boolean(s.gstRate) && Boolean(s.hsnCode), required: false },
        { label: "Manufacturer details", done: Boolean(s.manufacturerDetails.trim()), required: false },
        { label: "Shipping weight", done: Boolean(s.weightGrams), required: false },
        { label: "SEO title & description", done: Boolean(s.metaTitle.trim() && s.metaDescription.trim()), required: false },
    ];
}
