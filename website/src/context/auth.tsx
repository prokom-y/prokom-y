import { signal, computed } from "@preact/signals";
import { createContext } from "preact";
import { useContext, useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";

import type { AuthUser } from "@/api/types";
import {
    login as apiLogin,
    logout as apiLogout,
    refreshToken as apiRefresh,
} from "@/api/auth";
import { getOwnProfile } from "@/api/accounts";
import { setAccessToken, clearTokens } from "@/api/client";

export const user = signal<AuthUser | null>(null);
export const isLoading = signal<boolean>(true);
export const isAuthenticated = computed(() => user.value !== null);

interface AuthContextValue {
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ComponentChildren }) {
    useEffect(() => {
        const hydrate = async () => {
            try {
                // No stored token to check - just attempt a refresh. The httpOnly
                // cookie is sent automatically; a 401 means no valid session exists.
                const { access } = await apiRefresh();
                setAccessToken(access);
                user.value = await getOwnProfile();
            } catch {
                clearTokens();
            } finally {
                isLoading.value = false;
            }
        };
        hydrate();
    }, []);

    async function login(username: string, password: string) {
        const { access } = await apiLogin(username, password);
        setAccessToken(access);
        user.value = await getOwnProfile();
    }

    async function logout() {
        try {
            await apiLogout();
        } catch {
            // best-effort: clear locally regardless of server response
        }
        clearTokens();
        user.value = null;
    }

    return (
        <AuthContext.Provider value={{ login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
