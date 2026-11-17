// TODO: replace with the real product-detail payload from the backend.
// Until then, each product's gallery borrows photos from its own category so the layout has something to show.
import { products, type Product } from "@/lib/home-data";

export type ProductDetail = Product & {
    categoryLabel: string;
    categoryHref: string;
    images: string[];
    sizes: { label: string; inStock: boolean }[];
    details: { label: string; value: string[] }[];
    description: string;
    highlights: string[];
};

const categoryMeta: Record<Product["category"], { label: string; href: string; sizes: string[] }> = {
    tshirts: { label: "T-Shirts", href: "/tshirts", sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] },
    shirts: { label: "Shirts", href: "/shirts", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
    jeans: { label: "Jeans", href: "/jeans", sizes: ["28", "30", "32", "34", "36", "38"] },
    sneakers: { label: "Sneakers", href: "/sneakers", sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"] },
};

const material: Record<Product["category"], string[]> = {
    tshirts: ["100% Cotton, 240 GSM", "Machine wash cold, inside out"],
    shirts: ["100% Cotton", "Machine wash cold, line dry"],
    jeans: ["98% Cotton, 2% Elastane", "Machine wash cold, do not tumble dry"],
    sneakers: ["Upper: Suede & Leather", "Wipe clean with a damp cloth"],
};

export function getProductDetail(id: string): ProductDetail | undefined {
    const product = products.find((p) => p.id === id);
    if (!product) return undefined;

    const meta = categoryMeta[product.category];
    const siblings = products.filter((p) => p.category === product.category && p.id !== product.id);

    return {
        ...product,
        categoryLabel: meta.label,
        categoryHref: meta.href,
        images: [product.image, ...siblings.map((p) => p.image), product.image, siblings[0]?.image ?? product.image],
        // Mark one size as sold out so the disabled state is visible
        sizes: meta.sizes.map((label, i) => ({ label, inStock: i !== meta.sizes.length - 2 })),
        details: [
            { label: "Material & Care", value: material[product.category] },
            { label: "Country of Origin", value: ["India"] },
            // TODO: pull the real manufacturer details from lib/site.ts once filled in
            { label: "Manufactured & Sold By", value: ["Your Brand Pvt. Ltd.", "City – 000000, India"] },
        ],
        description: `The ${product.name} is cut for everyday wear and built to last. Clean lines, a relaxed silhouette and fabric that softens with every wash.`,
        highlights: ["Premium heavy-gauge fabric", "Relaxed, true-to-size fit", "Pre-shrunk and colour-fast"],
    };
}

export function getRelatedProducts(product: Product, limit = 4) {
    const sameCategory = products.filter((p) => p.category === product.category && p.id !== product.id);
    const others = products.filter((p) => p.category !== product.category);
    return [...sameCategory, ...others].slice(0, limit);
}
