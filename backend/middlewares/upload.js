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
