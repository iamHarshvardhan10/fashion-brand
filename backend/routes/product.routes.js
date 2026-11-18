import { Router } from 'express'
import * as controller from '../controllers/product.controller.js'
import validate from '../middlewares/validate.js'
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.js'
import { STAFF_ROLES } from '../config/auth.js'
import { uploadProductImages } from '../middlewares/upload.js'
import {
    createProductSchema,
    imageRefSchema,
    listProductsSchema,
    productIdSchema,
    productRefSchema,
    reorderImagesSchema,
    updateImageSchema,
    updateProductSchema,
    uploadImagesSchema,
} from '../validations/product.validation.js'

const router = Router()
const staffOnly = [authenticate, authorize(STAFF_ROLES)]

// Public reads return live products only; staff get everything (add ?includeAll=true to lists).
router.get('/', optionalAuthenticate, validate(listProductsSchema), controller.listProducts)
router.get('/:id', optionalAuthenticate, validate(productRefSchema), controller.getProduct) // id or slug
router.post('/', staffOnly, validate(createProductSchema), controller.createProduct)
router.patch('/:id', staffOnly, validate(updateProductSchema), controller.updateProduct)
router.delete('/:id', staffOnly, validate(productIdSchema), controller.deleteProduct)

// Gallery. Multipart field `images` (up to 10 files) + optional `meta` JSON: [{ alt, color }]
router.post('/:id/images', staffOnly, uploadProductImages, validate(uploadImagesSchema), controller.addImages)
router.put('/:id/images/order', staffOnly, validate(reorderImagesSchema), controller.reorderImages)
router.patch('/:id/images/:imageId', staffOnly, validate(updateImageSchema), controller.updateImage)
router.delete('/:id/images/:imageId', staffOnly, validate(imageRefSchema), controller.removeImage)

export default router
