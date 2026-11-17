// TODO: replace with real data from the backend (orders, analytics, inventory endpoints).
import { products } from "@/lib/home-data";

export { formatPrice } from "@/lib/home-data";

export type Stat = {
    label: string;
    value: string;
    change: number; // % vs previous period
    hint: string;
};

export const stats: Stat[] = [
    { label: "Revenue", value: "₹8,42,300", change: 12.4, hint: "vs last 30 days" },
    { label: "Orders", value: "1,284", change: 8.1, hint: "vs last 30 days" },
    { label: "Avg. order value", value: "₹2,156", change: -2.3, hint: "vs last 30 days" },
    { label: "Return rate", value: "4.8%", change: -0.6, hint: "vs last 30 days" },
];

// Weekly revenue for the current and previous period, in ₹
export const revenueSeries = [
    { week: "W1", current: 168000, previous: 142000 },
    { week: "W2", current: 182000, previous: 151000 },
    { week: "W3", current: 159000, previous: 163000 },
    { week: "W4", current: 204000, previous: 170000 },
    { week: "W5", current: 221000, previous: 176000 },
    { week: "W6", current: 198000, previous: 181000 },
    { week: "W7", current: 236000, previous: 188000 },
    { week: "W8", current: 252000, previous: 195000 },
];

export const salesByCategory = [
    { category: "Sneakers", sales: 312000 },
    { category: "Jeans", sales: 214000 },
    { category: "Shirts", sales: 168000 },
    { category: "T-Shirts", sales: 98000 },
    { category: "Accessories", sales: 50300 },
];

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Returned";

export type Order = {
    id: string;
    customer: string;
    email: string;
    items: number;
    total: number;
    status: OrderStatus;
    date: string;
};

export const recentOrders: Order[] = [
    { id: "#ORD-2041", customer: "Aarav Mehta", email: "aarav@example.com", items: 3, total: 5697, status: "Processing", date: "09 Nov 2026" },
    { id: "#ORD-2040", customer: "Isha Kapoor", email: "isha@example.com", items: 1, total: 2999, status: "Shipped", date: "09 Nov 2026" },
    { id: "#ORD-2039", customer: "Rohan Das", email: "rohan@example.com", items: 2, total: 3198, status: "Delivered", date: "08 Nov 2026" },
    { id: "#ORD-2038", customer: "Meera Iyer", email: "meera@example.com", items: 4, total: 7496, status: "Pending", date: "08 Nov 2026" },
    { id: "#ORD-2037", customer: "Kabir Singh", email: "kabir@example.com", items: 1, total: 2199, status: "Returned", date: "07 Nov 2026" },
    { id: "#ORD-2036", customer: "Ananya Rao", email: "ananya@example.com", items: 2, total: 4298, status: "Delivered", date: "07 Nov 2026" },
];

export const topProducts = [
    { product: products[9], sold: 214 },
    { product: products[6], sold: 186 },
    { product: products[3], sold: 152 },
    { product: products[0], sold: 139 },
];

export const lowStock = [
    { name: "Embroidered Overshirt", sku: "SH-EMB-M", stock: 4, capacity: 50 },
    { name: "Suede Skate Shoe", sku: "SN-SUE-9", stock: 6, capacity: 40 },
    { name: "Carpenter Denim", sku: "JN-CAR-32", stock: 9, capacity: 60 },
];
