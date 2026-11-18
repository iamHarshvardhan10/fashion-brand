import * as bannerService from '../services/banner.service.js'
import { isStaff } from '../middlewares/auth.js'

export async function listBanners(req, res) {
    // Hidden and out-of-schedule banners are only visible to staff
    const query = { ...req.validatedQuery, includeInactive: isStaff(req.user) && req.validatedQuery.includeInactive }
    const banners = await bannerService.listBanners(query)
    res.json({ success: true, data: banners })
}

export async function getBanner(req, res) {
    const banner = await bannerService.getBannerById(req.params.id)
    res.json({ success: true, data: banner })
}

export async function createBanner(req, res) {
    const banner = await bannerService.createBanner(req.body, req.files)
    res.status(201).json({ success: true, message: 'Banner created', data: banner })
}

export async function updateBanner(req, res) {
    const banner = await bannerService.updateBanner(req.params.id, req.body, req.files)
    res.json({ success: true, message: 'Banner updated', data: banner })
}

export async function deleteBanner(req, res) {
    const result = await bannerService.deleteBanner(req.params.id)
    res.json({ success: true, message: 'Banner deleted', data: result })
}
