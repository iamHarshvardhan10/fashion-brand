import * as productService from '../services/product.service.js'
import { isStaff } from '../middlewares/auth.js'

// Staff see drafts/archived products and cost prices; everyone else gets live products only.

export async function listProducts(req, res) {
    const staff = isStaff(req.user) && req.validatedQuery.includeAll === true
    const result = await productService.listProducts(req.validatedQuery, staff)
    res.json({ success: true, data: result })
}

export async function getProduct(req, res) {
    const product = await productService.getProduct(req.params.id, isStaff(req.user))
    res.json({ success: true, data: product })
}

export async function createProduct(req, res) {
    const product = await productService.createProduct(req.body, req.user.id)
    res.status(201).json({ success: true, message: 'Product created', data: product })
}

export async function updateProduct(req, res) {
    const product = await productService.updateProduct(req.params.id, req.body, req.user.id)
    res.json({ success: true, message: 'Product saved', data: product })
}

export async function deleteProduct(req, res) {
    const result = await productService.deleteProduct(req.params.id)
    res.json({ success: true, message: 'Product deleted', data: result })
}

export async function addImages(req, res) {
    const images = await productService.addImages(req.params.id, req.files, req.body.meta)
    res.status(201).json({ success: true, message: 'Images added', data: images })
}

export async function updateImage(req, res) {
    const images = await productService.updateImage(req.params.id, req.params.imageId, req.body)
    res.json({ success: true, data: images })
}

export async function reorderImages(req, res) {
    const images = await productService.reorderImages(req.params.id, req.body.ids)
    res.json({ success: true, data: images })
}

export async function removeImage(req, res) {
    const images = await productService.removeImage(req.params.id, req.params.imageId)
    res.json({ success: true, message: 'Image removed', data: images })
}
