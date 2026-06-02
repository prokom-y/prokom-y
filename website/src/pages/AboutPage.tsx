export default function AboutPage() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-12">
            <h1 className="mb-2 font-heading text-2xl font-bold">About Y</h1>
            <p className="mb-8 text-sm text-muted-foreground">A place to share what's on your mind.</p>

            <div className="space-y-8 text-sm leading-relaxed">
                <section>
                    <p className="text-muted-foreground">
                        Y is a microblogging platform where you can post short updates, follow other
                        users, like and comment on posts, and discover content from the community.
                        Think of it as a minimal, open-source take on the social web.
                    </p>
                </section>

                <section>
                    <h2 className="mb-3 font-heading text-base font-semibold">Tech Stack</h2>
                    <div className="space-y-2 text-muted-foreground">
                        <div className="flex gap-2">
                            <span className="w-24 shrink-0 font-medium text-foreground">Frontend</span>
                            <span>Preact · TypeScript · Vite · Tailwind CSS · shadcn/ui</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="w-24 shrink-0 font-medium text-foreground">Backend</span>
                            <span>Django · Django REST Framework · PostgreSQL</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="w-24 shrink-0 font-medium text-foreground">Auth</span>
                            <span>JWT with httpOnly refresh-token cookie</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="mb-3 font-heading text-base font-semibold">Source Code</h2>
                    <p className="text-muted-foreground">
                        The project is open source. Browse the code, open issues, or contribute on{" "}
                        <a
                            href="https://github.com/prokom-y/prokom-y"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                        >
                            GitHub
                        </a>
                        .
                    </p>
                </section>
            </div>
        </div>
    );
}
