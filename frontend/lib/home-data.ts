// TODO: replace all of this with real catalogue data from the backend.
// Image paths point into /public; until the files exist, each slot shows a neutral placeholder.

export type Product = {
    id: string;
    name: string;
    category: "tshirts" | "shirts" | "jeans" | "sneakers";
    price: number;
    mrp: number;
    tag?: "New" | "Bestseller" | "Few left";
    image: string;
};

export const categories = [
    { label: "T-Shirts", href: "/tshirts", image: "/categories/tshirts.jpg" },
    { label: "Shirts", href: "/shirts", image: "/categories/shirts.jpg" },
    { label: "Jeans", href: "/jeans", image: "/categories/jeans.jpg" },
    { label: "Trousers", href: "/trousers", image: "/categories/trousers.jpg" },
    { label: "Jackets", href: "/jackets", image: "/categories/jackets.jpg" },
    { label: "Sneakers", href: "/sneakers", image: "/categories/sneakers.jpg" },
    { label: "Belts", href: "/belts", image: "/categories/belts.jpg" },
    { label: "Perfumes", href: "/perfumes", image: "/categories/perfumes.jpg" },
];

export const edits = [
    { title: "The Bomber Edit", text: "Layers that mean business", href: "/collections/bomber", image: "/edits/bomber.jpg" },
    { title: "Formal Shirts", text: "Sharp, never stiff", href: "/collections/formal", image: "/edits/formal.jpg" },
    { title: "Hand Embroidered", text: "Stitched to stand out", href: "/collections/embroidered", image: "/edits/embroidered.jpg" },
];

export const vibes = [
    { title: "Weekend Plans", href: "/vibes/weekend", image: "/vibes/weekend.jpg" },
    { title: "Date Night", href: "/vibes/date-night", image: "/vibes/date-night.jpg" },
    { title: "Concert Fits", href: "/vibes/concert", image: "/vibes/concert.jpg" },
    { title: "Office Hours", href: "/vibes/office", image: "/vibes/office.jpg" },
    { title: "Vacation Mode", href: "/vibes/vacation", image: "/vibes/vacation.jpg" },
    { title: "Street Ready", href: "/vibes/street", image: "/vibes/street.jpg" },
];

export const productTabs = [
    { value: "all", label: "All" },
    { value: "tshirts", label: "T-Shirts" },
    { value: "shirts", label: "Shirts" },
    { value: "jeans", label: "Jeans" },
    { value: "sneakers", label: "Sneakers" },
] as const;

export const products: Product[] = [
    { id: "p1", name: "Oversized Graphic Tee", category: "tshirts", price: 899, mrp: 1499, tag: "New", image: "/products/p1.jpg" },
    { id: "p2", name: "Boxy Heavyweight Tee", category: "tshirts", price: 999, mrp: 1299, image: "/products/p2.jpg" },
    { id: "p3", name: "Washed Pocket Tee", category: "tshirts", price: 799, mrp: 1199, tag: "Bestseller", image: "/products/p3.jpg" },
    { id: "p4", name: "Cuban Collar Linen Shirt", category: "shirts", price: 1799, mrp: 2499, tag: "New", image: "/products/p4.jpg" },
    { id: "p5", name: "Striped Relaxed Shirt", category: "shirts", price: 1599, mrp: 2199, image: "/products/p5.jpg" },
    { id: "p6", name: "Embroidered Overshirt", category: "shirts", price: 2299, mrp: 2999, tag: "Few left", image: "/products/p6.jpg" },
    { id: "p7", name: "Baggy Fit Jeans", category: "jeans", price: 2199, mrp: 2999, tag: "Bestseller", image: "/products/p7.jpg" },
    { id: "p8", name: "Straight Washed Jeans", category: "jeans", price: 1999, mrp: 2799, image: "/products/p8.jpg" },
    { id: "p9", name: "Carpenter Denim", category: "jeans", price: 2399, mrp: 3199, tag: "New", image: "/products/p9.jpg" },
    { id: "p10", name: "Court Low Sneakers", category: "sneakers", price: 2999, mrp: 4499, tag: "New", image: "/products/p10.jpg" },
    { id: "p11", name: "Chunky Runner", category: "sneakers", price: 3499, mrp: 4999, image: "/products/p11.jpg" },
    { id: "p12", name: "Suede Skate Shoe", category: "sneakers", price: 2799, mrp: 3999, tag: "Few left", image: "/products/p12.jpg" },
];

export const priceDrops = [
    { label: "Tees from", value: "₹699", href: "/tshirts", image: "/products/p2.jpg" },
    { label: "Shirts from", value: "₹1,299", href: "/shirts", image: "/products/p5.jpg" },
    { label: "Jeans from", value: "₹1,799", href: "/jeans", image: "/products/p8.jpg" },
    { label: "Sneakers", value: "50% off", href: "/sneakers", image: "/products/p10.jpg" },
];

// The limited drop the countdown counts down to (IST)
export const DROP_ENDS_AT = "2026-11-15T23:59:59+05:30";

export const formatPrice = (value: number) => `₹${value.toLocaleString("en-IN")}`;
