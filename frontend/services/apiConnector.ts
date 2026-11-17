import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type Method } from "axios";
import { ApiError, type FieldError } from "@/utils/apiError";
import { authEndpoints } from "./api";
import { handleUnauthorized } from "./authSession";

// Shape every backend response follows
export type ApiEnvelope<T> = { success: boolean; message?: string; data: T; errors?: FieldError[] };

export const axiosInstance = axios.create({
    withCredentials: true, // send the httpOnly session cookie
    timeout: 30_000,
});

// Requests where a 401 is an expected answer, not an expired session
const NO_SESSION_REDIRECT = [authEndpoints.LOGIN_API, authEndpoints.ME_API];

// Normalise every failure into ApiError so components only handle one error type
axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<Partial<ApiEnvelope<unknown>>>) => {
        if (!error.response) {
            return Promise.reject(new ApiError(0, "Can't reach the server. Is the backend running?"));
        }
        const { status, data } = error.response;
        if (status === 401 && !NO_SESSION_REDIRECT.includes(error.config?.url ?? "")) handleUnauthorized();
        return Promise.reject(new ApiError(status, data?.message ?? `Request failed (${status})`, data?.errors ?? []));
    },
);

export function apiConnector<T = unknown>(
    method: Method,
    url: string,
    bodyData?: unknown,
    headers?: AxiosRequestConfig["headers"],
    params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiEnvelope<T>>> {
    return axiosInstance.request<ApiEnvelope<T>>({
        method,
        url,
        data: bodyData, // FormData is sent as multipart automatically
        headers,
        params,
    });
}
