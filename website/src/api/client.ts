import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

// Access token lives in memory - never written to any storage - to eliminate
// XSS risk. The refresh token is stored in an httpOnly cookie set by the
// server, so JS cannot read or write it at all; the browser attaches it
// automatically on every credentialed request.
let accessToken: string | null = null;

export function getAccessToken() {
    return accessToken;
}

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function clearTokens() {
    accessToken = null;
    // The httpOnly refresh cookie can only be cleared by the server (POST /auth/logout).
    // Dropping the in-memory access token is enough to treat the user as logged out locally.
}

// Extend config to prevent infinite retry loops on persistent 401s.
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

client.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryableRequestConfig;

        // Skip retry for auth endpoints: a 401 from /auth/login means wrong
        // credentials (not an expired session), and /auth/refresh itself uses
        // a plain axios call that bypasses this interceptor entirely.
        const isAuthEndpoint = originalRequest.url?.startsWith("/auth/");
        if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // Plain axios call to avoid re-triggering this interceptor.
            // withCredentials ensures the httpOnly cookie is included.
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                null,
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                },
            );

            setAccessToken(data.access);
            originalRequest.headers.Authorization = `Bearer ${data.access}`;
            return client(originalRequest);
        } catch {
            clearTokens();
            window.location.href = "/login";
            return Promise.reject(error);
        }
    },
);

export default client;
