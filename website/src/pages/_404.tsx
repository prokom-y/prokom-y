export default function NotFoundPage() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
            <p className="mb-2 font-heading text-6xl font-bold text-primary">404</p>
            <h1 className="mb-2 font-heading text-xl font-semibold">Page not found</h1>
            <p className="mb-8 text-sm text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <a
                href="/"
                className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
                Go home
            </a>
        </div>
    );
}
