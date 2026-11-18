import { Router } from 'express'
import authRoutes from './auth.routes.js'
import bannerRoutes from './banner.routes.js'
import productRoutes from './product.routes.js'
import collectionRoutes from './collection.routes.js'
import industryRoutes from './industry.routes.js'
import categoryRoutes from './category.routes.js'
import subCategoryRoutes from './subCategory.routes.js'
import userRoutes from './user.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/sub-categories', subCategoryRoutes)
router.use('/banners', bannerRoutes)
router.use('/products', productRoutes)
router.use('/collections', collectionRoutes)
router.use('/industries', industryRoutes)

export default router
