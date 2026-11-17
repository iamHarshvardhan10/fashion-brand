import { Router } from 'express'
import * as controller from '../controllers/category.controller.js'
import validate from '../middlewares/validate.js'
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.js'
import { STAFF_ROLES } from '../config/auth.js'
import { uploadSingleImage } from '../middlewares/upload.js'
import {
    categoryIdSchema,
    createCategorySchema,
    listCategoriesSchema,
    updateCategorySchema,
} from '../validations/category.validation.js'

const router = Router()
const staffOnly = [authenticate, authorize(STAFF_ROLES)]

// Public reads (storefront); writes are staff-only. Auth runs before multer so
// unauthenticated uploads are rejected without buffering the file.
router.get('/', optionalAuthenticate, validate(listCategoriesSchema), controller.listCategories)
router.get('/:id', validate(categoryIdSchema), controller.getCategory)
router.post('/', staffOnly, uploadSingleImage, validate(createCategorySchema), controller.createCategory)
router.patch('/:id', staffOnly, uploadSingleImage, validate(updateCategorySchema), controller.updateCategory)
router.delete('/:id', staffOnly, validate(categoryIdSchema), controller.deleteCategory)

export default router
