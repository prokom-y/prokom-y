import { render } from "preact";
import { LocationProvider } from "preact-iso";

import "@/style.css";
import { AuthProvider } from "@/context/auth";
import { AppRouter } from "@/router";

export function App() {
    return (
        <AuthProvider>
            <LocationProvider>
                <AppRouter />
            </LocationProvider>
        </AuthProvider>
    );
}

render(<App />, document.getElementById("app")!);
