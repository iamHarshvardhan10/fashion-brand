import * as authService from '../services/auth.service.js'
import { publicUser } from '../utils/serializers.js'
import { clearSessionCookie, setSessionCookie } from '../utils/session.js'

export async function login(req, res) {
    const user = await authService.login(req.body)
    setSessionCookie(res, user)
    res.json({ success: true, message: 'Signed in', data: publicUser(user) })
}

export async function register(req, res) {
    const user = await authService.registerCustomer(req.body)
    setSessionCookie(res, user)
    res.status(201).json({ success: true, message: 'Account created', data: publicUser(user) })
}

export async function me(req, res) {
    res.json({ success: true, data: req.user })
}

export async function logout(req, res) {
    clearSessionCookie(res)
    res.json({ success: true, message: 'Signed out', data: null })
}

export async function logoutEverywhere(req, res) {
    await authService.logoutEverywhere(req.user.id)
    clearSessionCookie(res)
    res.json({ success: true, message: 'Signed out on all devices', data: null })
}

export async function changePassword(req, res) {
    const user = await authService.changePassword(req.user.id, req.body)
    setSessionCookie(res, user) // keep this device signed in with the new token version
    res.json({ success: true, message: 'Password updated', data: publicUser(user) })
}
