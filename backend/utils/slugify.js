// "Oversized T-Shirts & Tees" -> "oversized-t-shirts-tees"
export default function slugify(text) {
    return String(text)
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
