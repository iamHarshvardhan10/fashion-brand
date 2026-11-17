import { Router } from 'express'
import * as controller from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit.js'
import validate from '../middlewares/validate.js'
import { changePasswordSchema, loginSchema, registerSchema } from '../validations/auth.validation.js'

const router = Router()

router.post('/login', loginLimiter, validate(loginSchema), controller.login)
router.post('/register', registerLimiter, validate(registerSchema), controller.register) // storefront customers
router.post('/logout', controller.logout)

router.get('/me', authenticate, controller.me)
router.post('/logout-all', authenticate, controller.logoutEverywhere)
router.patch('/password', authenticate, validate(changePasswordSchema), controller.changePassword)

export default router
