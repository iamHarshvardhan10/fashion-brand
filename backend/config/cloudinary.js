import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER_NAME || 'fashion_brand'

// Upload an in-memory file (from multer) and return { url, publicId }
export function uploadImage(buffer, subFolder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: `${ROOT_FOLDER}/${subFolder}`, resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error)
                resolve({ url: result.secure_url, publicId: result.public_id })
            },
        )
        stream.end(buffer)
    })
}

// Best-effort delete: a failed cleanup should never fail the user's request
export async function deleteImage(publicId) {
    if (!publicId) return
    try {
        await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.error(`Failed to delete Cloudinary image ${publicId}:`, error.message)
    }
}

export default cloudinary
