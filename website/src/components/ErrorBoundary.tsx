import { Component } from "preact";
import type { ComponentChildren } from "preact";

interface Props {
    children: ComponentChildren;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error("[ErrorBoundary]", error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="text-center">
                        <p className="mb-2 font-heading text-5xl font-bold text-primary">Oops</p>
                        <h1 className="mb-2 font-heading text-xl font-semibold">
                            Something went wrong
                        </h1>
                        <p className="mb-8 text-sm text-muted-foreground">
                            An unexpected error occurred. Please refresh the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                            Refresh page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
