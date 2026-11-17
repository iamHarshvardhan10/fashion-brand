import * as subCategoryService from '../services/subCategory.service.js'
import { isStaff } from '../middlewares/auth.js'

export async function listSubCategories(req, res) {
    const query = { ...req.validatedQuery, includeInactive: isStaff(req.user) && req.validatedQuery.includeInactive }
    const subCategories = await subCategoryService.listSubCategories(query)
    res.json({ success: true, data: subCategories })
}

export async function getSubCategory(req, res) {
    const subCategory = await subCategoryService.getSubCategoryById(req.params.id)
    res.json({ success: true, data: subCategory })
}

export async function createSubCategory(req, res) {
    const subCategory = await subCategoryService.createSubCategory(req.body, req.file)
    res.status(201).json({ success: true, message: 'Sub-category created', data: subCategory })
}

export async function updateSubCategory(req, res) {
    const subCategory = await subCategoryService.updateSubCategory(req.params.id, req.body, req.file)
    res.json({ success: true, message: 'Sub-category updated', data: subCategory })
}

export async function deleteSubCategory(req, res) {
    const result = await subCategoryService.deleteSubCategory(req.params.id)
    res.json({ success: true, message: 'Sub-category deleted', data: result })
}
