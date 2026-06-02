import { render } from "preact";
import { LocationProvider } from "preact-iso";

import "@/style.css";
import { AuthProvider } from "@/context/auth";
import { AppRouter } from "@/router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";

export function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <LocationProvider>
                    <AppRouter />
                </LocationProvider>
            </AuthProvider>
            <Toaster />
        </ErrorBoundary>
    );
}

render(<App />, document.getElementById("app")!);
