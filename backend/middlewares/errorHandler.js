import multer from 'multer'
import { Prisma } from '@prisma/client'
import ApiError from '../utils/ApiError.js'

export function notFound(req, res, next) {
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    let status = err.statusCode || 500
    let message = err.message || 'Something went wrong'
    let details = err.details

    if (err instanceof multer.MulterError) {
        status = 400
        message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            // Fallback for races; services check uniqueness first with friendlier messages
            status = 409
            message = 'A record with these values already exists'
        } else if (err.code === 'P2025') {
            status = 404
            message = 'Resource not found'
        } else if (err.code === 'P2023') {
            status = 400 // e.g. a malformed UUID reached the database
            message = 'Invalid id'
        } else if (err.code === 'P2003') {
            status = 400
            message = 'Related record does not exist'
        }
    } else if (err.type === 'entity.parse.failed') {
        status = 400
        message = 'Invalid JSON body'
    }

    if (status >= 500) {
        console.error(err)
        if (process.env.NODE_ENV === 'production') message = 'Internal server error'
    }

    res.status(status).json({ success: false, message, ...(details && { errors: details }) })
}
