import type { ProductStatus, ProductTag } from "@/services/operations/productAPI";

// Presets for the product form. Editors can always type their own values; these just save typing
// and keep the catalogue consistent (which matters for storefront filters).

// ---------- Money (backend stores paise) ----------

export const toPaise = (rupees: string) => {
    const n = Number.parseFloat(rupees);
    return Number.isFinite(n) ? Math.round(n * 100) : null;
};
export const toRupees = (paise: number | null | undefined) => (paise == null ? "" : String(paise / 100));
export const formatPaise = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const discountPercent = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

// ---------- Labels ----------

export const statusLabels: Record<ProductStatus, string> = { DRAFT: "Draft", ACTIVE: "Active", ARCHIVED: "Archived" };
export const statusStyles: Record<ProductStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-900",
    DRAFT: "bg-amber-100 text-amber-900",
    ARCHIVED: "bg-neutral-200 text-neutral-700",
};
export const tagLabels: Record<ProductTag, string> = { NEW: "New", BESTSELLER: "Bestseller", FEW_LEFT: "Few left" };

// ---------- Variants ----------

export const sizeSystems: { id: string; label: string; sizes: string[] }[] = [
    { id: "apparel", label: "Apparel (XS–3XL)", sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"] },
    { id: "waist", label: "Waist (inches)", sizes: ["26", "28", "30", "32", "34", "36", "38", "40", "42", "44"] },
    { id: "shoe", label: "Footwear (UK)", sizes: ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"] },
    { id: "belt", label: "Belts", sizes: ["S (28–30)", "M (32–34)", "L (36–38)", "XL (40–42)"] },
    { id: "volume", label: "Volume", sizes: ["30 ml", "50 ml", "100 ml", "200 ml"] },
    { id: "free", label: "One size", sizes: ["Free Size"] },
];

// Size order used when sorting variant rows
const SIZE_ORDER = sizeSystems.flatMap((s) => s.sizes);
export const sizeRank = (size: string) => {
    const i = SIZE_ORDER.indexOf(size);
    return i === -1 ? SIZE_ORDER.length + (Number.parseFloat(size) || 0) : i;
};

export const colorPalette: { name: string; hex: string }[] = [
    { name: "Black", hex: "#111111" },
    { name: "White", hex: "#ffffff" },
    { name: "Off White", hex: "#f2efe6" },
    { name: "Grey Melange", hex: "#9a9a9a" },
    { name: "Charcoal", hex: "#36454f" },
    { name: "Navy", hex: "#1f2a44" },
    { name: "Blue", hex: "#2f5aa8" },
    { name: "Sky Blue", hex: "#9cc7e8" },
    { name: "Olive", hex: "#6b6b3a" },
    { name: "Bottle Green", hex: "#0d4d36" },
    { name: "Beige", hex: "#d9c7a7" },
    { name: "Brown", hex: "#6b4226" },
    { name: "Maroon", hex: "#6d1a2a" },
    { name: "Red", hex: "#b3261e" },
    { name: "Mustard", hex: "#d4a017" },
    { name: "Lavender", hex: "#b9a7d6" },
];

const codePart = (text: string) => text.toUpperCase().replace(/[^A-Z0-9]+/g, "");

// "TS-OVR-001" + Black + "UK 8" -> "TS-OVR-001-BLA-UK8"
export function makeSku(prefix: string, size: string, color: string | null) {
    return [codePart(prefix).slice(0, 30) || "SKU", color ? codePart(color).slice(0, 3) : null, codePart(size)]
        .filter(Boolean)
        .join("-");
}

// ---------- Specifications ----------

export const specGroups: { label: string; specs: string[] }[] = [
    { label: "Apparel", specs: ["Fabric", "GSM", "Fit", "Pattern", "Neck", "Collar", "Sleeve", "Length", "Closure", "Pockets", "Occasion", "Wash care"] },
    { label: "Bottoms", specs: ["Fabric", "Fit", "Rise", "Stretch", "Wash", "Closure", "Pockets", "Wash care"] },
    { label: "Footwear", specs: ["Upper material", "Sole material", "Closure", "Toe shape", "Insole", "Care"] },
    { label: "Accessories", specs: ["Material", "Dimensions", "Buckle", "Width", "Care"] },
    { label: "Fragrance", specs: ["Fragrance family", "Top notes", "Heart notes", "Base notes", "Concentration", "Longevity"] },
];

// Suggestions shown in the value box for common specs
export const specSuggestions: Record<string, string[]> = {
    Fabric: ["100% Cotton", "Cotton Blend", "Linen", "Cotton Linen", "Polyester", "Viscose", "Denim", "Corduroy", "Terry", "French Terry", "Fleece"],
    Fit: ["Oversized", "Regular Fit", "Relaxed Fit", "Slim Fit", "Boxy Fit", "Baggy", "Straight", "Tapered", "Skinny"],
    Pattern: ["Solid", "Graphic Print", "Typography", "Striped", "Checked", "Embroidered", "Washed", "Colour Block"],
    Neck: ["Round Neck", "V-Neck", "Henley", "Polo", "Hooded", "Mock Neck"],
    Collar: ["Spread Collar", "Cuban Collar", "Button-down", "Mandarin", "Johnny Collar"],
    Sleeve: ["Half Sleeve", "Full Sleeve", "Sleeveless", "Drop Shoulder", "Roll-up"],
    Length: ["Regular", "Cropped", "Longline"],
    Closure: ["Button", "Zip", "Pull-on", "Drawstring", "Lace-up", "Velcro", "Slip-on"],
    Occasion: ["Casual", "Streetwear", "Party", "Formal", "Work", "Vacation", "Sports"],
    Rise: ["Low Rise", "Mid Rise", "High Rise"],
    Stretch: ["Non-stretch", "Slight stretch", "Stretchable"],
    "Wash care": ["Machine wash cold", "Wash inside out", "Do not bleach", "Do not tumble dry", "Dry in shade", "Iron on reverse", "Dry clean only"],
    Concentration: ["Eau de Parfum (EDP)", "Eau de Toilette (EDT)", "Parfum", "Body Mist"],
};

// ---------- Tax ----------

// India GST since 22 Sep 2025 (GST 2.0): 0 / 5 / 18 / 40. 12 and 28 remain selectable for older listings.
export const gstRates = [0, 5, 18, 40, 3, 12, 28];

// Clothing and footwear: 5% when the sale price per piece is ₹2,500 or less, otherwise 18%.
// Treat as a hint only; the rate depends on the HSN code, so confirm with your accountant.
export const suggestedGst = (pricePaise: number | null) => (pricePaise == null ? null : pricePaise <= 250000 ? 5 : 18);

export const hsnSuggestions: { code: string; label: string }[] = [
    { code: "6109", label: "T-shirts, vests (knitted)" },
    { code: "6110", label: "Sweatshirts, hoodies, pullovers (knitted)" },
    { code: "6105", label: "Men's shirts (knitted)" },
    { code: "6205", label: "Men's shirts (woven)" },
    { code: "6203", label: "Men's trousers, jeans, shorts (woven)" },
    { code: "6103", label: "Men's trousers, joggers (knitted)" },
    { code: "6201", label: "Men's jackets, coats (woven)" },
    { code: "6204", label: "Women's dresses, skirts, trousers (woven)" },
    { code: "6206", label: "Women's blouses, shirts (woven)" },
    { code: "6403", label: "Footwear, leather uppers" },
    { code: "6404", label: "Footwear, textile uppers (sneakers)" },
    { code: "4203", label: "Leather belts and accessories" },
    { code: "3303", label: "Perfumes and eau de toilette" },
    { code: "6505", label: "Caps and hats" },
];
