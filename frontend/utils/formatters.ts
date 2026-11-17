export const formatDate = (iso: string | null | undefined, withTime = false) =>
    iso
        ? new Date(iso).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              ...(withTime && { hour: "2-digit", minute: "2-digit" }),
          })
        : "—";

// Same rules as backend/utils/slugify.js so previews match what gets saved
export function slugify(text: string) {
    return text
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// "+91 98765 43210" / "09876543210" -> "9876543210"
export const normalisePhone = (value: string) => value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
