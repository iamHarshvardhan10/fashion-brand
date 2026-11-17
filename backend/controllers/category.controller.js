import * as categoryService from '../services/category.service.js'
import { isStaff } from '../middlewares/auth.js'

// Controllers only translate HTTP <-> service calls. Express 5 forwards thrown/rejected errors to errorHandler.

export async function listCategories(req, res) {
    // Hidden categories are only visible to staff
    const query = { ...req.validatedQuery, includeInactive: isStaff(req.user) && req.validatedQuery.includeInactive }
    const categories = await categoryService.listCategories(query)
    res.json({ success: true, data: categories })
}

export async function getCategory(req, res) {
    const category = await categoryService.getCategoryById(req.params.id)
    res.json({ success: true, data: category })
}

export async function createCategory(req, res) {
    const category = await categoryService.createCategory(req.body, req.file)
    res.status(201).json({ success: true, message: 'Category created', data: category })
}

export async function updateCategory(req, res) {
    const category = await categoryService.updateCategory(req.params.id, req.body, req.file)
    res.json({ success: true, message: 'Category updated', data: category })
}

export async function deleteCategory(req, res) {
    const result = await categoryService.deleteCategory(req.params.id)
    res.json({ success: true, message: 'Category deleted', data: result })
}
