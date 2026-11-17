export const INDIAN_STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
    "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
    "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal",
];

// Mirror the backend zod rules so forms can validate before a round trip
export const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    indianMobile: /^[6-9]\d{9}$/,
    gstin: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    pincode: /^[1-9]\d{5}$/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

export const IMAGE_UPLOAD = {
    maxMb: 5,
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
};
