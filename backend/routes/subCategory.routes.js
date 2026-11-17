import { Router } from 'express'
import * as controller from '../controllers/subCategory.controller.js'
import { STAFF_ROLES } from '../config/auth.js'
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.js'
import validate from '../middlewares/validate.js'
import { uploadSingleImage } from '../middlewares/upload.js'
import {
    createSubCategorySchema,
    listSubCategoriesSchema,
    subCategoryIdSchema,
    updateSubCategorySchema,
} from '../validations/subCategory.validation.js'

const router = Router()
const staffOnly = [authenticate, authorize(STAFF_ROLES)]

router.get('/', optionalAuthenticate, validate(listSubCategoriesSchema), controller.listSubCategories)
router.get('/:id', validate(subCategoryIdSchema), controller.getSubCategory)
router.post('/', staffOnly, uploadSingleImage, validate(createSubCategorySchema), controller.createSubCategory)
router.patch('/:id', staffOnly, uploadSingleImage, validate(updateSubCategorySchema), controller.updateSubCategory)
router.delete('/:id', staffOnly, validate(subCategoryIdSchema), controller.deleteSubCategory)

export default router
