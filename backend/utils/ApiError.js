// Throw this from services/controllers; the error middleware turns it into a JSON response.
export default class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message)
        this.statusCode = statusCode
        this.details = details
    }

    static badRequest(message, details) {
        return new ApiError(400, message, details)
    }

    static notFound(message = 'Resource not found') {
        return new ApiError(404, message)
    }

    static conflict(message) {
        return new ApiError(409, message)
    }
}
