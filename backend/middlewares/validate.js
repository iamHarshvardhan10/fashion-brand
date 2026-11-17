import ApiError from '../utils/ApiError.js'

// validate({ body, params, query }) — each key is an optional zod schema.
// Parsed (coerced) values replace the raw ones on req.
export default function validate(schemas) {
    return (req, res, next) => {
        const errors = []

        for (const key of ['params', 'query', 'body']) {
            if (!schemas[key]) continue
            const result = schemas[key].safeParse(req[key] ?? {})
            if (!result.success) {
                for (const issue of result.error.issues) {
                    errors.push({ field: issue.path.join('.') || key, message: issue.message })
                }
            } else if (key === 'query') {
                // req.query is a read-only getter in Express 5
                req.validatedQuery = result.data
            } else {
                req[key] = result.data
            }
        }

        if (errors.length) return next(ApiError.badRequest('Validation failed', errors))
        next()
    }
}
