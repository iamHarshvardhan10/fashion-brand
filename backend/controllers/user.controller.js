import * as userService from '../services/user.service.js'

export async function listUsers(req, res) {
    const users = await userService.listUsers(req.validatedQuery)
    res.json({ success: true, data: users })
}

export async function createStaff(req, res) {
    const user = await userService.createStaff(req.body)
    res.status(201).json({ success: true, message: `${user.name} added to the team`, data: user })
}

export async function updateUser(req, res) {
    const user = await userService.updateUser(req.params.id, req.body, req.user)
    res.json({ success: true, message: 'Team member updated', data: user })
}
