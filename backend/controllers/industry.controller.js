import * as industryService from '../services/industry.service.js'
import { isStaff } from '../middlewares/auth.js'

export async function listIndustries(req, res) {
    const staff = isStaff(req.user)
    const query = { ...req.validatedQuery, includeInactive: staff && req.validatedQuery.includeInactive }
    const industries = await industryService.listIndustries(query, staff)
    res.json({ success: true, data: industries })
}

export async function getIndustry(req, res) {
    const industry = await industryService.getIndustry(req.params.id, isStaff(req.user))
    res.json({ success: true, data: industry })
}

export async function createIndustry(req, res) {
    const industry = await industryService.createIndustry(req.body, req.file)
    res.status(201).json({ success: true, message: 'Industry created', data: industry })
}

export async function updateIndustry(req, res) {
    const industry = await industryService.updateIndustry(req.params.id, req.body, req.file)
    res.json({ success: true, message: 'Industry updated', data: industry })
}

export async function deleteIndustry(req, res) {
    const result = await industryService.deleteIndustry(req.params.id)
    res.json({ success: true, message: 'Industry deleted', data: result })
}
