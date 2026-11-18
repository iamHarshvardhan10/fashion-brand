// Let Cloudinary pick the format/quality and resize for the slot. Other URLs pass through.
export function sized(url: string, width: number) {
    return url.includes("res.cloudinary.com") ? url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`) : url;
}
