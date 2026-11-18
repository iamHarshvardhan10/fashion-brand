import { Router } from 'express'
import * as controller from '../controllers/banner.controller.js'
import validate from '../middlewares/validate.js'
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.js'
import { STAFF_ROLES } from '../config/auth.js'
import { uploadBannerImages } from '../middlewares/upload.js'
import {
    bannerIdSchema,
    createBannerSchema,
    listBannersSchema,
    updateBannerSchema,
} from '../validations/banner.validation.js'

const router = Router()
const staffOnly = [authenticate, authorize(STAFF_ROLES)]

// Public reads (storefront, e.g. GET /api/banners?placement=HERO); writes are staff-only.
// Multipart fields: image (desktop, required on create) and mobileImage (optional).
router.get('/', optionalAuthenticate, validate(listBannersSchema), controller.listBanners)
router.get('/:id', validate(bannerIdSchema), controller.getBanner)
router.post('/', staffOnly, uploadBannerImages, validate(createBannerSchema), controller.createBanner)
router.patch('/:id', staffOnly, uploadBannerImages, validate(updateBannerSchema), controller.updateBanner)
router.delete('/:id', staffOnly, validate(bannerIdSchema), controller.deleteBanner)

export default router
