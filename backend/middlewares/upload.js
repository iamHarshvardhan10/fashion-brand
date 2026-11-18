import multer from 'multer'
import ApiError from '../utils/ApiError.js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_SIZE_MB = 5

// Files stay in memory and are streamed straight to Cloudinary
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(ApiError.badRequest('Image must be JPG, PNG, WEBP or AVIF'))
        }
        cb(null, true)
    },
})

export const uploadSingleImage = upload.single('image')

// Product gallery: up to 10 files per request in the `images` field
export const uploadProductImages = upload.array('images', 10)

// Banners: desktop image, an optional portrait crop for phones, and one image per price card
// (itemImage0..itemImage3, matching the card's position)
export const uploadBannerImages = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 },
    ...[0, 1, 2, 3].map((i) => ({ name: `itemImage${i}`, maxCount: 1 })),
])
