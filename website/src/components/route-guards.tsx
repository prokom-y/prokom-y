import { useEffect } from "preact/hooks";
import { useLocation } from "preact-iso";
import type { ComponentType } from "preact";

import { isAuthenticated, isLoading } from "@/context/auth";

export function ProtectedRoute<P extends object>(Component: ComponentType<P>) {
    return function Protected(props: P) {
        const { route } = useLocation();

        useEffect(() => {
            if (!isLoading.value && !isAuthenticated.value) {
                route("/login");
            }
        }, [isLoading.value, isAuthenticated.value]);

        if (isLoading.value || !isAuthenticated.value) return null;
        return <Component {...props} />;
    };
}

export function GuestRoute<P extends object>(Component: ComponentType<P>) {
    return function Guest(props: P) {
        const { route } = useLocation();

        useEffect(() => {
            if (!isLoading.value && isAuthenticated.value) {
                route("/feed");
            }
        }, [isLoading.value, isAuthenticated.value]);

        if (isLoading.value || isAuthenticated.value) return null;
        return <Component {...props} />;
    };
}
