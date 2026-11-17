import { Router } from 'express'
import * as controller from '../controllers/user.controller.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import validate from '../middlewares/validate.js'
import { createStaffSchema, listUsersSchema, updateUserSchema } from '../validations/user.validation.js'

const router = Router()

// Team management is super-admin only
router.use(authenticate, authorize('SUPER_ADMIN'))

router.get('/', validate(listUsersSchema), controller.listUsers)
router.post('/', validate(createStaffSchema), controller.createStaff)
router.patch('/:id', validate(updateUserSchema), controller.updateUser)

export default router
