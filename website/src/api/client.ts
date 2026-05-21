import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

// Access token lives in memory only - never written to storage - to reduce XSS
// exposure. Refresh token goes to localStorage for persistence across page
// reloads. This is a deliberate tradeoff: localStorage refresh tokens are
// readable by JS, but they rotate on every use and are blacklisted on logout,
// which limits the damage window compared to a long-lived access token.
let accessToken: string | null = null;

const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken() {
    return accessToken;
}

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
    if (token === null) {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
}

export function clearTokens() {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Extend request config to track whether a retry has already been attempted,
// so the response interceptor doesn't retry infinitely on a 401.
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
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

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearTokens();
            window.location.href = "/login";
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // Use a plain axios call - not the client instance - to avoid
            // triggering this interceptor again on the refresh request itself.
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                { refresh: refreshToken },
                { headers: { "Content-Type": "application/json" } },
            );

            setAccessToken(data.access);
            // simplejwt rotates the refresh token on each use
            if (data.refresh) {
                setRefreshToken(data.refresh);
            }

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
