import client from "./client";
import type { AuthUser, AccessTokenResponse } from "./types";

export async function login(username: string, password: string): Promise<AccessTokenResponse> {
    const { data } = await client.post<AccessTokenResponse>("/auth/login", { username, password });
    return data;
}

export async function register(
    username: string,
    email: string,
    password: string,
): Promise<Pick<AuthUser, "username" | "email">> {
    const { data } = await client.post<Pick<AuthUser, "username" | "email">>("/auth/register", {
        username,
        email,
        password,
    });
    return data;
}

// Refresh token is sent automatically via the httpOnly cookie.
export async function refreshToken(): Promise<AccessTokenResponse> {
    const { data } = await client.post<AccessTokenResponse>("/auth/refresh", null);
    return data;
}

// The server blacklists the refresh cookie and clears it.
export async function logout(): Promise<void> {
    await client.post("/auth/logout");
}
