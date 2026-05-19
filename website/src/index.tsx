import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import "@/style.css";
import NotFoundPage from "@/pages/_404";
import HomePage from "@/pages/Home";

export function App() {
    return (
        <LocationProvider>
            <main>
                <Router>
                    <Route path="/" component={HomePage} />
                    <Route default component={NotFoundPage} />
                </Router>
            </main>
        </LocationProvider>
    );
}

render(<App />, document.getElementById("app")!);
