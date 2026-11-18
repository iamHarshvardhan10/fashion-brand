import * as collectionService from '../services/collection.service.js'
import { isStaff } from '../middlewares/auth.js'

export async function listCollections(req, res) {
    // Hidden and expired collections are only visible to staff
    const query = { ...req.validatedQuery, includeInactive: isStaff(req.user) && req.validatedQuery.includeInactive }
    const collections = await collectionService.listCollections(query)
    res.json({ success: true, data: collections })
}

export async function getCollection(req, res) {
    const collection = await collectionService.getCollection(req.params.id, isStaff(req.user))
    res.json({ success: true, data: collection })
}

export async function createCollection(req, res) {
    const collection = await collectionService.createCollection(req.body, req.file)
    res.status(201).json({ success: true, message: 'Collection created', data: collection })
}

export async function updateCollection(req, res) {
    const collection = await collectionService.updateCollection(req.params.id, req.body, req.file)
    res.json({ success: true, message: 'Collection updated', data: collection })
}

export async function deleteCollection(req, res) {
    const result = await collectionService.deleteCollection(req.params.id)
    res.json({ success: true, message: 'Collection deleted', data: result })
}
