import { Router } from 'express'
import * as controller from '../controllers/collection.controller.js'
import validate from '../middlewares/validate.js'
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.js'
import { STAFF_ROLES } from '../config/auth.js'
import { uploadSingleImage } from '../middlewares/upload.js'
import {
    collectionIdSchema,
    collectionRefSchema,
    createCollectionSchema,
    listCollectionsSchema,
    updateCollectionSchema,
} from '../validations/collection.validation.js'

const router = Router()
const staffOnly = [authenticate, authorize(STAFF_ROLES)]

// Public reads, e.g. GET /api/collections?type=VIBE and GET /api/collections/date-night (with products).
// Writes are multipart: `image` file + fields; `productIds` is a JSON array in display order.
router.get('/', optionalAuthenticate, validate(listCollectionsSchema), controller.listCollections)
router.get('/:id', optionalAuthenticate, validate(collectionRefSchema), controller.getCollection)
router.post('/', staffOnly, uploadSingleImage, validate(createCollectionSchema), controller.createCollection)
router.patch('/:id', staffOnly, uploadSingleImage, validate(updateCollectionSchema), controller.updateCollection)
router.delete('/:id', staffOnly, validate(collectionIdSchema), controller.deleteCollection)

export default router
