import client from "./client";
import type { AuthUser, TokenPair } from "./types";

export async function login(username: string, password: string): Promise<TokenPair> {
    const { data } = await client.post<TokenPair>("/auth/login", { username, password });
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

export async function logout(refresh: string): Promise<void> {
    await client.post("/auth/logout", { refresh });
}

export async function refreshToken(refresh: string): Promise<{ access: string; refresh?: string }> {
    const { data } = await client.post<{ access: string; refresh?: string }>("/auth/refresh", {
        refresh,
    });
    return data;
}
