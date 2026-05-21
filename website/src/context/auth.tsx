import { signal, computed } from "@preact/signals";
import { createContext } from "preact";
import { useContext, useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";

import type { AuthUser } from "@/api/types";
import { login as apiLogin, logout as apiLogout, refreshToken as apiRefresh } from "@/api/auth";
import { getOwnProfile } from "@/api/accounts";
import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from "@/api/client";

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
            const storedRefresh = getRefreshToken();
            if (!storedRefresh) {
                isLoading.value = false;
                return;
            }
            try {
                const tokens = await apiRefresh(storedRefresh);
                setAccessToken(tokens.access);
                if (tokens.refresh) setRefreshToken(tokens.refresh);
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
        const tokens = await apiLogin(username, password);
        setAccessToken(tokens.access);
        setRefreshToken(tokens.refresh);
        user.value = await getOwnProfile();
    }

    async function logout() {
        const storedRefresh = getRefreshToken();
        if (storedRefresh) {
            try {
                await apiLogout(storedRefresh);
            } catch {
                // best-effort: blacklist the token server-side, but clear locally regardless
            }
        }
        clearTokens();
        user.value = null;
    }

    return <AuthContext.Provider value={{ login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
