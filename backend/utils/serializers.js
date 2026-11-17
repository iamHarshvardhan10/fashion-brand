// Never send password hashes or token versions to the client
export function publicUser(user) {
    if (!user) return null
    const { passwordHash, tokenVersion, ...rest } = user // eslint-disable-line no-unused-vars
    return rest
}
