export type FieldError = { field: string; message: string };

// Every failed request is turned into this by services/apiConnector.ts
export class ApiError extends Error {
    status: number;
    errors: FieldError[];

    constructor(status: number, message: string, errors: FieldError[] = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }

    // { name: "Name must be at least 2 characters", ... }
    fieldErrors(): Record<string, string> {
        return Object.fromEntries(this.errors.map((e) => [e.field, e.message]));
    }
}

// For UI copy: "Validation failed" is replaced with something friendlier
export function errorMessage(error: unknown, fallback = "Something went wrong, please try again") {
    if (!(error instanceof ApiError)) return fallback;
    return error.message === "Validation failed" ? "Please fix the highlighted fields" : error.message;
}
