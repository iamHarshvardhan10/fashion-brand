import { Router } from 'express'
import * as controller from '../controllers/industry.controller.js'
import validate from '../middlewares/validate.js'
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.js'
import { STAFF_ROLES } from '../config/auth.js'
import { uploadSingleImage } from '../middlewares/upload.js'
import {
    createIndustrySchema,
    industryIdSchema,
    industryRefSchema,
    listIndustriesSchema,
    updateIndustrySchema,
} from '../validations/industry.validation.js'

const router = Router()
const staffOnly = [authenticate, authorize(STAFF_ROLES)]

// GET /api/industries?nav=true is what the storefront navbar uses: live industries with their
// active categories and sub-categories. Writes are multipart (optional `image`; `categoryIds` JSON array).
router.get('/', optionalAuthenticate, validate(listIndustriesSchema), controller.listIndustries)
router.get('/:id', optionalAuthenticate, validate(industryRefSchema), controller.getIndustry)
router.post('/', staffOnly, uploadSingleImage, validate(createIndustrySchema), controller.createIndustry)
router.patch('/:id', staffOnly, uploadSingleImage, validate(updateIndustrySchema), controller.updateIndustry)
router.delete('/:id', staffOnly, validate(industryIdSchema), controller.deleteIndustry)

export default router
